"""
Union-find grouping of DTCs and PID anomalies into related issue clusters.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from .severity import _SEV_RANK

logger = logging.getLogger(__name__)


def _dtc_u(code: str) -> str:
    return (code or "").strip().upper()


def _anomaly_to_dict(a: Any) -> Dict[str, Any]:
    """Serialize PIDAnomaly (Pydantic v1/v2) or dict to a plain dict for JSON/UI."""
    if a is None:
        return {}
    if isinstance(a, dict):
        return dict(a)
    if hasattr(a, "model_dump"):
        return a.model_dump()
    if hasattr(a, "dict"):
        return a.dict()
    ad = getattr(a, "__dict__", None)
    if isinstance(ad, dict) and ad:
        return dict(ad)
    return {}


def _filter_real_pid_anomalies(
    pid_anomalies: Optional[List[Any]],
    dtc_kb: Optional[Dict[str, Any]],
) -> List[Any]:
    """Keep only live-PID anomalies (drops synthetic rows whose pid_code is a DTC key)."""
    if not pid_anomalies:
        return []
    kb = dtc_kb or {}
    out: List[Any] = []
    for a in pid_anomalies:
        pcode = _dtc_u(str(getattr(a, "pid_code", "") or ""))
        if pcode and pcode in kb:
            continue
        out.append(a)
    return out


def _root_cause_ar_hint(dtcs_in_group: List[str], dtc_kb: Dict[str, Any]) -> str:
    """Short Arabic theme line for a grouped card (beginner-friendly)."""
    if not dtcs_in_group:
        return "انحراف في قراءة أحد المستشعرات"
    cats = []
    for c in dtcs_in_group:
        cat = (dtc_kb.get(c) or {}).get("category") or ""
        if isinstance(cat, str):
            cats.append(cat.lower())
    leanish = any(x.startswith("P017") or x.startswith("P218") for x in dtcs_in_group)
    fuelish = any(
        c in cats
        for c in ("fuel", "emissions", "engine")
    )
    if leanish or ("fuel" in cats and "emissions" in cats):
        return "مشكلة في نظام خليط الوقود والهواء"
    if "emissions" in cats:
        return "مشكلة في نظام العادم أو التلوث"
    if "fuel" in cats:
        return "مشكلة في نظام الوقود"
    if "electrical" in cats:
        return "مشكلة في التوصيلات الكهربائية"
    if "transmission" in cats:
        return "مشكلة في ناقل الحركة"
    if fuelish:
        return "مشكلة في نظام خليط الوقود والهواء"
    return "مشكلة في المحرك أو الأنظمة المرتبطة به"


def group_related_issues(
    dtcs: List[str],
    pid_anomalies: Optional[List[Any]],
    dtc_kb: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Connect DTCs and PID anomalies when ``anomaly.related_dtcs`` intersects
    the stored fault list (union-find connected components).

    Returns keys:
      - ``grouped_issues``: UI-ready groups
      - ``total_issue_groups``: len(groups) — count distinct root situations
      - ``has_related_issues``: any group has both a DTC and a PID anomaly
      - ``orphan_pid_anomalies``: serialized PID anomalies from ``pid_only`` clusters
        (no overlapping stored DTC in the same component)
    """
    kb = dtc_kb or {}
    codes = []
    seen: set = set()
    for d in dtcs or []:
        u = _dtc_u(d)
        if u and u not in seen:
            seen.add(u)
            codes.append(u)

    real = _filter_real_pid_anomalies(pid_anomalies, kb)
    n_d, n_a = len(codes), len(real)
    if n_d == 0 and n_a == 0:
        return {
            "grouped_issues": [],
            "total_issue_groups": 0,
            "has_related_issues": False,
            "orphan_pid_anomalies": [],
        }

    Node = Tuple[str, int]  # ('d', i) or ('a', j)
    parent: Dict[Node, Node] = {}

    def node_d(i: int) -> Tuple[str, int]:
        return ("d", i)

    def node_a(j: int) -> Tuple[str, int]:
        return ("a", j)

    for i in range(n_d):
        parent[node_d(i)] = node_d(i)
    for j in range(n_a):
        parent[node_a(j)] = node_a(j)

    def find(x: Node) -> Node:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x: Node, y: Node) -> None:
        px, py = find(x), find(y)
        if px != py:
            parent[px] = py

    code_set = set(codes)
    for j, a in enumerate(real):
        rdtc = [_dtc_u(x) for x in (getattr(a, "related_dtcs", None) or [])]
        for d in rdtc:
            if d not in code_set:
                continue
            di = codes.index(d)
            union(node_a(j), node_d(di))

    clusters: Dict[Node, List[Node]] = {}
    for i in range(n_d):
        nd = node_d(i)
        r = find(nd)
        clusters.setdefault(r, []).append(nd)
    for j in range(n_a):
        na = node_a(j)
        r = find(na)
        clusters.setdefault(r, []).append(na)

    grouped_issues: List[Dict[str, Any]] = []

    for _root, members in clusters.items():
        d_idx = sorted(i for t, i in members if t == "d")
        a_idx = sorted(i for t, i in members if t == "a")
        g_dtcs = [codes[i] for i in d_idx]
        g_anoms = [real[j] for j in a_idx]

        is_grouped = bool(g_dtcs) and bool(g_anoms)
        if g_dtcs and not g_anoms:
            src = "dtc_only"
        elif not g_dtcs and g_anoms:
            src = "pid_only"
        else:
            src = "related_group"

        serial_anoms = [_anomaly_to_dict(x) for x in g_anoms]
        grouped_issues.append(
            {
                "source": src,
                "dtcs": g_dtcs,
                "related_pid_anomalies": serial_anoms,
                "is_grouped": is_grouped,
                "root_cause_ar": _root_cause_ar_hint(g_dtcs, kb),
            }
        )

    # Stable sort: related groups first, then by worst DTC severity, then PID-only.
    def _cluster_rank(g: Dict[str, Any]) -> Tuple[int, int, str]:
        pri = 0 if g["is_grouped"] else (2 if g["source"] == "pid_only" else 1)
        worst_r = 0
        worst_code = ""
        for c in g.get("dtcs") or []:
            sev = str((kb.get(c) or {}).get("severity", "MEDIUM")).upper()
            r = _SEV_RANK.get(sev, 0)
            if r > worst_r:
                worst_r = r
                worst_code = c
        return (pri, -worst_r, worst_code)

    grouped_issues.sort(key=_cluster_rank)

    # PID anomalies that are not linked to any stored DTC (pid_only clusters).
    orphan_pid_anomalies: List[Dict[str, Any]] = []
    for g in grouped_issues:
        if g.get("source") == "pid_only":
            orphan_pid_anomalies.extend(g.get("related_pid_anomalies") or [])

    has_related = any(g.get("is_grouped") for g in grouped_issues)
    return {
        "grouped_issues": grouped_issues,
        "total_issue_groups": len(grouped_issues),
        "has_related_issues": has_related,
        "orphan_pid_anomalies": orphan_pid_anomalies,
    }


def _build_grouped_summary_ar(
    *,
    n_dtcs: int,
    total_groups: int,
    has_related: bool,
    n_orphan_pids: int,
) -> str:
    """Top-line Arabic summary when grouping metadata is available."""
    if n_dtcs == 0 and n_orphan_pids == 0 and total_groups == 0:
        return "لم نجد أعطالاً مسجلة في هذا الفحص."

    if total_groups <= 0:
        return "تمت مراجعة البيانات."

    if total_groups == 1:
        if has_related:
            return "تم اكتشاف مشكلة واحدة"
        if n_dtcs == 0 and n_orphan_pids >= 1:
            return "تم اكتشاف مشكلة واحدة من القراءات (بدون كود عطل مسجل)."
        return "تم اكتشاف مشكلة واحدة — راجع التفاصيل أدناه."

    if has_related:
        if total_groups == 2:
            return "تم اكتشاف مشكلتين (واحدة رئيسية وأخرى منفصلة)."
        return (
            f"تم اكتشاف {total_groups} مشاكل — إحداها مرتبطة بين الأكواد والقراءات، "
            f"والباقي منفصل."
        )

    return f"تم اكتشاف {total_groups} مشاكل منفصلة — راجع التفاصيل أدناه."


def format_grouping_summary_ar(
    n_dtcs: int,
    total_groups: int,
    has_related: bool,
    n_orphan_pids: int,
) -> str:
    """Public helper for UI layers that only need the Arabic grouping headline."""
    return _build_grouped_summary_ar(
        n_dtcs=n_dtcs,
        total_groups=total_groups,
        has_related=has_related,
        n_orphan_pids=n_orphan_pids,
    )
