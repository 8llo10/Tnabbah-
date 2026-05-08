"""
حزمة اختبارات هندسية للنظام — تكامل، حدود، وسلوك معروف.

تشغيل:
    python -m pytest tests/test_system_engineering_suite.py -v

سجل ملاحظات (مخاطر / ديون فنية) — يُحدَّث عند اكتشاف انحدار:
- شذوذ الـ PID: ``WARNING`` → ``severity_level`` = ``MEDIUM``. ``NORMAL`` لا يُنشئ شذوذا.
  ``CRITICAL`` من المحلّل: حد أدنى ``severity_score`` = 75 ثم ``kb_severity_level_from_score``، و
  ``analyzer_status`` يُعبَّأ للفحص الكلي.
- يوجد مسار قديم في RulesEngine._check_pid_anomaly غير مستخدم في analyze_pids.
- عند mapping النتيجة إلى خطورة كلية: أي حساس ``0x..`` بـ ``analyzer_status=CRITICAL``
  يفرض ``SeverityLevel.CRITICAL`` عند تمرير قائمة الشذوذات؛ انظر ``test_live_sensor_...``.
- لمزيد من الجداول وتشغيل المجموعة: راجع ``tests/SYSTEM_AUDIT_REPORT.md``.
"""

from __future__ import annotations

import pytest

from src.diagnostics.data_loader import DataLoader
from src.diagnostics.engine.rules_engine import RulesEngine
from src.diagnostics.models import SeverityLevel
from src.diagnostics.model_service import _normalize_analysis_dict, _CANONICAL_URGENCY_AR
from src.diagnostics.obd_converter import OBDDataConverter


@pytest.fixture(scope="module")
def rules_engine() -> RulesEngine:
    loader = DataLoader()
    kb = loader.load_knowledge_bases()
    return RulesEngine(pid_kb=kb.pid_kb, dtc_kb=kb.dtc_kb)


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("0x2f", "0x2F"),
        ("0x2F", "0x2F"),
        ("0x0c", "0x0C"),
        ("STFT", "STFT"),
        ("", ""),
    ],
)
def test_pid_hex_normalization_case_insensitive(raw: str, expected: str) -> None:
    assert OBDDataConverter.normalize_pid_hex_key(raw) == expected


def test_coolant_in_critical_band_yields_critical_status(rules_engine: RulesEngine) -> None:
    """0x05 في KB: critical [110,130] — قيمة 115 يجب أن تولّد شذوذا بحالة CRITICAL."""
    result = rules_engine.analyze_pids(pids={"0x05": 115.0}, dtcs=[])
    assert len(result.detected_anomalies) >= 1
    a = result.detected_anomalies[0]
    assert a.pid_code == "0x05"
    assert str(a.severity_level).upper() == "CRITICAL"
    assert 50 <= a.severity_score <= 100


def test_coolant_in_warning_band_maps_to_medium_severity_level(rules_engine: RulesEngine) -> None:
    """حالة المحلّل WARNING تُطبَّق كخطورة MEDIUM (مثل DTC) وليس من عتبات النقاط."""
    result = rules_engine.analyze_pids(pids={"0x05": 108.0}, dtcs=[])
    assert len(result.detected_anomalies) >= 1
    a = result.detected_anomalies[0]
    assert str(a.severity_level).upper() == "MEDIUM"
    assert 20 <= a.severity_score <= 60


def test_coolant_normal_no_anomaly(rules_engine: RulesEngine) -> None:
    result = rules_engine.analyze_pids(pids={"0x05": 92.0}, dtcs=[])
    assert result.detected_anomalies == []


def test_high_coolant_drives_overall_severity_critical(rules_engine: RulesEngine) -> None:
    """عند 120°C داخل نطاق critical [110,130] يصبح severity_score = 75 فيعطي CRITICAL كلياً."""
    result = rules_engine.analyze_pids(pids={"0x05": 120.0}, dtcs=[])
    sev = rules_engine.calculate_overall_severity(
        result.system_scores, [], result.detected_anomalies
    )
    assert sev == SeverityLevel.CRITICAL


def test_clean_pids_yield_low_overall_when_no_dtcs(rules_engine: RulesEngine) -> None:
    result = rules_engine.analyze_pids(
        pids={"0x0C": 800.0, "0x05": 90.0, "0x42": 13.2},
        dtcs=[],
    )
    assert result.detected_anomalies == []
    sev = rules_engine.calculate_overall_severity(
        result.system_scores, [], result.detected_anomalies
    )
    assert sev == SeverityLevel.LOW


@pytest.mark.parametrize(
    "incoming,expect",
    [
        ("خطر شديد", "خطر شديد"),
        ("خطر", "خطر"),
        ("تحذير", "تحذير"),
        ("تنبيه بسيط", "تنبيه بسيط"),
        ("ملاحظة", "تنبيه بسيط"),
        ("انتباه", "تحذير"),
        ("عاجل", "خطر شديد"),
        ("قريب", "تحذير"),
        ("آمن", "تنبيه بسيط"),
        ("غير معروف تماماً", "تحذير"),
        ("", "تحذير"),
    ],
)
def test_urgency_ar_normalization_matches_canonical_four(
    incoming: str,
    expect: str,
) -> None:
    out = _normalize_analysis_dict({"urgency_ar": incoming}, dtcs=["P0000"])
    assert out["urgency_ar"] == expect
    assert out["urgency_ar"] in _CANONICAL_URGENCY_AR


def test_dtc_only_adds_synthetic_anomaly_with_mapped_severity(rules_engine: RulesEngine) -> None:
    """DTC MEDIUM في KB → شذوذ مزروع بـ severity_level MEDIUM وحد أدنى للسكور."""
    result = rules_engine.analyze_pids(pids={"0x0C": 800.0}, dtcs=["P0420"])
    codes = [a.pid_code for a in result.detected_anomalies]
    assert "P0420" in codes
    synth = next(a for a in result.detected_anomalies if a.pid_code == "P0420")
    assert str(synth.severity_level).upper() == "MEDIUM"
    assert synth.severity_score == 40


def test_live_sensor_analyzer_critical_forces_overall_severity(
    rules_engine: RulesEngine,
) -> None:
    """حتى لو لم يُحسب السكّور في أي نظام فرعي (PID غير مُخطَّط)، CRITICAL تشدّ الطبقة كلياً."""
    from src.diagnostics.models import PIDAnomaly

    zeros = {
        "ENGINE": 0.0,
        "COOLING": 0.0,
        "ELECTRICAL": 0.0,
        "FUEL": 0.0,
        "AIR": 0.0,
        "EXHAUST": 0.0,
        "DRIVETRAIN": 0.0,
    }
    ghost = PIDAnomaly(
        pid_code="0x99",
        pid_name="UNMAPPED_TEST",
        current_value=1.0,
        severity_score=50.0,
        reason="تجربة",
        recommendation="—",
        analyzer_status="CRITICAL",
    )
    sev = rules_engine.calculate_overall_severity(zeros, [], [ghost])
    assert sev == SeverityLevel.CRITICAL


def test_calculate_overall_severity_critical_dtc_list_override() -> None:
    """قائمة DTC الثابتة في المحرّك تعطي على الأقل HIGH عند تطابق كود."""
    loader = DataLoader()
    kb = loader.load_knowledge_bases()
    engine = RulesEngine(pid_kb=kb.pid_kb, dtc_kb=kb.dtc_kb)
    empty_scores = {"ENGINE": 0.0, "COOLING": 0.0, "ELECTRICAL": 0.0, "FUEL": 0.0, "AIR": 0.0, "EXHAUST": 0.0, "DRIVETRAIN": 0.0}
    sev = engine.calculate_overall_severity(empty_scores, ["P0420"])
    assert sev in (SeverityLevel.HIGH, SeverityLevel.CRITICAL)


def test_high_dtc_with_low_system_scores_does_not_downgrade(rules_engine: RulesEngine) -> None:
    """Regression: SeverityLevel inherits from str, so a naive max() on the enum
    compares alphabetically ("HIGH" > "CRITICAL", "LOW" > "HIGH"), which used to
    silently downgrade severity. With rank-based combination, a HIGH-listed DTC
    plus near-zero system scores must still yield at least HIGH (never LOW/MEDIUM).
    """
    empty_scores = {
        "ENGINE": 0.0, "COOLING": 0.0, "ELECTRICAL": 0.0, "FUEL": 0.0,
        "AIR": 0.0, "EXHAUST": 0.0, "DRIVETRAIN": 0.0,
    }
    # P0171 is in the engine's high_dtcs list (not in critical_dtcs alone path).
    sev = rules_engine.calculate_overall_severity(empty_scores, ["P0171"])
    assert sev in (SeverityLevel.HIGH, SeverityLevel.CRITICAL)
    assert sev not in (SeverityLevel.LOW, SeverityLevel.MEDIUM)


def test_max_severity_helper_is_rank_based() -> None:
    """Direct unit test for the rank-based severity combiner."""
    from src.diagnostics.engine.rules_engine import _max_severity

    assert _max_severity(SeverityLevel.HIGH, SeverityLevel.LOW) == SeverityLevel.HIGH
    assert _max_severity(SeverityLevel.HIGH, SeverityLevel.MEDIUM) == SeverityLevel.HIGH
    assert _max_severity(SeverityLevel.HIGH, SeverityLevel.CRITICAL) == SeverityLevel.CRITICAL
    assert _max_severity(SeverityLevel.LOW, SeverityLevel.MEDIUM) == SeverityLevel.MEDIUM
    assert _max_severity(SeverityLevel.LOW) == SeverityLevel.LOW
