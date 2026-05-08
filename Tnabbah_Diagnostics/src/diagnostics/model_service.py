"""
Model service wrapper - delegates to clean ai_service.
Maintains backwards compatibility for existing imports.
"""

from typing import Any, Dict, List, Set, FrozenSet

from .ai_service import (
    AIService as ModelService,
    explain_pids as interpret_pid_mechanical_snapshot,
    explain_dtcs as interpret_dtc_snapshot,
    get_ai_service as get_model_service,
)

# Stub functions for backwards compatibility
def simplify_for_beginner(text: str) -> str:
    return text

def generate_ai_analysis(*args, **kwargs) -> dict:
    return {}

def group_related_issues(*args, **kwargs) -> dict:
    return {"groups": []}

# For test compatibility
_LEGACY_URGENCY_AR: Dict[str, str] = {
    "عاجل": "خطر شديد",
    "قريب": "تحذير",
    "آمن": "تنبيه بسيط",
    "انتباه": "تحذير",
    "ملاحظة": "تنبيه بسيط",
}
_CANONICAL_URGENCY_AR: FrozenSet[str] = frozenset(
    {"خطر شديد", "خطر", "تحذير", "تنبيه بسيط"}
)

def _normalize_analysis_dict(raw: Dict[str, Any], dtcs: List[str]) -> Dict[str, Any]:
    """Stub for test compatibility - handles urgency mapping."""
    urgency = str(raw.get("urgency_ar", "") or raw.get("urgency", "")).strip() or "تحذير"
    
    # Map legacy values
    if urgency in _LEGACY_URGENCY_AR:
        urgency = _LEGACY_URGENCY_AR[urgency]
    
    # Validate against canonical
    if urgency not in _CANONICAL_URGENCY_AR:
        urgency = "تحذير"
    
    return {
        "smart_insight_ar": str(raw.get("smart_insight_ar", "")).strip(),
        "correlation_ar": str(raw.get("correlation_ar", "")).strip(),
        "recommendation_ar": str(raw.get("recommendation_ar", "")).strip(),
        "what_to_tell_mechanic_ar": str(raw.get("what_to_tell_mechanic_ar", "")).strip(),
        "urgency_ar": urgency,
    }

__all__ = [
    "ModelService",
    "get_model_service",
    "interpret_pid_mechanical_snapshot",
    "simplify_for_beginner",
    "generate_ai_analysis",
    "group_related_issues",
    "_normalize_analysis_dict",
    "_CANONICAL_URGENCY_AR",
]
