"""Regression: DTC + PID anomaly share one issue group when KB links them."""
from types import SimpleNamespace

from src.diagnostics.report_formatter import group_related_issues


def test_p0171_and_engine_load_cluster_as_one():
    dtc_kb = {"P0171": {"severity": "MEDIUM", "category": "fuel"}}
    anom = SimpleNamespace(pid_code="0x04", related_dtcs=["P0171"])
    pack = group_related_issues(["P0171"], [anom], dtc_kb)
    assert pack["total_issue_groups"] == 1
    assert pack["has_related_issues"] is True
    g0 = pack["grouped_issues"][0]
    assert g0["is_grouped"] is True
    assert g0["dtcs"] == ["P0171"]
    assert len(g0["related_pid_anomalies"]) == 1
    assert pack["orphan_pid_anomalies"] == []


def test_unrelated_dtc_and_pid_only_two_groups():
    dtc_kb = {"P0300": {"severity": "MEDIUM", "category": "engine"}}
    anom_batt = SimpleNamespace(pid_code="0x42", related_dtcs=[])
    pack = group_related_issues(["P0300"], [anom_batt], dtc_kb)
    assert pack["total_issue_groups"] == 2
    assert pack["has_related_issues"] is False
    assert len(pack["orphan_pid_anomalies"]) == 1


def test_mixed_related_cluster_and_pid_only():
    dtc_kb = {"P0171": {"severity": "MEDIUM", "category": "fuel"}}
    anom_load = SimpleNamespace(pid_code="0x04", related_dtcs=["P0171"])
    anom_batt = SimpleNamespace(pid_code="0x42", related_dtcs=[])
    pack = group_related_issues(["P0171"], [anom_load, anom_batt], dtc_kb)
    assert pack["total_issue_groups"] == 2
    assert pack["has_related_issues"] is True
    assert len(pack["orphan_pid_anomalies"]) == 1
    assert pack["orphan_pid_anomalies"][0].get("pid_code") == "0x42"
