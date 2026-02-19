from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional, Tuple, List
import json
import uuid
import yaml

from app.config import PROJECT_ROOT


MAX_SKILL_MD_BYTES = 256 * 1024


@dataclass
class ParsedSkill:
    skill_key: str
    name: str
    description: Optional[str]
    allowed_tools: Optional[str]
    api_provider_override: Optional[str]
    model_override: Optional[str]
    temperature_override: Optional[str]
    max_tokens_override: Optional[str]
    content: str
    source_path: str


def find_git_root(start: Optional[Path] = None) -> Optional[Path]:
    current = (start or PROJECT_ROOT).resolve()
    for candidate in [current, *current.parents]:
        if (candidate / ".git").exists():
            return candidate
    return None


def get_repo_root() -> Path:
    git_root = find_git_root(PROJECT_ROOT)
    if git_root is not None:
        return git_root
    return PROJECT_ROOT


def get_global_skills_root() -> Path:
    return Path.home() / ".config" / "opencode" / "skills"


def get_skills_root() -> Path:
    repo_skills_root = get_repo_root() / ".opencode" / "skills"
    if repo_skills_root.is_dir():
        return repo_skills_root

    global_skills_root = get_global_skills_root()
    if global_skills_root.is_dir():
        return global_skills_root

    return repo_skills_root


def get_skills_roots() -> List[Tuple[str, Path]]:
    return [
        ("repo", get_repo_root() / ".opencode" / "skills"),
        ("global", get_global_skills_root()),
    ]


def _normalize_text(text: str) -> str:
    return text.lstrip("\ufeff").replace("\r\n", "\n").replace("\r", "\n")


def _validate_required_string(data: Dict[str, object], field_name: str) -> str:
    value = data.get(field_name)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"SKILL.md frontmatter 字段 {field_name} 必须为非空字符串")
    return value.strip()


def _normalize_allowed_tools(value: object) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, str):
        if not value.strip():
            raise ValueError("SKILL.md frontmatter 字段 allowed-tools 不能为空字符串")
        return value.strip()
    if isinstance(value, list):
        if not value:
            raise ValueError("SKILL.md frontmatter 字段 allowed-tools 不能为空列表")
        if not all(isinstance(item, str) and item.strip() for item in value):
            raise ValueError(
                "SKILL.md frontmatter 字段 allowed-tools 列表元素必须为非空字符串"
            )
        return json.dumps([item.strip() for item in value], ensure_ascii=False)
    raise ValueError("SKILL.md frontmatter 字段 allowed-tools 必须为字符串或字符串列表")


def parse_skill_md(text: str, source_path: str) -> ParsedSkill:
    normalized_text = _normalize_text(text)
    lines = normalized_text.split("\n")
    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md 缺少 YAML frontmatter 起始标记 ---")

    frontmatter_end = None
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            frontmatter_end = i
            break
    if frontmatter_end is None:
        raise ValueError("SKILL.md 缺少 YAML frontmatter 结束标记 ---")

    frontmatter_text = "\n".join(lines[1:frontmatter_end])
    try:
        loaded = yaml.safe_load(frontmatter_text)
    except yaml.YAMLError as exc:
        raise ValueError(f"SKILL.md YAML frontmatter 解析失败: {exc}") from exc

    if not isinstance(loaded, dict):
        raise ValueError("SKILL.md YAML frontmatter 必须为对象映射")

    name = _validate_required_string(loaded, "name")
    description = _validate_required_string(loaded, "description")
    allowed_tools = _normalize_allowed_tools(loaded.get("allowed-tools"))

    api_provider_override = loaded.get("provider-override")
    model_override = loaded.get("model-override")
    temperature_override = loaded.get("temperature-override")
    max_tokens_override = loaded.get("max-tokens-override")

    for field_name, field_value in {
        "provider-override": api_provider_override,
        "model-override": model_override,
        "temperature-override": temperature_override,
        "max-tokens-override": max_tokens_override,
    }.items():
        if field_value is not None and not isinstance(field_value, str):
            raise ValueError(f"SKILL.md frontmatter 字段 {field_name} 必须为字符串")

    content = "\n".join(lines[frontmatter_end + 1 :]).strip()
    if not content:
        raise ValueError("SKILL.md 内容为空")

    return ParsedSkill(
        skill_key=name,
        name=name,
        description=description,
        allowed_tools=allowed_tools,
        api_provider_override=api_provider_override,
        model_override=model_override,
        temperature_override=temperature_override,
        max_tokens_override=max_tokens_override,
        content=content,
        source_path=source_path,
    )


def discover_skill_files(skills_root: Path) -> List[Path]:
    if not skills_root.exists() or not skills_root.is_dir():
        return []

    root_resolved = skills_root.resolve()
    files: List[Path] = []

    for candidate in skills_root.rglob("SKILL.md"):
        try:
            if not candidate.is_file():
                continue
            resolved_candidate = candidate.resolve()
            resolved_candidate.relative_to(root_resolved)
        except (OSError, ValueError):
            continue
        files.append(candidate)

    return sorted(files)


async def upsert_builtin_skills(
    db,
) -> Tuple[int, int, int, int, int, List[str], List[str]]:
    text = __import__("sqlalchemy").text

    roots = get_skills_roots()
    roots_used: List[str] = [label for label, root in roots if root.is_dir()]

    discovered_by_key: Dict[str, ParsedSkill] = {}
    discovered_source_label: Dict[str, str] = {}

    upserted = 0
    skipped = 0
    errors = 0
    deleted = 0
    error_messages: List[str] = []

    for label, root in roots:
        if not root.is_dir():
            continue

        files = discover_skill_files(root)
        for f in files:
            try:
                relative = str(f.resolve().relative_to(root.resolve()))
            except Exception:
                relative = f.name
            safe_path = f"{label}:{relative}"

            try:
                file_size = f.stat().st_size
                if file_size > MAX_SKILL_MD_BYTES:
                    errors += 1
                    skipped += 1
                    error_messages.append(
                        f"{safe_path}: SKILL.md exceeds size limit ({file_size} > {MAX_SKILL_MD_BYTES} bytes)"
                    )
                    continue
                skill_text = f.read_text(encoding="utf-8")
                parsed = parse_skill_md(skill_text, source_path=safe_path)
            except FileNotFoundError:
                errors += 1
                skipped += 1
                error_messages.append(f"{safe_path}: file disappeared during sync")
                continue
            except Exception as e:
                errors += 1
                skipped += 1
                error_messages.append(f"{safe_path}: {e}")
                continue

            existing = discovered_by_key.get(parsed.skill_key)
            if existing is None:
                discovered_by_key[parsed.skill_key] = parsed
                discovered_source_label[parsed.skill_key] = label
                continue

            existing_label = discovered_source_label[parsed.skill_key]
            if existing_label == "repo" and label == "global":
                skipped += 1
                continue
            if existing_label == "global" and label == "repo":
                discovered_by_key[parsed.skill_key] = parsed
                discovered_source_label[parsed.skill_key] = label
                skipped += 1
                continue

            skipped += 1

    discovered = len(discovered_by_key)

    for skill_key in sorted(discovered_by_key.keys()):
        parsed = discovered_by_key[skill_key]

        existing = await db.execute(
            text("SELECT id FROM skill_specs WHERE skill_key = :skill_key"),
            {"skill_key": parsed.skill_key},
        )
        existing_row = existing.first()

        if existing_row:
            await db.execute(
                text(
                    """
                    UPDATE skill_specs
                    SET name=:name,
                        description=:description,
                        content=:content,
                        allowed_tools=:allowed_tools,
                        api_provider_override=:api_provider_override,
                        model_override=:model_override,
                        temperature_override=:temperature_override,
                        max_tokens_override=:max_tokens_override,
                        source_path=:source_path,
                        is_builtin=1
                    WHERE skill_key=:skill_key
                    """
                ),
                {
                    "skill_key": parsed.skill_key,
                    "name": parsed.name,
                    "description": parsed.description,
                    "content": parsed.content,
                    "allowed_tools": parsed.allowed_tools,
                    "api_provider_override": parsed.api_provider_override,
                    "model_override": parsed.model_override,
                    "temperature_override": parsed.temperature_override,
                    "max_tokens_override": parsed.max_tokens_override,
                    "source_path": parsed.source_path,
                },
            )
        else:
            await db.execute(
                text(
                    """
                    INSERT INTO skill_specs (
                        id,
                        skill_key,
                        name,
                        description,
                        content,
                        allowed_tools,
                        api_provider_override,
                        model_override,
                        temperature_override,
                        max_tokens_override,
                        source_path,
                        is_builtin
                    ) VALUES (
                        :id,
                        :skill_key,
                        :name,
                        :description,
                        :content,
                        :allowed_tools,
                        :api_provider_override,
                        :model_override,
                        :temperature_override,
                        :max_tokens_override,
                        :source_path,
                        1
                    )
                    """
                ),
                {
                    "id": str(uuid.uuid4()),
                    "skill_key": parsed.skill_key,
                    "name": parsed.name,
                    "description": parsed.description,
                    "content": parsed.content,
                    "allowed_tools": parsed.allowed_tools,
                    "api_provider_override": parsed.api_provider_override,
                    "model_override": parsed.model_override,
                    "temperature_override": parsed.temperature_override,
                    "max_tokens_override": parsed.max_tokens_override,
                    "source_path": parsed.source_path,
                },
            )
        upserted += 1

    if roots_used:
        existing_builtin = await db.execute(
            text(
                "SELECT skill_key, source_path FROM skill_specs WHERE is_builtin IS TRUE"
            )
        )
        managed_builtin_keys = {
            row[0]
            for row in existing_builtin.fetchall()
            if isinstance(row[1], str)
            and (row[1].startswith("repo:") or row[1].startswith("global:"))
        }
        discovered_keys = set(discovered_by_key.keys())
        for stale_key in sorted(managed_builtin_keys - discovered_keys):
            await db.execute(
                text(
                    "DELETE FROM skill_specs WHERE is_builtin IS TRUE AND skill_key = :skill_key"
                ),
                {"skill_key": stale_key},
            )
            deleted += 1

    await db.commit()
    return discovered, upserted, skipped, errors, deleted, roots_used, error_messages


def parse_preferences(preferences: Optional[str]) -> Dict[str, object]:
    if not preferences:
        return {}
    try:
        return json.loads(preferences)
    except Exception:
        return {}


def dump_preferences(prefs: Dict[str, object]) -> str:
    return json.dumps(prefs, ensure_ascii=False)
