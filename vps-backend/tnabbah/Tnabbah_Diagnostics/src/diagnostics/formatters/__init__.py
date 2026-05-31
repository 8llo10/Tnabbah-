"""
Formatters sub-package — modular report-building pipeline.

Each module owns one responsibility:
  severity       – severity constants, UI maps, text helpers
  grouping       – union-find DTC↔PID clustering
  pid_formatter  – PID reading normalization for UI / LLM
  dtc_formatter  – DTC issue cards + final Arabic report assembly
  beginner       – beginner-driver mode, glossary, jargon replacements
  ai_enhancer    – optional LLM enrichment layer
"""

from .severity import (
    DISCLAIMER_AR,
    SEVERITY_UI,
    _SEV_RANK,
    _coerce_str_list,
    _limit_words,
    _strip_urgency_from_action,
    _worst_severity,
    _overall_display,
)
from .grouping import (
    group_related_issues,
    format_grouping_summary_ar,
)
from .pid_formatter import (
    build_all_pid_readings_payload,
    pid_readings_for_mechanical_llm,
)
from .dtc_formatter import (
    format_user_report_ar,
)
from .beginner import (
    format_for_beginner_driver,
    simplify_jargon,
    BEGINNER_SEVERITY,
    BEGINNER_GLOSSARY,
    SIMPLE_REPLACEMENTS,
)

__all__ = [
    # severity
    "DISCLAIMER_AR",
    "SEVERITY_UI",
    "_SEV_RANK",
    "_coerce_str_list",
    "_limit_words",
    "_strip_urgency_from_action",
    "_worst_severity",
    "_overall_display",
    # grouping
    "group_related_issues",
    "format_grouping_summary_ar",
    # pid
    "build_all_pid_readings_payload",
    "pid_readings_for_mechanical_llm",
    # dtc / report
    "format_user_report_ar",
    # beginner
    "format_for_beginner_driver",
    "simplify_jargon",
    "BEGINNER_SEVERITY",
    "BEGINNER_GLOSSARY",
    "SIMPLE_REPLACEMENTS",
]
