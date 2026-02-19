from __future__ import annotations

import json
from typing import Optional, Set


def parse_allowed_tools_csv(text: Optional[str]) -> Optional[Set[str]]:
    if text is None:
        return None
    normalized = text.strip()
    if not normalized:
        return set()

    if normalized.startswith("[") or normalized.startswith("{"):
        try:
            parsed = json.loads(normalized)
        except Exception:
            return set()
        if not isinstance(parsed, list):
            return set()
        names = {
            item.strip() for item in parsed if isinstance(item, str) and item.strip()
        }
        return names or set()

    items = [x.strip() for x in normalized.split(",")]
    names = {x for x in items if x}
    return names or set()
