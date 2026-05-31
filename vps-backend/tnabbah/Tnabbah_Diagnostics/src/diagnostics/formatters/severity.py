"""
Severity constants, UI display maps, and shared text-utility helpers.

Every other formatter module imports from here — never the other way around.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple


DISCLAIMER_AR = (
    "هذا تحليل عام بناءً على بيانات OBD-II. قد يختلف التشخيص حسب نوع السيارة وحالتها. "
    "استشر ميكانيكياً متخصصاً."
)

# Single source of truth: severity -> (badge label, urgency message). No variations.
# Arabic words are severity levels for beginners (not urgency synonyms like «عاجل»).
SEVERITY_UI: Dict[str, Tuple[str, str]] = {
    "CRITICAL": ("🔴 خطر شديد", "توقف فوراً — لا تقُد السيارة"),
    "HIGH": ("🟠 خطر", "افحص السيارة خلال يوم"),
    "MEDIUM": ("🟡 تحذير", "افحص السيارة في أقرب وقت"),
    "LOW": ("🟢 تنبيه بسيط", "راقب الوضع؛ غالباً كود مخزّن أو غير مؤثر الآن"),
}

_SEV_RANK = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

# Strip from maintenance text so what_to_do stays mechanical (never repeats urgency).
_URGENCY_FRAGMENTS_NON_CRITICAL = [
    "عاجل - توجه للورشة فوراً",
    "عاجل- توجه للورشة فوراً",
    "لا تقد - توقف فوراً",
    "لا تقد",
    "لا تقُد",
    "لا تقود",
    "توقف فوراً",
    "توجه للورشة فوراً",
    "توجّه للورشة فوراً",
    "توجّه للورشة",
    "خلال يوم",
    "خلال شهر",
    "خلال أسبوع",
    "لا تقُد السيارة",
]


# ── Text helpers ──────────────────────────────────────────────────────────


def _coerce_str_list(val: Any, limit: int = 8) -> List[str]:
    """Ensure KB causes/symptoms are flat string lists for UI + LLM."""
    if isinstance(val, list):
        out = [str(x).strip() for x in val if str(x).strip()]
    elif isinstance(val, str) and val.strip():
        out = [val.strip()]
    else:
        out = []
    return out[:limit]


def _limit_words(text: str, max_words: int = 15) -> str:
    """Keep UX sentences short (word-count heuristic)."""
    text = (text or "").strip()
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]) + "…"


def _strip_urgency_from_action(text: str, severity: str) -> str:
    """Remove urgency/driving-stop wording from action lines unless CRITICAL."""
    if not text or severity == "CRITICAL":
        return (text or "").strip()
    t = text.strip()
    for frag in _URGENCY_FRAGMENTS_NON_CRITICAL:
        t = t.replace(frag, "")
    t = re.sub(r"^عاجل\s*[-–—]\s*", "", t)
    t = re.sub(r"\s+", " ", t).strip(" -،.؛:")
    return t


# ── Composite severity helpers ────────────────────────────────────────────


def _worst_severity(issue_severities: List[str]) -> Optional[str]:
    """Highest rank among issue severities."""
    best_rank = 0
    worst = None
    for s in issue_severities:
        u = (s or "").upper()
        r = _SEV_RANK.get(u, 0)
        if r > best_rank:
            best_rank = r
            worst = u
    return worst


def _overall_display(
    worst_issue_severity: Optional[str],
    n_dtcs: int,
    anomaly_count: int,
) -> Tuple[float, str, str]:
    """
    Fixed UX health band aligned with worst DTC severity (never contradicts urgency).

    Returns:
        (percent for progress bar, Arabic status line, canonical overall_severity key)
    """
    if n_dtcs == 0:
        if anomaly_count == 0:
            return 100.0, "🟢 100% - السيارة بحالة ممتازة", "LOW"
        return (
            70.0,
            "🟡 70% - تحذير — يحتاج متابعة",
            "MEDIUM",
        )

    assert worst_issue_severity is not None
    w = worst_issue_severity.upper()
    if w == "LOW":
        return 95.0, "🟢 95% - لا توجد مشكلة", "LOW"
    if w == "MEDIUM":
        return 70.0, "🟡 70% - تحذير — يحتاج متابعة", "MEDIUM"
    if w == "HIGH":
        return 45.0, "🟠 45% — خطر: يُفضّل الفحص خلال يوم", "HIGH"
    if w == "CRITICAL":
        return 20.0, "🔴 20% - خطر شديد - توقف فوراً", "CRITICAL"
    return 70.0, "🟡 70% - تحذير — يحتاج متابعة", "MEDIUM"
