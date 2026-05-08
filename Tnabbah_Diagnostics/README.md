# 🚗 تَنَبَّه (tnabbah) — تشخيص السيارات

نظام تشخيص ذكي للسيارات باستخدام قواعد المعرفة وتحليل بيانات OBD-II عبر **FastAPI**،
وواجهة **HTML/JS** (Single Page App) مخدومة من نفس خادم FastAPI — بدون أي خطوة بناء (build).

## 📁 هيكل المشروع

```
Tnabah_Ai/
├── config/
│   └── .env.example          # قالب الإعدادات (انسخه إلى config/.env)
├── data/                     # قواعد المعرفة (JSON) + ملفات مساعدة لصيانة الـ KB
├── scripts/                  # أدوات صيانة قواعد المعرفة والتنظيف
├── web/
│   └── index.html            # واجهة المستخدم (HTML + Tailwind via CDN + Vanilla JS)
├── src/
│   └── diagnostics/          # FastAPI + محرك التشخيص (قواعد + OBD)
│       ├── main.py           # نقاط النهاية + خدمة الواجهة الثابتة
│       ├── data_loader.py
│       ├── obd_converter.py
│       ├── report_formatter.py
│       ├── ai_service.py     # عميل DeepSeek (اختياري) — يستخدم SDK الخاص بـ openai
│       ├── model_service.py  # غلاف توافقي يعيد التصدير من ai_service
│       ├── retrieval.py
│       ├── models.py
│       ├── kb_en_fill.py     # لسكربتات ملء i18n الإنجليزي
│       └── engine/
├── tests/
├── requirements.txt
├── pyproject.toml
└── .gitignore
```

## 🚀 البدء السريع

1. **تثبيت المكتبات:**

```bash
pip install -r requirements.txt
```

2. **الإعداد:** انسخ `config/.env.example` إلى `config/.env` وعدّل القيم عند الحاجة.

3. **تشغيل الخادم + الواجهة معاً** (من جذر المشروع):

```bash
uvicorn src.diagnostics.main:app --reload --host 0.0.0.0 --port 8001
```

ثم افتح المتصفح على:

- الواجهة: <http://localhost:8001/>
- توثيق API التفاعلي: <http://localhost:8001/api/docs>

> الواجهة ملف HTML واحد في `web/index.html` يستخدم Tailwind عبر CDN — لا حاجة لـ Node أو خطوة بناء.

4. **الاختبارات:**

```bash
pytest
```

## 🔌 API (مختصر)

- `POST /api/scan` — تحليل من PIDs و DTCs مباشرة
- `POST /api/scan-obd-json` — تحليل من JSON بصيغة OBD-II (mode01 / dtcs / mode09)
- `GET /api/reports/{report_id}` — جلب تقرير سابق
- التوثيق التفاعلي: `http://localhost:8001/api/docs`

## 🧠 محرك التحليل

يعتمد المحرك على **قواعد معرفة محلية** في `data/` (PIDs و DTCs) و`RulesEngine`
للتحليل الحتمي والتنبيهات. عند ضبط **`DEEPSEEK_API_KEY`** في `config/.env`
يُفعّل تعزيز اختياري عبر **DeepSeek** (باستخدام SDK المتوافق مع OpenAI):
تفسير قراءات المستشعرات بلغة عربية مبسّطة للسائق (بدون الاعتماد عليه للتشغيل الأساسي).

## ⚙️ متغيرات البيئة (config/.env)

| المتغير | الوصف | الافتراضي |
|---|---|---|
| `FASTAPI_HOST` / `FASTAPI_PORT` | عنوان ومنفذ الخادم | `0.0.0.0` / `8001` |
| `ALLOWED_ORIGINS` | قائمة CORS مفصولة بفواصل (`*` للسماح للجميع) | فارغ |
| `DEBUG_MODE` | يفعّل `/api/debug/clear` (مع `ADMIN_TOKEN`) | `false` |
| `ADMIN_TOKEN` | رمز سري لنقاط `/api/debug/*` (مطلوب) | فارغ |
| `TNABBAH_DATA_PATH` | مسار بديل لمجلد `data/` | جذر المشروع/`data` |
| `DEEPSEEK_API_KEY` | مفتاح DeepSeek (يفعّل التحليل الذكي) | فارغ |
| `DEEPSEEK_MODEL` | اسم النموذج | `deepseek-chat` |
| `DEEPSEEK_BASE_URL` | عنوان واجهة API | `https://api.deepseek.com/v1` |
| `TNABBAH_ENABLE_AI` | `false` لتعطيل AI كلياً | `true` |
| `TNABBAH_AI_FAST` | `true` لاستجابات أسرع (توكنز أقل) | `false` |
| `TNABBAH_AI_TIMEOUT` | مهلة طلب AI بالثواني | `15` |

> ملاحظة: نقطتا `/api/debug/clear` و `/api/debug/stats` تتطلبان رأس HTTP
> `X-Admin-Token: <ADMIN_TOKEN>`؛ بدون `ADMIN_TOKEN` تُرجعان 403.

---

**Made with ❤️ for Saudi Arabia 🇸🇦**
