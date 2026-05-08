"""
PID reading normalization for UI display and LLM mechanical interpretation.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional


def build_all_pid_readings_payload(
    pids: Dict[str, Any],
    pid_kb: Dict[str, Any],
    detected_anomalies: Optional[List[Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Normalize every scanned PID into UI/API rows (same shape as ``main.scan_vehicle``).
    Skips unknown PID codes unless resolvable via ``alternate_codes``.
    """
    anomaly_codes = set()
    for anom in detected_anomalies or []:
        pc = getattr(anom, "pid_code", None) if not isinstance(anom, dict) else anom.get("pid_code")
        if pc:
            anomaly_codes.add(str(pc))

    rows: List[Dict[str, Any]] = []
    for pid_code, pid_value in pids.items():
        pid_def = pid_kb.get(pid_code)
        if not pid_def:
            for kb_key, kb_def in pid_kb.items():
                if not isinstance(kb_def, dict):
                    continue
                alts = kb_def.get("alternate_codes") or []
                if pid_code in alts:
                    pid_def = kb_def
                    break
        if not pid_def:
            pid_def = {}
        pid_name = pid_def.get("name", pid_code)
        pid_unit = pid_def.get("unit", "")
        is_anomaly = pid_code in anomaly_codes
        status = "NORMAL"
        if is_anomaly:
            anomaly = None
            for anom in detected_anomalies or []:
                cmp = (
                    anom.get("pid_code")
                    if isinstance(anom, dict)
                    else getattr(anom, "pid_code", None)
                )
                if cmp == pid_code:
                    anomaly = anom
                    break
            if anomaly is not None:
                status = (
                    anomaly.get("severity_level")
                    if isinstance(anomaly, dict)
                    else getattr(anomaly, "severity_level", None)
                ) or "ABNORMAL"
        rows.append(
            {
                "pid_code": pid_code,
                "pid_name": pid_name,
                "value": pid_value,
                "unit": pid_unit,
                "status": status,
                "is_anomaly": is_anomaly,
                "normal_range": pid_def.get("normal_range", {}),
                "warning_range": pid_def.get("warning_range", {}),
                "critical_range": pid_def.get("critical_range", {}),
            }
        )
    return rows


def pid_readings_for_mechanical_llm(
    all_pid_readings: List[Dict[str, Any]],
    pid_kb: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Enrich PID rows with Arabic titles and KB hints for OpenAI mechanical interpretation.
    """
    out: List[Dict[str, Any]] = []
    for r in all_pid_readings:
        code = str(r.get("pid_code") or "")
        entry = pid_kb.get(code) or {}
        i18n = (entry.get("i18n") or {}).get("ar") or {}
        title_ar = i18n.get("title") or entry.get("name") or code
        hint = str(i18n.get("professional_explanation") or "").strip()
        if len(hint) > 400:
            hint = hint[:397] + "…"
        row: Dict[str, Any] = {
            "pid_code": code,
            "name_ar": title_ar,
            "value": r.get("value"),
            "unit": str(r.get("unit") or entry.get("unit") or ""),
            "status": str(r.get("status") or "NORMAL"),
            "is_anomaly": bool(r.get("is_anomaly")),
            "normal_range": r.get("normal_range") or entry.get("normal_range") or {},
        }
        if hint:
            row["kb_hint_ar"] = hint
        out.append(row)
    return out
