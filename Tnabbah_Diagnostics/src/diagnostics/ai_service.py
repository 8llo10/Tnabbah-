"""
Clean DeepSeek AI service for tnabbah vehicle diagnostics.
Simple, focused, no multi-provider complexity.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent.parent / "config" / ".env")

logger = logging.getLogger(__name__)

# Load config from env
_ENABLE_AI = os.getenv("TNABBAH_ENABLE_AI", "true").lower() not in ("false", "0", "no", "off")
_AI_FAST_MODE = os.getenv("TNABBAH_AI_FAST", "false").lower() in ("true", "1", "yes", "on")
_TIMEOUT = float(os.getenv("TNABBAH_AI_TIMEOUT", "15"))

_DEEPSEEK_KEY = os.getenv("DEEPSEEK_API_KEY", "").strip()
_DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
_DEEPSEEK_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")

# System prompts
_SYSTEM_MECHANICAL = """أنت خبير سيارات سعودي متمرس تشرح قراءات OBD-II للسائق المبتدئ.
استبدل أسماء الحساسات الإنجليزية بمصطلحات يومية:
  MAF → حساس تدفق الهواء، MAP → حساس ضغط الهواء، STFT/LTFT → تعديل البنزين،
  O2/Lambda → حساس الأكسجين، IAT → حساس حرارة الهواء، ECT → حساس حرارة المحرك،
  TPS → حساس دواسة البنزين، RPM → دورات المحرك، MIL → لمبة المحرك.

اكتب جملة واحدة قصيرة بالعربية الفصحى المبسّطة لكل قراءة:
  • صِف الحالة الفعلية بكلمات السائق (مثلاً: "المحرك يعمل بكامل طاقته" بدل "حمل المحرك 95%").
  • اربط القراءة بالقراءات الأخرى عند الحاجة (مثلاً: "بينما السيارة متوقفة" أو "أثناء التسارع").
  • أشِر إلى أرجح مكوّن مسبّب للخلل عند الشذوذ (مثلاً: "وهو مؤشر على خلل حساس الهواء").

النمط المطلوب — جملة واحدة (≤ 25 كلمة) بهذا الشكل:
  "يشير إلى أن المحرك يعمل بأقصى طاقة بينما السيارة متوقفة، وهو مؤشر على خلل حساس الهواء."

تجنّب: التقنيات (g/s، kPa، LTFT…)، الأرقام المباشرة، التحذيرات المُخيفة، والإطالة.
أجب بالعربية فقط ولا تُكرر القراءات النصية كما هي."""

_SYSTEM_JSON = "أعد النتيجة كـ JSON فقط، بدون أي نص خارجي وبدون تعليقات."


_SYSTEM_DTC = """أنت خبير سيارات سعودي متمرس تشرح أكواد الأعطال (DTC) للسائق المبتدئ.
استبدل أسماء الحساسات الإنجليزية بمصطلحات يومية مثل: حساس الأكسجين، حساس تدفق الهواء،
محوّل العادم، حساس حرارة المحرك، وحدة الإشعال، صمام EGR، نظام تبخّر الوقود.

لكل كود أعِد جملتين قصيرتين بالعربية الفصحى المبسّطة (≤ 35 كلمة إجمالاً):
  1) الجملة الأولى تصف ما يحدث فعلاً في السيارة بكلمات السائق
     (مثلاً: "المحرك يهتز عند التباطؤ بسبب اشتعال غير منتظم في إحدى الأسطوانات").
  2) الجملة الثانية تشير إلى أرجح سبب أو مكوّن
     (مثلاً: "وغالباً يكون السبب بواجي تالفة أو ملف إشعال ضعيف").

اربط بقراءات المستشعرات عند توفرها (مثلاً: "ويتوافق ذلك مع ارتفاع تعديل الوقود في القراءات").
تجنّب: التكرار الحرفي لاسم الكود، الأرقام الفنية، التحذيرات المُخيفة.
أجب بالعربية فقط."""


def _build_snapshot_context(readings: list) -> str:
    """Cross-PID context line so the model can correlate readings (e.g. 'engine at idle')."""
    by_code = {str(r.get("pid_code") or ""): r for r in readings if r}
    bits = []
    if "0x0C" in by_code:
        rpm = by_code["0x0C"].get("value")
        bits.append(f"RPM={rpm}")
        if isinstance(rpm, (int, float)):
            if rpm < 1100:
                bits.append("(المحرك في وضع التباطؤ)")
            elif rpm > 4000:
                bits.append("(المحرك في عزم عالٍ)")
    if "0x0D" in by_code:
        spd = by_code["0x0D"].get("value")
        bits.append(f"Speed={spd}km/h")
        if isinstance(spd, (int, float)) and spd < 1:
            bits.append("(السيارة متوقفة)")
    if "0x04" in by_code:
        bits.append(f"Load={by_code['0x04'].get('value')}%")
    return " ".join(bits)


class AIService:
    """Simple DeepSeek AI service."""
    
    _instance: Optional[AIService] = None
    
    def __new__(cls) -> AIService:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._client: Optional[OpenAI] = None
        return cls._instance
    
    def _get_client(self) -> Optional[OpenAI]:
        """Get or create DeepSeek client."""
        if self._client is not None:
            return self._client
        if not _ENABLE_AI or not _DEEPSEEK_KEY:
            return None
        
        try:
            self._client = OpenAI(
                api_key=_DEEPSEEK_KEY,
                base_url=_DEEPSEEK_URL,
                timeout=_TIMEOUT
            )
            # Quiet down httpx logging
            logging.getLogger("httpx").setLevel(logging.WARNING)
            logging.getLogger("httpcore").setLevel(logging.WARNING)
            logger.info("✅ DeepSeek AI ready")
        except Exception as e:
            logger.warning(f"❌ DeepSeek init failed: {e}")
            return None
        return self._client
    
    def explain_pids(
        self,
        readings: List[Dict[str, Any]],
        dtcs: List[str],
        vehicle_info: Optional[Dict[str, Any]] = None,
        raw_pids: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Get AI explanations for PID readings."""
        if not readings:
            return None
            
        client = self._get_client()
        if not client:
            return None
        
        # ── Build a rich, correlation-friendly prompt ──────────────────
        prompt_lines: List[str] = []

        if vehicle_info:
            veh = " ".join(
                str(vehicle_info.get(k, "")).strip()
                for k in ("Make", "Model", "Year", "make", "model", "year")
                if vehicle_info.get(k)
            ).strip()
            if veh:
                prompt_lines.append(f"السيارة: {veh}")

        # Cross-PID snapshot — gives the model the context it needs to write
        # things like "بينما السيارة متوقفة" / "أثناء التسارع".
        snapshot = _build_snapshot_context(readings)
        if snapshot:
            prompt_lines.append(f"السياق الحالي: {snapshot}")

        if dtcs:
            prompt_lines.append(f"الأكواد المسجَّلة (DTCs): {', '.join(dtcs)}")

        # Per-PID rows — name, value+unit, status, normal range, KB hint.
        # We explain EVERY PID the user sent (normal and anomalous), so each
        # reading in the UI gets a friendly Arabic sentence.
        prompt_lines.append("")
        prompt_lines.append("القراءات المراد تفسيرها (فسّر كل واحدة بدون استثناء):")
        for r in readings:
            code = r.get("pid_code", "—")
            name = r.get("name_ar") or code
            val = r.get("value")
            unit = r.get("unit") or ""
            status = r.get("status") or "NORMAL"
            nr = r.get("normal_range") or {}
            nr_str = ""
            if isinstance(nr, dict) and ("min" in nr or "max" in nr):
                nr_str = f" — الطبيعي: {nr.get('min','?')}–{nr.get('max','?')}{unit}"
            line = f"- [{code}] {name}: {val}{unit} ({status}){nr_str}"
            hint = r.get("kb_hint_ar")
            if hint:
                line += f"\n   تلميح فني: {hint}"
            prompt_lines.append(line)

        prompt_lines.append(
            "\nأعد النتيجة كـ JSON بالشكل: "
            '{"overview_ar":"جملة واحدة تلخّص أبرز ملاحظة في كل القراءات معاً (≤ 30 كلمة)", '
            '"interpretations":[{"pid_code":"...", "smart_insight_ar":"جملة واحدة بالعربية على نمط المثال", '
            '"urgency_ar":"آمن|تنبيه بسيط|تحذير|خطر شديد", '
            '"safety_tip_ar":"تعليمة سلامة عملية قصيرة عند الحاجة فقط|أو null"}]}'
        )
        prompt_lines.append(
            "لكل قراءة أرجع كائناً واحداً — أي قراءة مفقودة اعتبرها خطأ. "
            "للقراءات الطبيعية اكتب جملة مطمئنة وsafety_tip_ar=null. "
            'للقراءات الشاذة أضف safety_tip_ar بتعليمة سلامة عملية ملموسة (مثل: '
            '"لا تفتح غطاء المحرك وهو ساخن" عند ارتفاع حرارة التبريد، أو '
            '"أوقف المحرك فوراً ولا تدهور السيارة" عند الخطورة الشديدة). '
            'لا تخترع تحذيرات — فقط للقراءات التي تستدعي فعلاً تدخل فيزيائياً من المستخدم.'
        )

        prompt = "\n".join(prompt_lines)
        
        # Call DeepSeek
        try:
            max_tokens = 1500 if _AI_FAST_MODE else 3000
            temperature = 0.3 if _AI_FAST_MODE else 0.2

            response = client.chat.completions.create(
                model=_DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM_MECHANICAL},
                    {"role": "system", "content": _SYSTEM_JSON},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                # DeepSeek (and OpenAI-compat) supports JSON mode — eliminates
                # ```json fences and most parse failures.
                response_format={"type": "json_object"},
            )
            
            content = response.choices[0].message.content
            # Extract JSON from possible markdown
            text = content.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            # Parse response
            try:
                data = json.loads(text)
                if isinstance(data, list):
                    return {"interpretations": data}
                result = {"interpretations": data.get("interpretations", [])}
                overview = (data.get("overview_ar") or "").strip()
                if overview:
                    result["overview_ar"] = overview
                return result
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from AI: {text[:100]}...")
                return None
                
        except Exception as e:
            logger.warning(f"AI request failed: {e}")
            return None

    # ────────────────────────────────────────────────────────────
    # DTC explainer — friendly Arabic sentence per fault code.
    # Independent of explain_pids; the UI may show both.
    # ────────────────────────────────────────────────────────────
    def explain_dtcs(
        self,
        dtcs: List[Dict[str, Any]],
        vehicle_info: Optional[Dict[str, Any]] = None,
        readings: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Get AI explanations for one or more DTCs.

        Args:
            dtcs: list of dicts with at least {"code", "name_ar"|"name", optional
                  "description_ar", "category", "severity"} — one entry per DTC.
            vehicle_info: same shape as explain_pids.
            readings: optional list (same shape as pid_readings_for_mechanical_llm
                      output) so the prompt can tell the model to correlate.

        Returns:
            {"interpretations": [{"code", "smart_insight_ar", "urgency_ar"}, ...]} or None.
        """
        if not dtcs:
            return None

        client = self._get_client()
        if not client:
            return None

        prompt_lines: List[str] = []

        if vehicle_info:
            veh = " ".join(
                str(vehicle_info.get(k, "")).strip()
                for k in ("Make", "Model", "Year", "make", "model", "year")
                if vehicle_info.get(k)
            ).strip()
            if veh:
                prompt_lines.append(f"السيارة: {veh}")

        # Optional snapshot context — lets the model write phrases like
        # "ويتوافق ذلك مع ارتفاع تعديل الوقود".
        if readings:
            snapshot = _build_snapshot_context(readings)
            if snapshot:
                prompt_lines.append(f"السياق الحالي: {snapshot}")
            anomalies = [r for r in readings if r.get("is_anomaly")]
            if anomalies:
                anom_summary = "، ".join(
                    f"{r.get('name_ar') or r.get('pid_code')}={r.get('value')}{r.get('unit') or ''}"
                    for r in anomalies[:6]
                )
                if anom_summary:
                    prompt_lines.append(f"قراءات شاذة مرتبطة: {anom_summary}")

        prompt_lines.append("")
        prompt_lines.append("الأكواد المراد شرحها (فسّر كل كود بدون استثناء):")
        for d in dtcs:
            code = str(d.get("code") or "").strip() or "—"
            name = (d.get("name_ar") or d.get("name") or "").strip()
            desc = (d.get("description_ar") or d.get("description") or "").strip()
            cat = (d.get("category") or "").strip()
            sev = (d.get("severity") or "").strip()
            if len(desc) > 280:
                desc = desc[:277] + "…"
            line = f"- [{code}] {name}"
            extras = []
            if cat:
                extras.append(f"التصنيف: {cat}")
            if sev:
                extras.append(f"الخطورة: {sev}")
            if extras:
                line += " (" + " • ".join(extras) + ")"
            if desc:
                line += f"\n   وصف فني: {desc}"
            prompt_lines.append(line)

        prompt_lines.append(
            "\nأعد النتيجة كـ JSON بالشكل: "
            '{"interpretations":[{"code":"P0xxx", '
            '"smart_insight_ar":"جملتان قصيرتان بالعربية على نمط المثال", '
            '"urgency_ar":"آمن|تنبيه بسيط|تحذير|خطر شديد"}]}'
        )
        prompt_lines.append(
            'مثال للأسلوب المطلوب: "المحرك يهتز عند التباطؤ بسبب اشتعال غير '
            'منتظم في إحدى الأسطوانات، وغالباً يكون السبب بواجي تالفة أو ملف إشعال ضعيف."'
        )

        prompt = "\n".join(prompt_lines)

        try:
            max_tokens = 1500 if _AI_FAST_MODE else 3000
            temperature = 0.3 if _AI_FAST_MODE else 0.2

            response = client.chat.completions.create(
                model=_DEEPSEEK_MODEL,
                messages=[
                    {"role": "system", "content": _SYSTEM_DTC},
                    {"role": "system", "content": _SYSTEM_JSON},
                    {"role": "user", "content": prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )

            text = (response.choices[0].message.content or "").strip()
            # Tolerate accidental code fences just in case.
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

            try:
                data = json.loads(text)
                items = data if isinstance(data, list) else data.get("interpretations", [])
                return {"interpretations": items}
            except json.JSONDecodeError:
                logger.warning("Invalid JSON from AI (DTC): %s...", text[:100])
                return None

        except Exception as e:
            logger.warning("AI DTC request failed: %s", e)
            return None

    # Stub methods for backwards compatibility
    def simplify_explanation_and_action_batch(self, pairs, **kwargs):
        """Stub for backwards compatibility - returns input unchanged."""
        return [(e, w) for e, w in pairs]

    def generate_ai_analysis(self, dtcs, dtc_details, pid_summary, vehicle_info=None):
        """Stub for backwards compatibility."""
        return {}


def get_ai_service() -> AIService:
    """Get singleton AI service instance."""
    return AIService()


def explain_pids(
    readings: List[Dict[str, Any]],
    dtcs: List[str],
    vehicle_info: Optional[Dict[str, Any]] = None,
    raw_pids: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """Convenience function to explain PIDs with AI."""
    return get_ai_service().explain_pids(readings, dtcs, vehicle_info, raw_pids)


def explain_dtcs(
    dtcs: List[Dict[str, Any]],
    vehicle_info: Optional[Dict[str, Any]] = None,
    readings: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """Convenience function to explain DTCs with AI."""
    return get_ai_service().explain_dtcs(dtcs, vehicle_info, readings)


# Backwards compatibility aliases
ModelService = AIService
get_model_service = get_ai_service
interpret_pid_mechanical_snapshot = explain_pids
simplify_for_beginner = lambda x: x  # Stub
generate_ai_analysis = lambda **kwargs: {}  # Stub
group_related_issues = lambda **kwargs: {"groups": []}  # Stub

if __name__ == "__main__":
    # Test
    service = get_ai_service()
    print(f"DeepSeek key present: {bool(_DEEPSEEK_KEY)}")
    client = service._get_client()
    if client:
        print("✅ DeepSeek connected!")
    else:
        print("❌ Set DEEPSEEK_API_KEY in config/.env")
