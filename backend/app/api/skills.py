import asyncio
import json
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Deque, Dict, List

from app.database import get_db
from app.user_manager import User
from app.logger import get_logger
from app.models.settings import Settings
from app.models.skill_spec import SkillSpec
from app.models.skill_sync_audit import SkillSyncAudit
from app.api.settings import require_login
from app.schemas.skills import (
    SkillListResponse,
    SkillSpecResponse,
    SkillSyncResponse,
    SkillActivateRequest,
)
from app.services.skills_service import (
    upsert_builtin_skills,
    parse_preferences,
    dump_preferences,
)


logger = get_logger(__name__)
router = APIRouter(prefix="/skills", tags=["技能管理"])

SYNC_RATE_LIMIT = 3
SYNC_RATE_WINDOW_SECONDS = 60

_sync_attempts_by_user: Dict[str, Deque[float]] = defaultdict(deque)
_sync_locks_by_user: Dict[str, asyncio.Lock] = {}
_sync_state_lock = asyncio.Lock()


def _ceil_positive_seconds(value: float) -> int:
    if value <= 1:
        return 1
    integer = int(value)
    return integer if integer == value else integer + 1


async def _consume_user_sync_quota(user_id: str) -> int | None:
    now = time.time()
    cutoff = now - SYNC_RATE_WINDOW_SECONDS

    async with _sync_state_lock:
        attempts = _sync_attempts_by_user[user_id]
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()

        if len(attempts) >= SYNC_RATE_LIMIT:
            retry_after = (attempts[0] + SYNC_RATE_WINDOW_SECONDS) - now
            return _ceil_positive_seconds(retry_after)

        attempts.append(now)
        return None


async def _get_user_sync_lock(user_id: str) -> asyncio.Lock:
    async with _sync_state_lock:
        lock = _sync_locks_by_user.get(user_id)
        if lock is None:
            lock = asyncio.Lock()
            _sync_locks_by_user[user_id] = lock
        return lock


async def _persist_sync_audit(
    db: AsyncSession,
    *,
    user_id: str,
    duration_ms: int,
    roots_used: List[str],
    discovered: int,
    upserted: int,
    skipped: int,
    errors: int,
    deleted: int,
    success: bool,
    error_summary: str | None,
) -> None:
    safe_roots_used = [
        root_label for root_label in roots_used if root_label in {"repo", "global"}
    ]
    audit = SkillSyncAudit(
        user_id=user_id,
        duration_ms=duration_ms,
        roots_used=json.dumps(safe_roots_used, ensure_ascii=False),
        discovered=discovered,
        upserted=upserted,
        skipped=skipped,
        errors=errors,
        deleted=deleted,
        success=success,
        error_summary=error_summary,
    )
    try:
        db.add(audit)
        await db.commit()
    except Exception as exc:
        try:
            await db.rollback()
        except Exception:
            pass
        logger.warning(
            "skills_sync_audit_persist_failed user_id=%s error=%s", user_id, exc
        )


@router.post("/sync", response_model=SkillSyncResponse)
async def sync_skills(
    user: User = Depends(require_login),
    db: AsyncSession = Depends(get_db),
):
    user_id = str(user.user_id)
    started = time.time()

    discovered = 0
    upserted = 0
    skipped = 0
    errors = 0
    deleted = 0
    roots_used: List[str] = []
    success = False
    error_summary: str | None = None

    try:
        retry_after = await _consume_user_sync_quota(user_id)
        if retry_after is not None:
            error_summary = "rate_limited"
            raise HTTPException(
                status_code=429,
                detail="同步过于频繁，请稍后重试",
                headers={"Retry-After": str(retry_after)},
            )

        lock = await _get_user_sync_lock(user_id)
        async with lock:
            (
                discovered,
                upserted,
                skipped,
                errors,
                deleted,
                roots_used,
                error_messages,
            ) = await upsert_builtin_skills(db)
            success = True
            return SkillSyncResponse(
                discovered=discovered,
                upserted=upserted,
                skipped=skipped,
                errors=errors,
                deleted=deleted,
                roots_used=roots_used,
                error_messages=error_messages,
            )
    except HTTPException:
        raise
    except Exception:
        error_summary = "sync_failed"
        raise
    finally:
        duration_ms = int((time.time() - started) * 1000)
        safe_roots_used = [
            root_label for root_label in roots_used if root_label in {"repo", "global"}
        ]
        logger.info(
            "skills_sync_audit user_id=%s duration_ms=%s roots_used=%s discovered=%s upserted=%s skipped=%s errors=%s deleted=%s success=%s",
            user_id,
            duration_ms,
            safe_roots_used,
            discovered,
            upserted,
            skipped,
            errors,
            deleted,
            success,
        )
        await _persist_sync_audit(
            db,
            user_id=user_id,
            duration_ms=duration_ms,
            roots_used=safe_roots_used,
            discovered=discovered,
            upserted=upserted,
            skipped=skipped,
            errors=errors,
            deleted=deleted,
            success=success,
            error_summary=error_summary,
        )


@router.get("", response_model=SkillListResponse)
async def list_skills(
    user: User = Depends(require_login),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SkillSpec).order_by(SkillSpec.updated_at.desc()))
    items = result.scalars().all()
    return SkillListResponse(
        items=[
            SkillSpecResponse(
                skill_key=i.skill_key,
                name=i.name,
                description=i.description,
                allowed_tools=i.allowed_tools,
                api_provider_override=i.api_provider_override,
                model_override=i.model_override,
                temperature_override=i.temperature_override,
                max_tokens_override=i.max_tokens_override,
                is_builtin=i.is_builtin,
                updated_at=i.updated_at,
            )
            for i in items
        ]
    )


@router.post("/activate")
async def activate_skill(
    data: SkillActivateRequest,
    user: User = Depends(require_login),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settings).where(Settings.user_id == user.user_id))
    settings = result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=404, detail="未找到用户设置")

    if data.skill_key:
        s = await db.execute(
            select(SkillSpec).where(SkillSpec.skill_key == data.skill_key)
        )
        if not s.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="技能不存在")

    prefs = parse_preferences(settings.preferences)
    if data.skill_key:
        prefs["active_skill_key"] = data.skill_key
    else:
        prefs.pop("active_skill_key", None)
    settings.preferences = dump_preferences(prefs)
    await db.commit()
    return {"success": True, "active_skill_key": prefs.get("active_skill_key")}
