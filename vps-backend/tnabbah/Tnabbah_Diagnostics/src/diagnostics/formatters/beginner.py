"""
Beginner-driver mode — friendly format for new drivers / non-mechanics.

Goal: turn the technical report into something a 16-year-old or a
non-mechanical person can read without panicking. No jargon, clear
action steps, and a short script of what to say to the mechanic.
"""
from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple

from .severity import DISCLAIMER_AR, _worst_severity, _limit_words


# ── Severity → friendly label, headline action, drive instruction, calming line ──

BEGINNER_SEVERITY: Dict[str, Dict[str, str]] = {
    "CRITICAL": {
        "label": "🔴 خطر شديد",
        "headline_action": "أوقف السيارة فوراً واتصل بشخص يساعدك",
        "can_drive_emoji": "🛑",
        "can_drive_answer": "لا",
        "can_drive_instruction": (
            "🛑 لا تقود السيارة الآن — اتصل بشاحنة سحب أو شخص يجي يساعدك. "
            "السلامة أهم من أي شي."
        ),
        "reassurance": (
            "خذ نفس عميق. السيارة تحتاج اهتمام الحين، لكن أنت بأمان طول ما "
            "وقفت في مكان آمن. كل المشكلة تنحل عند الورشة."
        ),
    },
    "HIGH": {
        "label": "🟠 خطر",
        "headline_action": "روح للورشة خلال يوم",
        "can_drive_emoji": "⚠️",
        "can_drive_answer": "نعم بحذر",
        "can_drive_instruction": (
            "⚠️ تقدر تسوق بحذر — لكن لا تطول. روح للورشة اليوم لو ممكن، "
            "وتجنب السرعات العالية والمسافات الطويلة."
        ),
        "reassurance": (
            "لا تخاف، السيارة تشتغل بس محتاجة كشف اليوم. أغلب هالمشاكل "
            "بسيطة لما يشوفها فني خبير."
        ),
    },
    "MEDIUM": {
        "label": "🟡 تحذير",
        "headline_action": "خذها للورشة خلال أسبوع",
        "can_drive_emoji": "✅",
        "can_drive_answer": "نعم",
        "can_drive_instruction": (
            "✅ تقدر تسوق طبيعي هالأيام — لكن لا تهمل الفحص خلال أسبوع. "
            "كل ما عجلت بالكشف، غالباً تقلّ صعوبة المشكلة."
        ),
        "reassurance": (
            "لا تقلق، أغلب المشاكل من هالنوع بسيطة وتتحل بسرعة. "
            "السيارة بخير حالياً."
        ),
    },
    "LOW": {
        "label": "🟢 تنبيه بسيط",
        "headline_action": "سيارتك بخير، تقدر تسوق بأمان",
        "can_drive_emoji": "✅",
        "can_drive_answer": "نعم",
        "can_drive_instruction": "✅ سوق زي ما أنت مرتاح — السيارة بخير.",
        "reassurance": (
            "كل شي تمام. أحياناً تطلع أكواد قديمة أو مخزنة من فحص سابق "
            "وما تعني وجود مشكلة."
        ),
    },
}


# ── Generic glossary: technical term → plain Arabic explanation ──────────

BEGINNER_GLOSSARY: Dict[str, str] = {
    "MAF": "حساس الهواء (يقيس كمية الهواء الداخلة للمحرك)",
    "حساس MAF": "حساس الهواء (يقيس كمية الهواء الداخلة للمحرك)",
    "MAP": "حساس ضغط الهواء داخل المحرك",
    "O2": "حساس الأكسجين (يقرأ العادم عشان يضبط خلطة البنزين والهواء)",
    "حساس الأكسجين": "حساس صغير في العادم يضبط خلطة البنزين والهواء",
    "STFT": "معايرة الوقود السريعة (تعديل لحظي للخلطة)",
    "LTFT": "معايرة الوقود البطيئة (تعديل ثابت للخلطة)",
    "Bank 1": "الجهة الأولى من المحرك",
    "Bank 2": "الجهة الثانية من المحرك",
    "ECU": "كمبيوتر السيارة (العقل الإلكتروني اللي يدير المحرك)",
    "PCM": "كمبيوتر السيارة (العقل الإلكتروني اللي يدير المحرك)",
    "EVAP": "نظام تجميع أبخرة البنزين (عشان ما تطلع للجو)",
    "EGR": "صمام تدوير العادم (يرجع جزء من العادم للمحرك)",
    "PCV": "صمام تهوية المحرك",
    "DTC": "كود عطل اللي يطلعه كمبيوتر السيارة",
    "OBD": "نظام التشخيص الإلكتروني للسيارة",
    "alternator": "الدينمو (يشحن البطارية أثناء التشغيل)",
    "الدينامو": "الدينمو (يشحن البطارية أثناء التشغيل)",
    "caliper": "فك الفرامل اللي يضغط على القرص",
    "timing belt": "سير المحرك (السير الرئيسي اللي يدير الأجزاء)",
    "catalytic converter": "المحول الحفاز (فلتر العادم الكبير)",
    "vacuum leak": "تسرب هواء من الخراطيم",
    "lean mixture": "خلطة خفيفة (هواء أكثر من البنزين)",
    "rich mixture": "خلطة غنية (بنزين أكثر من الهواء)",
    "الخلطة خفيفة": "هواء أكثر من البنزين في خلطة الاحتراق",
    "الخلطة غنية": "بنزين أكثر من الهواء في خلطة الاحتراق",
    "misfire": "خلل في إشعال البنزين داخل المحرك",
    "الإشعال": "العملية اللي يشتعل فيها البنزين داخل المحرك",
}


# ── Ordered jargon → friendly replacements ──────────────────────────────
# Order matters: longer/more-specific phrases first so they replace before
# their shorter sub-strings get swapped. Keep this list deterministic.

SIMPLE_REPLACEMENTS: List[Tuple[str, str]] = [
    # Air / intake
    ("تسرب الهواء في نظام السحب", "خرطوم هواء متشقق أو مفكوك"),
    ("نظام السحب", "خراطيم دخول الهواء"),
    ("vacuum leak", "تسرب هواء من خرطوم"),
    ("intake manifold", "ماسورة الهواء الرئيسية"),

    # Sensors
    ("مستشعر الأكسجين (O2)", "حساس الأكسجين (يقرأ العادم)"),
    ("مستشعر الأكسجين O2", "حساس الأكسجين (يقرأ العادم)"),
    ("مستشعر الأكسجين", "حساس الأكسجين"),
    ("حساس الأوكسجين", "حساس الأكسجين"),
    ("مستشعر الهواء (MAF)", "حساس الهواء"),
    ("حساس MAF", "حساس الهواء"),
    ("MAF معطل", "حساس الهواء عطلان"),

    # Fuel system
    ("مضخة الوقود ضعيفة", "مضخة البنزين بدأت تضعف"),
    ("مضخة الوقود", "مضخة البنزين"),
    ("الخلطة خفيفة جداً", "الخلطة فيها هواء أكثر من اللازم (بنزين قليل)"),
    ("الخلطة غنية جداً", "الخلطة فيها بنزين أكثر من اللازم"),

    # Banks
    ("Bank 1", "الجهة الأولى من المحرك"),
    ("Bank 2", "الجهة الثانية من المحرك"),
    ("بنك 1", "الجهة الأولى من المحرك"),
    ("بنك 2", "الجهة الثانية من المحرك"),

    # Misc engine terms
    ("misfire", "خلل في الإشعال"),
    ("knock", "صوت طرق في المحرك"),
    ("ECU", "كمبيوتر السيارة"),
    ("PCM", "كمبيوتر السيارة"),
    ("EVAP", "نظام أبخرة البنزين"),
    ("EGR", "صمام تدوير العادم"),
    ("PCV", "صمام تهوية المحرك"),
    ("alternator", "الدينمو"),
    ("caliper", "فك الفرامل"),
    ("timing belt", "سير المحرك"),
    ("catalytic converter", "المحول الحفاز"),

    # Bare-acronym fallbacks — keep these LAST so multi-word phrases above
    # win first ("حساس MAF" → "حساس الهواء" before "MAF" → "حساس الهواء").
    ("MAF", "حساس الهواء"),
    ("MAP", "حساس ضغط الهواء"),
    ("O2", "حساس الأكسجين"),
]


def simplify_jargon(text: str) -> str:
    """
    Apply ordered jargon → friendly replacements.

    Used on every user-facing string before showing to a beginner (titles,
    explanations, causes, symptoms, what-to-do, etc.).
    """
    if not text:
        return ""
    out = str(text)
    for term, friendly in SIMPLE_REPLACEMENTS:
        # Word-ish replacement; keep it simple (str.replace) so we stay
        # deterministic and don't fight Arabic word boundaries.
        out = out.replace(term, friendly)
    out = re.sub(r"\s+", " ", out).strip()
    return out


# ── Internal helpers ─────────────────────────────────────────────────────


def _bullets_from_enhanced(text: str) -> List[str]:
    """LLM-enhanced fields come back as bullet-style strings; split them safely."""
    if not text:
        return []
    raw = text.replace("\\n", "\n")
    parts: List[str] = []
    for line in raw.splitlines():
        line = line.strip().lstrip("•-–—*").strip()
        if line:
            parts.append(line)
    return parts


def _get_simple_causes(issue: Dict[str, Any], limit: int = 4) -> List[str]:
    """
    Pick the best available causes list and simplify each entry.

    Preference order (most LLM-curated → most raw):
      1) causes_prioritized  (LLM reordered)
      2) possible_causes_ar_enhanced (LLM bullet block)
      3) possible_causes  (raw KB list)
    """
    cp = issue.get("causes_prioritized") or []
    if cp:
        cleaned = [simplify_jargon(str(c)) for c in cp if str(c).strip()]
        return [c for c in cleaned if c][:limit]

    pce = issue.get("possible_causes_ar_enhanced")
    if pce:
        bullets = _bullets_from_enhanced(pce)
        cleaned = [simplify_jargon(b) for b in bullets]
        return [c for c in cleaned if c][:limit]

    raw = issue.get("possible_causes") or []
    cleaned = [simplify_jargon(str(c)) for c in raw if str(c).strip()]
    return [c for c in cleaned if c][:limit]


def _get_simple_symptoms(issue: Dict[str, Any], limit: int = 4) -> List[str]:
    se = issue.get("symptoms_ar_enhanced")
    if se:
        bullets = _bullets_from_enhanced(se)
        cleaned = [simplify_jargon(b) for b in bullets]
        return [c for c in cleaned if c][:limit]

    raw = issue.get("symptoms") or []
    cleaned = [simplify_jargon(str(s)) for s in raw if str(s).strip()]
    return [c for c in cleaned if c][:limit]


def _what_to_say_to_mechanic(code: str, title_simple: str, top_cause: str) -> str:
    """
    One ready-made sentence the driver can read out loud at the workshop.

    Always includes the DTC code + a plain-Arabic problem hint + the most
    likely cause (if known) so the mechanic gets a useful starting point.
    """
    code = (code or "").strip()
    title_simple = (title_simple or "").strip()
    top_cause = (top_cause or "").strip()

    bits: List[str] = [f"الكمبيوتر طالع لي كود {code}"]
    if title_simple:
        bits.append(title_simple)
    # Skip the cause hint when it's basically the same wording as the title
    # (avoids "خرطوم متشقق — يمكن السبب: خرطوم متشقق").
    if top_cause and top_cause not in title_simple and title_simple not in top_cause:
        bits.append(f"يمكن السبب: {top_cause}")
    body = " — ".join(bits)
    return f"💬 قل للميكانيكي: «{body}. ابغاك تفحص لي السبب من الأبسط للأصعب.»"


def _build_glossary_for_text(*texts: str) -> List[Dict[str, str]]:
    """
    Scan the original texts for jargon that appears, and return short
    plain-Arabic definitions for each unique term we find.

    Dedupes by the *definition* so synonyms (e.g. "MAF" and "حساس MAF") that
    map to the same plain-Arabic explanation only appear once.
    """
    blob = " \n ".join(t for t in texts if t)
    if not blob:
        return []
    found: List[Dict[str, str]] = []
    seen_defs: set = set()
    for term, definition in BEGINNER_GLOSSARY.items():
        if not term or term not in blob:
            continue
        if definition in seen_defs:
            continue
        seen_defs.add(definition)
        found.append({"term": term, "definition": definition})
    return found


def _next_steps_for_severity(severity: str) -> List[str]:
    """Step-by-step list of friendly actions tuned to the worst severity."""
    s = (severity or "MEDIUM").upper()
    if s == "CRITICAL":
        return [
            "1. 🛑 أوقف السيارة في مكان آمن وأطفئ المحرك.",
            "2. 📞 اتصل بشاحنة سحب أو بشخص يجي يساعدك.",
            "3. 🚫 لا تكمل القيادة حتى لو حسيت إن السيارة تمشي عادي.",
            "4. 👨\u200d🔧 لما توصل الورشة، اعرض هالتقرير على الفني.",
        ]
    if s == "HIGH":
        return [
            "1. 🧘 خذ نفس عميق — ليس بالضرورة توقفاً فورياً، لكن التقرير يصنِّف الوضع «خطر» "
            "ويستدعي فحصاً قريباً.",
            "2. 🏁 رتّب موعد ورشة اليوم لو ممكن.",
            "3. 🐢 سوق بهدوء، تجنب السرعات العالية والمسافات الطويلة.",
            "4. 💬 اعرض هذا التقرير على الفني أو اقرأ له جملة «قل للميكانيكي».",
            "5. 📸 خذ لقطة شاشة للتقرير عشان تكون جاهز.",
        ]
    if s == "MEDIUM":
        return [
            "1. 🧘 لا تقلق — هذا تنبيه عادي مش طارئ.",
            "2. 📅 رتّب موعد ورشة خلال هذا الأسبوع.",
            "3. 💬 وريهم التقرير، فيه جملة جاهزة تقولها للميكانيكي.",
            "4. 👀 لاحظ أي تغيّر بسيارتك (صوت، رجة، ضعف عزم) واخبر الفني.",
        ]
    return [
        "1. ✅ كل شي تمام — تقدر تسوق طبيعي.",
        "2. 📅 لا تنسى الصيانة الدورية كل ٥٬٠٠٠ كم تقريباً.",
        "3. 👀 لو حسيت بشي غريب لاحقاً، رجع وافحص.",
    ]


def _beginner_summary(
    overall_severity: str,
    issues_simple: List[Dict[str, Any]],
) -> str:
    """One short, plain-Arabic sentence: what's wrong + what to do."""
    s = (overall_severity or "LOW").upper()
    n = len(issues_simple)

    if n == 0:
        return "🎯 سيارتك بخير وما فيها مشاكل مسجلة — تقدر تسوق بأمان."

    first_title = issues_simple[0].get("title_simple") or issues_simple[0].get("code", "")

    if s == "CRITICAL":
        return (
            f"🎯 فيه مشكلة جدية ({first_title}) — أوقف السيارة الآن واتصل "
            f"بشخص يساعدك. لا تكمل قيادة."
        )
    if s == "HIGH":
        head = first_title if n == 1 else f"{first_title} و{n - 1} مشكلة ثانية"
        return (
            f"🎯 سيارتك فيها مشكلة مهمة ({head}). تقدر تسوق بحذر، "
            f"بس روح للورشة اليوم."
        )
    if s == "MEDIUM":
        head = first_title if n == 1 else f"{first_title} و{n - 1} مشكلة بسيطة ثانية"
        return (
            f"🎯 فيه تنبيه بسيط ({head}) — تقدر تسوق طبيعي، "
            f"بس خذها للورشة هذا الأسبوع."
        )
    return (
        "🎯 الأكواد اللي طلعت بسيطة أو مخزنة من فحص قديم — "
        "السيارة بخير غالباً."
    )


def _beginner_from_group(
    group: Dict[str, Any],
    issues_by_code: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    """One beginner card for a union-find cluster (DTCs ± related PID anomalies)."""
    dtcs = list(group.get("dtcs") or [])
    anoms = list(group.get("related_pid_anomalies") or [])
    is_grouped = bool(group.get("is_grouped"))

    sev_list: List[str] = []
    for c in dtcs:
        row = issues_by_code.get(c)
        if row:
            sev_list.append(str(row.get("severity_raw") or "MEDIUM").upper())
    for a in anoms:
        sl = str(a.get("severity_level") or "").upper()
        if sl == "CRITICAL":
            sev_list.append("CRITICAL")
        elif sl == "WARNING":
            sev_list.append("HIGH")
        elif sl == "NORMAL":
            sev_list.append("LOW")
        else:
            sev_list.append("MEDIUM")
    worst = _worst_severity(sev_list) if sev_list else "MEDIUM"
    if worst not in BEGINNER_SEVERITY:
        worst = "MEDIUM"
    sev_pkg = BEGINNER_SEVERITY[worst]

    primary = dtcs[0] if dtcs else ""
    base_issue = issues_by_code.get(primary) if primary else None

    title_simple = simplify_jargon(str(group.get("root_cause_ar") or "").strip())
    if not title_simple and base_issue:
        title_simple = simplify_jargon(str(base_issue.get("title") or primary))
    if not title_simple:
        title_simple = "تنبيه من القراءات"

    expl_parts: List[str] = []
    if base_issue:
        expl_parts.append(simplify_jargon(str(base_issue.get("explanation") or "")))
    for c in dtcs:
        if c == primary:
            continue
        bi = issues_by_code.get(c)
        if bi:
            t = simplify_jargon(str(bi.get("explanation") or ""))
            if t and t not in expl_parts:
                expl_parts.append(t)
    explanation_simple = " ".join(x for x in expl_parts if x).strip() or title_simple

    what_to_do_simple = ""
    if base_issue:
        what_to_do_simple = simplify_jargon(str(base_issue.get("what_to_do") or ""))
    if not what_to_do_simple:
        what_to_do_simple = "🔗 اعرض التقرير على الورشة واطلب فحصاً للمحرك والوقود والهواء."

    merged_causes: List[str] = []
    merged_symptoms: List[str] = []
    for c in dtcs:
        row = issues_by_code.get(c)
        if not row:
            continue
        merged_causes.extend(_get_simple_causes(row))
        merged_symptoms.extend(_get_simple_symptoms(row))
    merged_causes = merged_causes[:4]
    merged_symptoms = merged_symptoms[:4]

    pid_plain_lines: List[str] = []
    for a in anoms:
        nm = simplify_jargon(str(a.get("pid_name") or a.get("pid_code") or ""))
        val = a.get("current_value")
        unit = str(a.get("unit") or "").strip()
        rs = simplify_jargon(str(a.get("reason") or ""))
        sev_p = str(a.get("severity_level") or "")
        val_s = f"{val} {unit}".strip() if val is not None else ""
        line = nm
        if val_s:
            line += f" — {val_s}"
        if sev_p:
            line += f" ({sev_p})"
        if rs:
            line += f". {rs}"
        pid_plain_lines.append(line)

    top_cause = merged_causes[0] if merged_causes else ""
    if primary:
        say_to = _what_to_say_to_mechanic(primary, title_simple, top_cause)
    elif pid_plain_lines:
        say_to = f"💬 قل للميكانيكي: «عندي تنبيه من المستشعرات: {pid_plain_lines[0]} — ابغاك تفحصها.»"
    else:
        say_to = (
            "💬 قل للميكانيكي: «عندي تنبيه بالفحص الإلكتروني — ابغاك تشوف القراءات الحية.»"
        )

    extra_blob = " \n ".join(pid_plain_lines)
    glossary = _build_glossary_for_text(
        title_simple,
        explanation_simple,
        what_to_do_simple,
        extra_blob,
        " \n ".join(merged_causes),
    )

    return {
        "code": primary or "SENSOR_GROUP",
        "codes": dtcs,
        "title_simple": title_simple,
        "severity_label": sev_pkg["label"],
        "severity_raw": worst,
        "headline_action": sev_pkg["headline_action"],
        "explanation_simple": explanation_simple,
        "what_to_do_simple": what_to_do_simple,
        "possible_causes_simple": merged_causes,
        "symptoms_simple": merged_symptoms,
        "what_to_say_to_mechanic": say_to,
        "can_drive_for_this": sev_pkg["can_drive_instruction"],
        "reassurance": sev_pkg["reassurance"],
        "glossary": glossary,
        "is_grouped": is_grouped,
        "related_pids_plain": pid_plain_lines,
    }


def _beginner_issue(issue: Dict[str, Any]) -> Dict[str, Any]:
    """Convert one technical issue card into a beginner-friendly card."""
    sev = (issue.get("severity_raw") or issue.get("severity") or "MEDIUM").upper()
    if sev not in BEGINNER_SEVERITY:
        sev = "MEDIUM"

    sev_pkg = BEGINNER_SEVERITY[sev]
    code = str(issue.get("code") or "").strip()

    raw_title = issue.get("title") or code
    title_simple = simplify_jargon(raw_title)

    raw_explanation = issue.get("explanation_ar") or issue.get("explanation") or ""
    explanation_simple = simplify_jargon(raw_explanation)

    raw_what_to_do = issue.get("what_to_do_ar") or issue.get("what_to_do") or ""
    what_to_do_simple = simplify_jargon(raw_what_to_do)

    causes_simple = _get_simple_causes(issue)
    symptoms_simple = _get_simple_symptoms(issue)

    top_cause = causes_simple[0] if causes_simple else ""
    say_to_mechanic = _what_to_say_to_mechanic(code, title_simple, top_cause)

    can_drive_for_this = sev_pkg["can_drive_instruction"]

    glossary = _build_glossary_for_text(
        raw_title,
        raw_explanation,
        raw_what_to_do,
        " \n ".join(str(c) for c in (issue.get("possible_causes") or [])),
        str(issue.get("possible_causes_ar_enhanced") or ""),
    )

    return {
        "code": code,
        "title_simple": title_simple,
        "severity_label": sev_pkg["label"],
        "severity_raw": sev,
        "headline_action": sev_pkg["headline_action"],
        "explanation_simple": explanation_simple,
        "what_to_do_simple": what_to_do_simple,
        "possible_causes_simple": causes_simple,
        "symptoms_simple": symptoms_simple,
        "what_to_say_to_mechanic": say_to_mechanic,
        "can_drive_for_this": can_drive_for_this,
        "reassurance": sev_pkg["reassurance"],
        "glossary": glossary,
    }


def format_for_beginner_driver(technical_report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert the technical/LLM-rewritten report into a beginner-friendly payload.

    Goal: a 16-year-old or a non-mechanical person can read the result and:
      - know if they can drive (✅ / ⚠️ / 🛑),
      - what to do next (numbered, plain-Arabic steps),
      - what to say to the mechanic (ready-made sentence),
      - without ever seeing scary jargon (MAF, O2, Bank 1, STFT…).

    Runs AFTER `format_user_report_ar`, BEFORE the result reaches the UI.
    The full original report is preserved under `expert_details` so a
    power-user / mechanic toggle can still see it.
    """
    if not isinstance(technical_report, dict):
        return {
            "title": "📋 تقرير سيارتك",
            "is_beginner_mode": True,
            "summary": "ما قدرنا نحلل التقرير. جرّب مرة ثانية.",
            "issues": [],
            "expert_details": {},
        }

    overall_sev = str(technical_report.get("overall_severity") or "LOW").upper()
    if overall_sev not in BEGINNER_SEVERITY:
        overall_sev = "MEDIUM"
    overall_pkg = BEGINNER_SEVERITY[overall_sev]

    raw_issues = technical_report.get("issues") or []
    grouped_in = technical_report.get("grouped_issues") or []

    if grouped_in:
        issues_by_code = {
            str(i.get("code")): i
            for i in raw_issues
            if isinstance(i, dict) and i.get("code")
        }
        beginner_issues = [_beginner_from_group(g, issues_by_code) for g in grouped_in]
        summary_for_beginner = (technical_report.get("summary") or "").strip() or _beginner_summary(
            overall_sev, beginner_issues
        )
        if summary_for_beginner and not summary_for_beginner.startswith("🎯"):
            summary_for_beginner = "🎯 " + summary_for_beginner
    else:
        beginner_issues = [_beginner_issue(i) for i in raw_issues if isinstance(i, dict)]
        summary_for_beginner = _beginner_summary(overall_sev, beginner_issues)

    # Combined glossary across the whole report (deduped, capped).
    seen_terms: set = set()
    combined_glossary: List[Dict[str, str]] = []
    for bi in beginner_issues:
        for g in bi.get("glossary") or []:
            t = g.get("term")
            if t and t not in seen_terms:
                seen_terms.add(t)
                combined_glossary.append(g)
    combined_glossary = combined_glossary[:8]

    can_i_drive = {
        "emoji": overall_pkg["can_drive_emoji"],
        "answer": overall_pkg["can_drive_answer"],
        "instruction": overall_pkg["can_drive_instruction"],
        "severity": overall_sev,
    }

    next_steps = _next_steps_for_severity(overall_sev)

    # Top-level reassurance — always show, tuned to severity. Helps with panic.
    reassurance = overall_pkg["reassurance"]
    if not beginner_issues:
        reassurance = (
            "كل شي تمام بسيارتك. سواقة آمنة، استمتع 🚗 "
            "ولا تنسى الصيانة الدورية."
        )

    return {
        "title": "📋 تقرير سيارتك (نسخة مبسّطة)",
        "is_beginner_mode": True,
        "summary_for_beginner": summary_for_beginner,
        "can_i_drive": can_i_drive,
        "reassurance": reassurance,
        "overall_severity": overall_sev,
        "overall_health_percent": technical_report.get("overall_health_percent"),
        "overall_health_line": technical_report.get("overall_health"),
        "issues": beginner_issues,
        "next_steps": next_steps,
        "glossary": combined_glossary,
        "disclaimer": technical_report.get("disclaimer", DISCLAIMER_AR),
        # Keep the full technical payload available for the "Expert mode"
        # toggle in the UI (collapsed by default for beginners).
        "expert_details": technical_report,
    }
