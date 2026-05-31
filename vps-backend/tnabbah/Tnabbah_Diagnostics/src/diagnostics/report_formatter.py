"""
Arabic user-facing diagnostic report formatter — backward-compatible facade.

The implementation has been split into focused modules under ``formatters/``:
  - ``formatters.severity``      – severity constants, UI maps, text helpers
  - ``formatters.grouping``      – union-find DTC↔PID clustering
  - ``formatters.pid_formatter`` – PID reading normalization for UI / LLM
  - ``formatters.dtc_formatter`` – DTC issue cards + final Arabic report assembly
  - ``formatters.beginner``      – beginner-driver mode, glossary, jargon replacements
  - ``formatters.ai_enhancer``   – optional LLM enrichment layer

All public symbols are re-exported here so existing
``from .report_formatter import X`` statements continue to work unchanged.
"""
from .formatters.severity import (           # noqa: F401
    DISCLAIMER_AR,
    SEVERITY_UI,
    _SEV_RANK,
    _coerce_str_list,
    _limit_words,
    _strip_urgency_from_action,
    _worst_severity,
    _overall_display,
)
from .formatters.grouping import (           # noqa: F401
    group_related_issues,
    format_grouping_summary_ar,
)
from .formatters.pid_formatter import (      # noqa: F401
    build_all_pid_readings_payload,
    pid_readings_for_mechanical_llm,
)
from .formatters.dtc_formatter import (      # noqa: F401
    format_user_report_ar,
)
from .formatters.beginner import (           # noqa: F401
    format_for_beginner_driver,
    simplify_jargon,
    BEGINNER_SEVERITY,
    BEGINNER_GLOSSARY,
    SIMPLE_REPLACEMENTS,
)

__all__ = [
    "DISCLAIMER_AR",
    "SEVERITY_UI",
    "_SEV_RANK",
    "_coerce_str_list",
    "_limit_words",
    "_strip_urgency_from_action",
    "_worst_severity",
    "_overall_display",
    "group_related_issues",
    "format_grouping_summary_ar",
    "build_all_pid_readings_payload",
    "pid_readings_for_mechanical_llm",
    "format_user_report_ar",
    "format_for_beginner_driver",
    "simplify_jargon",
    "BEGINNER_SEVERITY",
    "BEGINNER_GLOSSARY",
    "SIMPLE_REPLACEMENTS",
]
