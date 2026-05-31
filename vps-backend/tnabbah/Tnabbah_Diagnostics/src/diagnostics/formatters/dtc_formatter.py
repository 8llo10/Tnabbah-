"""
DTC issue-card building and final Arabic diagnostic report assembly.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from .severity import (
    DISCLAIMER_AR,
    SEVERITY_UI,
    _coerce_str_list,
    _limit_words,
    _strip_urgency_from_action,
    _worst_severity,
    _overall_display,
)
from .grouping import group_related_issues, _build_grouped_summary_ar

logger = logging.getLogger(__name__)


def _fallback_entry(code: str) -> Dict[str, Any]:
    logger.warning("Missing KB entry for DTC %s — using defaults", code)
    return {
        "code": code.upper(),
        "description_ar": f"الكمبيوتر سجل الرمز {code}. يحتاج تأكيداً بتشخيص ورشة.",
        "description_en": code,
        "severity": "MEDIUM",
        "drive_safety_ar": "",
        "maintenance_recommendation_ar": "اطلب كشفاً إلكترونياً عند ميكانيكي لقراءة البيانات الحية.",
        "possible_causes_ar": ["تشخيص غير مكتمل في القاعدة المعرفية"],
        "symptoms_ar": ["قد لا تظهر أعراض واضحة"],
        "related_pids": [],
        "category": "other",
        "disclaimer_ar": DISCLAIMER_AR,
    }


def _issue_title(entry: Dict[str, Any], code: str) -> str:
    da = entry.get("description_ar") or ""
    if " - " in da:
        return _limit_words(da.split(" - ")[0].strip(), 12)
    if da:
        return _limit_words(da, 12)
    return code


def _build_what_to_do(entry: Dict[str, Any], severity: str) -> str:
    """Mechanical steps only; never merge drive_safety (prevents urgency clashes)."""
    if severity == "LOW":
        return "🔧 هذا رمز قديم أو مخزن. امسح الرموز وراقب السيارة."

    raw_maint = (entry.get("maintenance_recommendation_ar") or "").strip()
    cleaned = _strip_urgency_from_action(raw_maint, severity)

    if cleaned:
        line = cleaned if cleaned.startswith("🔧") else f"🔧 {cleaned}"
        return _limit_words(line, 25)

    causes = _coerce_str_list(entry.get("possible_causes_ar") or [])
    if causes:
        return _limit_words(f"🔧 راجع أولاً: {causes[0]}", 25)

    return "🔧 راجع ميكانيكياً لتحديد السبب بدقة."


def format_user_report_ar(
    dtcs: List[str],
    pids: dict,
    baseline_report: dict,
    pid_anomalies: Optional[List[Any]] = None,
    dtc_kb: Optional[Dict[str, Any]] = None,
) -> dict:
    """
    Build structured Arabic UX payload for API/UI.

    baseline_report keys (still accepted; display health is derived from DTC severity bands):
      - overall_severity: str (informational from rules engine)
      - overall_health: float (engine PID score — not used for user-facing percent when DTCs exist)
      - is_vehicle_healthy: bool
      - anomaly_count: int
      - drive_advice: str (optional, unused in formatted issue cards)
    """
    is_healthy = bool(baseline_report.get("is_vehicle_healthy", False))
    anomaly_count = int(baseline_report.get("anomaly_count", 0))

    _kb: Dict[str, Any] = (dtc_kb if dtc_kb is not None else baseline_report.get("dtc_kb")) or {}
    _raw_anoms: Optional[List[Any]] = (
        pid_anomalies if pid_anomalies is not None else baseline_report.get("detected_anomalies")
    )

    if _kb:
        pack = group_related_issues(dtcs, _raw_anoms, _kb)
    else:
        pack = {
            "grouped_issues": [],
            "total_issue_groups": 0,
            "has_related_issues": False,
            "orphan_pid_anomalies": [],
        }

    grouped_issues: List[Dict[str, Any]] = pack["grouped_issues"]
    total_issue_groups: int = int(pack["total_issue_groups"])
    has_related_issues: bool = bool(pack["has_related_issues"])
    orphan_serial: List[Dict[str, Any]] = pack["orphan_pid_anomalies"]
    n_orphan_pids = len(orphan_serial)

    codes = []
    seen = set()
    for d in dtcs:
        if not d:
            continue
        u = d.upper().strip()
        if u not in seen:
            seen.add(u)
            codes.append(u)

    # Map DTC code -> related PID anomaly dicts (deduped by pid_code)
    code_to_pids: Dict[str, List[Dict[str, Any]]] = {}
    for g in grouped_issues:
        serial = g.get("related_pid_anomalies") or []
        for c in g.get("dtcs") or []:
            bucket = code_to_pids.setdefault(c, [])
            seen_pc: set = {x.get("pid_code") for x in bucket if x.get("pid_code")}
            for row in serial:
                pc = row.get("pid_code")
                if pc and pc not in seen_pc:
                    seen_pc.add(pc)
                    bucket.append(row)

    issues: List[Dict[str, Any]] = []
    for code in codes:
        raw = _kb.get(code) if _kb else None
        entry = raw if isinstance(raw, dict) else None
        if entry is None:
            entry = _fallback_entry(code)

        sev = str(entry.get("severity", "MEDIUM")).upper()
        if sev not in SEVERITY_UI:
            sev = "MEDIUM"

        badge, urgency = SEVERITY_UI[sev]
        desc_ar = _limit_words(entry.get("description_ar") or "", 30)

        explanation = desc_ar
        if sev == "LOW":
            explanation = _limit_words(
                explanation + " غالباً مخزن أو بسيط ولا يقلق مع القيادة الحالية.",
                28,
            )
        else:
            explanation = _limit_words(explanation, 28)

        what_to_do = _build_what_to_do(entry, sev)

        issues.append(
            {
                "code": code,
                "title": _issue_title(entry, code),
                "severity": sev,
                "severity_label": badge,
                "severity_raw": sev,
                "explanation": explanation,
                "what_to_do": what_to_do,
                "urgency": urgency,
                "possible_causes": _coerce_str_list(entry.get("possible_causes_ar") or []),
                "symptoms": _coerce_str_list(entry.get("symptoms_ar") or []),
                "related_pid_anomalies": code_to_pids.get(code, []),
            }
        )

    all_low_severity = bool(issues) and all(i["severity_raw"] == "LOW" for i in issues)

    n_dtcs = len(codes)
    worst = _worst_severity([i["severity_raw"] for i in issues]) if issues else None
    display_pid_count = n_orphan_pids if _kb else anomaly_count
    health_pct, health_line, derived_overall_sev = _overall_display(
        worst, n_dtcs, display_pid_count
    )

    # Summary — prefer grouped root-cause wording when KB + anomalies available
    if _kb and (total_issue_groups > 0 or grouped_issues):
        summary = _build_grouped_summary_ar(
            n_dtcs=n_dtcs,
            total_groups=total_issue_groups,
            has_related=has_related_issues,
            n_orphan_pids=n_orphan_pids,
        )
        if is_healthy and n_dtcs == 0 and display_pid_count == 0:
            summary = "لم نجد أعطالاً مسجلة في هذا الفحص."
        elif is_healthy and n_dtcs == 0 and display_pid_count > 0:
            summary = _build_grouped_summary_ar(
                n_dtcs=0,
                total_groups=total_issue_groups,
                has_related=has_related_issues,
                n_orphan_pids=n_orphan_pids,
            )
    elif is_healthy and n_dtcs == 0:
        summary = "لم نجد أعطالاً مسجلة في هذا الفحص."
        if anomaly_count:
            summary += f" يوجد {anomaly_count} تنبيه من القراءات."
    elif n_dtcs == 0:
        summary = "لا توجد أكواد أعطال مسجلة حالياً."
        if anomaly_count:
            summary += f" يوجد {anomaly_count} قراءة خارج النطاق المعتاد."
    elif n_dtcs == 1:
        summary = "تم العثور على كود واحد. راجع الاستعجال والخطوات أدناه."
    else:
        summary = f"تم العثور على {n_dtcs} أكواد. راجع كل بطاقة أدناه."

    if all_low_severity:
        summary = _limit_words(
            "الأكواد المعروضة منخفضة الخطورة؛ غالباً مخزنة أو بسيطة.",
            22,
        )

    summary = _limit_words(summary, 24)

    return {
        "title": "📋 تقرير فحص السيارة",
        "summary": summary,
        "issues": issues,
        "overall_health": health_line,
        "overall_health_percent": round(health_pct, 1),
        "overall_severity": derived_overall_sev,
        "disclaimer": DISCLAIMER_AR,
        "pid_count": len(pids) if isinstance(pids, dict) else 0,
        "grouped_issues": grouped_issues,
        "total_issue_groups": total_issue_groups,
        "has_related_issues": has_related_issues,
        "orphan_pid_anomalies": orphan_serial,
    }
