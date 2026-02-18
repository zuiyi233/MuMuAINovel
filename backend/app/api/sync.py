"""Shadow sync API.

Accepts a project-scoped bundle and applies idempotent upserts with
full-replace semantics for provided entity collections.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.common import verify_project_access
from app.database import get_db
from app.logger import get_logger
from app.models.chapter import Chapter
from app.models.character import Character
from app.models.foreshadow import Foreshadow
from app.models.outline import Outline
from app.models.project import Project
from app.models.relationship import CharacterRelationship, Organization, OrganizationMember

router = APIRouter(prefix="/sync", tags=["shadow-sync"])
logger = get_logger(__name__)


class ShadowSyncPayload(BaseModel):
    project_id: str
    projects: list[dict[str, Any]] | None = None
    outlines: list[dict[str, Any]] | None = None
    chapters: list[dict[str, Any]] | None = None
    characters: list[dict[str, Any]] | None = None
    organizations: list[dict[str, Any]] | None = None
    organization_members: list[dict[str, Any]] | None = None
    relationships: list[dict[str, Any]] | None = None
    foreshadows: list[dict[str, Any]] | None = None


PROJECT_FIELDS = {
    "title",
    "description",
    "theme",
    "genre",
    "target_words",
    "current_words",
    "status",
    "wizard_status",
    "wizard_step",
    "outline_mode",
    "world_time_period",
    "world_location",
    "world_atmosphere",
    "world_rules",
    "chapter_count",
    "narrative_perspective",
    "character_count",
    "active_skill_key",
}

OUTLINE_FIELDS = {"project_id", "title", "content", "structure", "order_index"}

CHAPTER_FIELDS = {
    "project_id",
    "chapter_number",
    "title",
    "content",
    "summary",
    "word_count",
    "status",
    "outline_id",
    "sub_index",
    "expansion_plan",
}

CHARACTER_FIELDS = {
    "project_id",
    "name",
    "age",
    "gender",
    "is_organization",
    "role_type",
    "personality",
    "background",
    "appearance",
    "relationships",
    "organization_type",
    "organization_purpose",
    "organization_members",
    "status",
    "status_changed_chapter",
    "current_state",
    "state_updated_chapter",
    "main_career_id",
    "main_career_stage",
    "sub_careers",
    "avatar_url",
    "traits",
}

ORGANIZATION_FIELDS = {
    "character_id",
    "project_id",
    "parent_org_id",
    "level",
    "power_level",
    "member_count",
    "location",
    "motto",
    "color",
}

ORGANIZATION_MEMBER_FIELDS = {
    "organization_id",
    "character_id",
    "position",
    "rank",
    "status",
    "joined_at",
    "left_at",
    "loyalty",
    "contribution",
    "source",
    "notes",
}

RELATIONSHIP_FIELDS = {
    "project_id",
    "character_from_id",
    "character_to_id",
    "relationship_type_id",
    "relationship_name",
    "intimacy_level",
    "status",
    "description",
    "started_at",
    "ended_at",
    "source",
}

FORESHADOW_FIELDS = {
    "project_id",
    "title",
    "content",
    "hint_text",
    "resolution_text",
    "source_type",
    "source_memory_id",
    "source_analysis_id",
    "plant_chapter_id",
    "plant_chapter_number",
    "target_resolve_chapter_id",
    "target_resolve_chapter_number",
    "actual_resolve_chapter_id",
    "actual_resolve_chapter_number",
    "status",
    "is_long_term",
    "importance",
    "strength",
    "subtlety",
    "urgency",
    "related_characters",
    "related_foreshadow_ids",
    "tags",
    "category",
    "notes",
    "resolution_notes",
    "auto_remind",
    "remind_before_chapters",
    "include_in_context",
    "planted_at",
    "resolved_at",
}


def _parse_datetime(raw: Any) -> datetime | None:
    if raw is None:
        return None
    if isinstance(raw, datetime):
        return raw
    if isinstance(raw, str):
        normalized = raw.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def _require_ids(items: list[dict[str, Any]], name: str) -> set[str]:
    ids: set[str] = set()
    for index, item in enumerate(items):
        item_id = item.get("id")
        if not isinstance(item_id, str) or not item_id:
            raise HTTPException(status_code=400, detail=f"{name}[{index}] missing valid id")
        if item_id in ids:
            raise HTTPException(status_code=400, detail=f"duplicate {name} id: {item_id}")
        ids.add(item_id)
    return ids


def _assert_project_id_consistency(items: list[dict[str, Any]], project_id: str, name: str) -> None:
    for index, item in enumerate(items):
        if "project_id" in item and item.get("project_id") != project_id:
            raise HTTPException(
                status_code=400,
                detail=f"{name}[{index}].project_id mismatch",
            )


def _ensure_ref(
    *,
    value: Any,
    allowed_ids: set[str],
    entity_name: str,
    index: int,
    field_name: str,
) -> None:
    if value is None:
        return
    if not isinstance(value, str) or value not in allowed_ids:
        raise HTTPException(
            status_code=400,
            detail=f"{entity_name}[{index}].{field_name} invalid reference",
        )


async def _fetch_project_id_set(
    db: AsyncSession,
    model: Any,
    project_id: str,
    id_column: Any,
) -> set[str]:
    result = await db.execute(select(id_column).where(model.project_id == project_id))
    return {row[0] for row in result.all() if isinstance(row[0], str)}


async def _upsert_entities(
    db: AsyncSession,
    *,
    model: Any,
    items: list[dict[str, Any]],
    fields: set[str],
    converters: dict[str, Callable[[Any], Any]] | None = None,
) -> int:
    if not items:
        return 0

    ids = [item["id"] for item in items]
    existing_result = await db.execute(select(model).where(model.id.in_(ids)))
    existing_map = {obj.id: obj for obj in existing_result.scalars().all()}

    upserted = 0
    for item in items:
        item_id = item["id"]
        obj = existing_map.get(item_id)
        if obj is None:
            obj = model(id=item_id)
            db.add(obj)

        for field in fields:
            if field not in item:
                continue
            value = item[field]
            if converters and field in converters:
                value = converters[field](value)
                if value is None and item[field] is not None:
                    continue
            setattr(obj, field, value)

        upserted += 1

    return upserted


async def _delete_missing_project_entities(
    db: AsyncSession,
    *,
    model: Any,
    project_id: str,
    keep_ids: set[str],
) -> int:
    stmt = delete(model).where(model.project_id == project_id)
    if keep_ids:
        stmt = stmt.where(~model.id.in_(keep_ids))
    result = await db.execute(stmt)
    return int(result.rowcount or 0)


async def _delete_missing_org_members(
    db: AsyncSession,
    *,
    organization_scope_ids: set[str],
    keep_ids: set[str],
) -> int:
    if not organization_scope_ids:
        return 0

    stmt = delete(OrganizationMember).where(OrganizationMember.organization_id.in_(organization_scope_ids))
    if keep_ids:
        stmt = stmt.where(~OrganizationMember.id.in_(keep_ids))
    result = await db.execute(stmt)
    return int(result.rowcount or 0)


@router.post("/shadow", summary="sync project shadow bundle")
async def sync_shadow(
    payload: ShadowSyncPayload,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    user_id = getattr(request.state, "user_id", None)
    project = await verify_project_access(payload.project_id, user_id, db)

    provided_projects = payload.projects is not None
    provided_outlines = payload.outlines is not None
    provided_chapters = payload.chapters is not None
    provided_characters = payload.characters is not None
    provided_organizations = payload.organizations is not None
    provided_organization_members = payload.organization_members is not None
    provided_relationships = payload.relationships is not None
    provided_foreshadows = payload.foreshadows is not None

    projects_payload = payload.projects or []
    outlines_payload = payload.outlines or []
    chapters_payload = payload.chapters or []
    characters_payload = payload.characters or []
    organizations_payload = payload.organizations or []
    organization_members_payload = payload.organization_members or []
    relationships_payload = payload.relationships or []
    foreshadows_payload = payload.foreshadows or []

    project_ids = _require_ids(projects_payload, "projects") if provided_projects else set()
    outline_ids = _require_ids(outlines_payload, "outlines") if provided_outlines else set()
    chapter_ids = _require_ids(chapters_payload, "chapters") if provided_chapters else set()
    character_ids = _require_ids(characters_payload, "characters") if provided_characters else set()
    organization_ids = _require_ids(organizations_payload, "organizations") if provided_organizations else set()
    organization_member_ids = (
        _require_ids(organization_members_payload, "organization_members") if provided_organization_members else set()
    )
    relationship_ids = _require_ids(relationships_payload, "relationships") if provided_relationships else set()
    foreshadow_ids = _require_ids(foreshadows_payload, "foreshadows") if provided_foreshadows else set()

    if provided_projects:
        for index, item in enumerate(projects_payload):
            if item.get("id") != project.id:
                raise HTTPException(status_code=400, detail=f"projects[{index}].id must equal project_id")

    if provided_outlines:
        _assert_project_id_consistency(outlines_payload, project.id, "outlines")
    if provided_chapters:
        _assert_project_id_consistency(chapters_payload, project.id, "chapters")
    if provided_characters:
        _assert_project_id_consistency(characters_payload, project.id, "characters")
    if provided_organizations:
        _assert_project_id_consistency(organizations_payload, project.id, "organizations")
    if provided_relationships:
        _assert_project_id_consistency(relationships_payload, project.id, "relationships")
    if provided_foreshadows:
        _assert_project_id_consistency(foreshadows_payload, project.id, "foreshadows")

    db_character_ids: set[str] = set()
    db_outline_ids: set[str] = set()
    db_organization_ids: set[str] = set()
    db_chapter_ids: set[str] = set()

    need_character_refs = provided_organizations or provided_organization_members or provided_relationships
    if need_character_refs:
        db_character_ids = await _fetch_project_id_set(db, Character, project.id, Character.id)

    if provided_chapters:
        db_outline_ids = await _fetch_project_id_set(db, Outline, project.id, Outline.id)

    if provided_organization_members:
        db_organization_ids = await _fetch_project_id_set(db, Organization, project.id, Organization.id)

    if provided_foreshadows:
        db_chapter_ids = await _fetch_project_id_set(db, Chapter, project.id, Chapter.id)

    # Reference validation: payload IDs OR same-project DB IDs
    if provided_organizations:
        allowed_character_ids = character_ids | db_character_ids
        for index, item in enumerate(organizations_payload):
            _ensure_ref(
                value=item.get("character_id"),
                allowed_ids=allowed_character_ids,
                entity_name="organizations",
                index=index,
                field_name="character_id",
            )

    if provided_organization_members:
        allowed_org_ids = organization_ids | db_organization_ids
        allowed_character_ids = character_ids | db_character_ids
        for index, item in enumerate(organization_members_payload):
            _ensure_ref(
                value=item.get("organization_id"),
                allowed_ids=allowed_org_ids,
                entity_name="organization_members",
                index=index,
                field_name="organization_id",
            )
            _ensure_ref(
                value=item.get("character_id"),
                allowed_ids=allowed_character_ids,
                entity_name="organization_members",
                index=index,
                field_name="character_id",
            )

    if provided_chapters:
        allowed_outline_ids = outline_ids | db_outline_ids
        for index, item in enumerate(chapters_payload):
            _ensure_ref(
                value=item.get("outline_id"),
                allowed_ids=allowed_outline_ids,
                entity_name="chapters",
                index=index,
                field_name="outline_id",
            )

    if provided_relationships:
        allowed_character_ids = character_ids | db_character_ids
        for index, item in enumerate(relationships_payload):
            _ensure_ref(
                value=item.get("character_from_id"),
                allowed_ids=allowed_character_ids,
                entity_name="relationships",
                index=index,
                field_name="character_from_id",
            )
            _ensure_ref(
                value=item.get("character_to_id"),
                allowed_ids=allowed_character_ids,
                entity_name="relationships",
                index=index,
                field_name="character_to_id",
            )

    if provided_foreshadows:
        allowed_chapter_ids = chapter_ids | db_chapter_ids
        for index, item in enumerate(foreshadows_payload):
            _ensure_ref(
                value=item.get("plant_chapter_id"),
                allowed_ids=allowed_chapter_ids,
                entity_name="foreshadows",
                index=index,
                field_name="plant_chapter_id",
            )
            _ensure_ref(
                value=item.get("target_resolve_chapter_id"),
                allowed_ids=allowed_chapter_ids,
                entity_name="foreshadows",
                index=index,
                field_name="target_resolve_chapter_id",
            )
            _ensure_ref(
                value=item.get("actual_resolve_chapter_id"),
                allowed_ids=allowed_chapter_ids,
                entity_name="foreshadows",
                index=index,
                field_name="actual_resolve_chapter_id",
            )

    upserted = {
        "projects": 0,
        "outlines": 0,
        "chapters": 0,
        "characters": 0,
        "organizations": 0,
        "organization_members": 0,
        "relationships": 0,
        "foreshadows": 0,
    }

    deleted = {
        "outlines": 0,
        "chapters": 0,
        "characters": 0,
        "organizations": 0,
        "organization_members": 0,
        "relationships": 0,
        "foreshadows": 0,
    }

    if provided_projects and projects_payload:
        upserted["projects"] = await _upsert_entities(
            db,
            model=Project,
            items=projects_payload,
            fields=PROJECT_FIELDS,
        )

    if provided_outlines:
        upserted["outlines"] = await _upsert_entities(
            db,
            model=Outline,
            items=outlines_payload,
            fields=OUTLINE_FIELDS,
        )

    if provided_chapters:
        upserted["chapters"] = await _upsert_entities(
            db,
            model=Chapter,
            items=chapters_payload,
            fields=CHAPTER_FIELDS,
        )

    if provided_characters:
        upserted["characters"] = await _upsert_entities(
            db,
            model=Character,
            items=characters_payload,
            fields=CHARACTER_FIELDS,
        )

    if provided_organizations:
        upserted["organizations"] = await _upsert_entities(
            db,
            model=Organization,
            items=organizations_payload,
            fields=ORGANIZATION_FIELDS,
        )

    if provided_organization_members:
        upserted["organization_members"] = await _upsert_entities(
            db,
            model=OrganizationMember,
            items=organization_members_payload,
            fields=ORGANIZATION_MEMBER_FIELDS,
        )

    if provided_relationships:
        upserted["relationships"] = await _upsert_entities(
            db,
            model=CharacterRelationship,
            items=relationships_payload,
            fields=RELATIONSHIP_FIELDS,
        )

    if provided_foreshadows:
        upserted["foreshadows"] = await _upsert_entities(
            db,
            model=Foreshadow,
            items=foreshadows_payload,
            fields=FORESHADOW_FIELDS,
            converters={
                "planted_at": _parse_datetime,
                "resolved_at": _parse_datetime,
            },
        )

    # Full-replace delete (only for collections provided in payload)
    if provided_organization_members:
        org_scope_result = await db.execute(select(Organization.id).where(Organization.project_id == project.id))
        org_scope_ids = {row[0] for row in org_scope_result.all() if isinstance(row[0], str)}
        deleted["organization_members"] = await _delete_missing_org_members(
            db,
            organization_scope_ids=org_scope_ids,
            keep_ids=organization_member_ids,
        )

    if provided_relationships:
        deleted["relationships"] = await _delete_missing_project_entities(
            db,
            model=CharacterRelationship,
            project_id=project.id,
            keep_ids=relationship_ids,
        )

    if provided_foreshadows:
        deleted["foreshadows"] = await _delete_missing_project_entities(
            db,
            model=Foreshadow,
            project_id=project.id,
            keep_ids=foreshadow_ids,
        )

    if provided_chapters:
        deleted["chapters"] = await _delete_missing_project_entities(
            db,
            model=Chapter,
            project_id=project.id,
            keep_ids=chapter_ids,
        )

    if provided_organizations:
        deleted["organizations"] = await _delete_missing_project_entities(
            db,
            model=Organization,
            project_id=project.id,
            keep_ids=organization_ids,
        )

    if provided_characters:
        deleted["characters"] = await _delete_missing_project_entities(
            db,
            model=Character,
            project_id=project.id,
            keep_ids=character_ids,
        )

    if provided_outlines:
        deleted["outlines"] = await _delete_missing_project_entities(
            db,
            model=Outline,
            project_id=project.id,
            keep_ids=outline_ids,
        )

    await db.commit()

    logger.info(
        "shadow sync completed: project_id=%s, user_id=%s, upserted=%s, deleted=%s",
        project.id,
        user_id,
        upserted,
        deleted,
    )

    return {
        "ok": True,
        "project_id": project.id,
        "upserted": upserted,
        "deleted": deleted,
    }

