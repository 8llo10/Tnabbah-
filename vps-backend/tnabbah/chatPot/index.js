require('dotenv').config()
const express = require('express')
const cors = require('cors')
const OpenAI = require('openai')
const supabase = require('./supabase')

const latestSnapshots = {}

const app = express()

// =======================
// MIDDLEWARE
// =======================
app.use(cors())
app.use(express.json())

// =======================
// OPENAI
// =======================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// =======================
// TEST ROUTE
// =======================
app.get('/', (req, res) => {
  res.send('🚗 Tanaabbuh AI Backend Running')
})

// =======================
// HEALTH CHECK (NEW)
// =======================
app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Server is running 🚗' })
})

// =======================
// LIVE SNAPSHOT CACHE
// =======================
app.post('/snapshot', (req, res) => {

  const { userId, carId, snapshot } = req.body

  if (!userId || !snapshot) {
    return res.status(400).json({
      ok: false,
      error: 'missing_data'
    })
  }

  latestSnapshots[userId] = latestSnapshots[userId] || {}

  latestSnapshots[userId][carId] = {
    snapshot,
    updatedAt: Date.now(),
  }

  console.log('📡 Snapshot Updated:', userId)

  return res.json({
    ok: true
  })
})

// =======================
// HELPERS
// =======================

// =======================
// GREETING DETECTION
// =======================
function isGreeting(message) {

  const greetings = [
    'مرحبا',
    'السلام عليكم',
    'اهلا',
    'هلا',
    'hello',
    'hi'
  ]

  return greetings.some(g =>
    message.toLowerCase().includes(g.toLowerCase())
  )
}

// =======================
// CAR QUESTION DETECTION
// =======================
function isCarRelatedQuestion(message) {

  const keywords = [
    'سيارتي',
    'السيارة',
    'فحص',
    'تقرير',
    'عطل',
    'مشكلة',
    'مشاكل',
    'زيت',
    'صيانة',
    'المحرك',
    'البطارية',
    'الفرامل',
    'الراديتر',
    'حرارة',
    'كم باقي',
    'حالة السيارة',
    'تقييم السيارة',
    'كيف حالة سيارتي',
    'oil',
    'engine',
    'car',
    'problem'
  ]

  return keywords.some(word =>
    message.toLowerCase().includes(word.toLowerCase())
  )
}

// =======================
// VEHICLE HEALTH QUESTION
// =======================
function isVehicleHealthQuestion(message) {

  const keywords = [
    'كيف حالة سيارتي',
    'قيم السيارة',
    'تقييم السيارة',
    'كيف وضع السيارة',
    'هل السيارة جيدة',
    'هل السيارة سليمة',
    'حالة السيارة'
  ]

  return keywords.some(word =>
    message.includes(word)
  )
}

// =======================
// FORMAT VEHICLE ISSUES
// =======================
function formatIssues(content) {

  const report = content?.user_friendly_report_ar

  if (!report || !report.issues || report.issues.length === 0) {
    return 'لا توجد مشاكل مسجلة في آخر فحص'
  }

  return report.issues.map((issue, index) => {

    const symptoms =
      issue.symptoms?.join(' - ') || 'لا توجد أعراض'

    const causes =
      issue.possible_causes?.join(' - ') || 'غير معروفة'

    return `
🚨 المشكلة ${index + 1}:

🔧 وصف المشكلة:
${issue.explanation || issue.title || 'غير متوفر'}

⚠️ مستوى الخطورة:
${issue.severity_label || issue.severity || 'غير محدد'}

🧩 الأعراض:
${symptoms}

📌 الأسباب المحتملة:
${causes}

✅ الحل المقترح:
${issue.what_to_do || 'يفضل فحص السيارة لدى مختص'}
`
  }).join('\n')
}

// =======================
// VEHICLE SUMMARY
// =======================
function buildVehicleSummary(content) {

  const health =
    content?.analysis_metadata?.overall_health || 0

  const issues =
    content?.user_friendly_report_ar?.issues || []

  const driveAdvice =
    content?.drive_advice || 'غير متوفر'

  let status = ''


  if (health >= 80) {
    status = '🟢 السيارة بحالة جيدة'
  }
  else if (health >= 50) {
    status = '🟡 السيارة تحتاج متابعة'
  }
  else {
    status = '🔴 السيارة تحتاج فحص عاجل'
  }


  let positives = []

  const pidReadings =
    content?.all_pid_readings || []

  pidReadings.forEach(pid => {

    if (pid.status === 'NORMAL') {
      positives.push(pid.pid_name_ar)
    }

  })

  positives = positives.slice(0, 5)

  return `
🚗 التقييم العام للسيارة:

${status}

📊 نسبة صحة السيارة:
${health}%

🚨 عدد المشاكل المكتشفة:
${issues.length}

🚗 حالة القيادة:
${driveAdvice}

✅ الأمور الجيدة:
${positives.join(' - ') || 'لا توجد بيانات'}

⚠️ تحتاج متابعة:
${issues.length > 0
      ? 'يوجد بعض المشاكل التي تحتاج فحص'
      : 'لا توجد مشاكل حالياً'
    }
`
}

// =======================
// CHAT ENDPOINT
// =======================
app.post('/chat', async (req, res) => {

  const { message, userId, carId } = req.body

  console.log('====================')
  console.log('USER ID:', userId)
  console.log('MESSAGE:', message)
  console.log('====================')

  if (!userId) {
    return res.json({
      reply: '❌ userId is required'
    })
  }



  if (
    isGreeting(message) &&
    !isCarRelatedQuestion(message)
  ) {

    return res.json({
      reply: 'أهلاً، أنا مساعدك الذكي تنبه 🚗 كيف يمكنني مساعدتك اليوم بخصوص سيارتك؟'
    })
  }

  try {

    let carContext = ''

    const liveSnapshot =
      carId && latestSnapshots[userId]
        ? latestSnapshots[userId][carId] || null
        : null
    console.log("CHAT CAR ID:", carId)
    console.log("HAS SNAPSHOT:", !!liveSnapshot)
    console.log("SNAPSHOT:", liveSnapshot)

    let liveDataText = ''

    if (liveSnapshot?.snapshot) {

      const s = liveSnapshot.snapshot

      liveDataText = `
📡 بيانات السيارة الحية:

🚗 السرعة:
${s.speed ?? 'غير متوفرة'} km/h

🌡️ حرارة المحرك:
${s.engineTemp ?? 'غير متوفرة'} °C

🔋 البطارية:
${s.batteryVoltage ?? 'غير متوفرة'} V

🌀 RPM:
${s.rpm ?? 'غير متوفر'}

⛽ صحة السيارة:
${s.overallHealth ?? 'غير متوفرة'}%
`
    }



    if (isCarRelatedQuestion(message)) {

      const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .eq('car_id', carId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      console.log('REPORT ERROR:', error)
      console.log('REPORT:', report)

      const content = report?.content || null




      let vehicleSummary = ''

      if (isVehicleHealthQuestion(message)) {
        vehicleSummary =
          buildVehicleSummary(content)
      }


      carContext = `
${liveDataText}

${vehicleSummary}

🚗 تقرير السيارة من آخر فحص:

📊 الحالة العامة:
${content?.user_friendly_report_ar?.overall_health || 'غير متوفرة'}

📋 ملخص الفحص:
${content?.user_friendly_report_ar?.summary || 'لا يوجد'}

🚨 المشاكل المكتشفة:
${formatIssues(content)}

📌 التوصية النهائية:
${content?.user_friendly_report_ar?.final_recommendation?.recommendation_ar || 'لا توجد توصية'}

🚗 نصيحة القيادة:
${content?.drive_advice || 'غير متوفرة'}
`
    }


    const context = `
${carContext}

👤 سؤال المستخدم:
${message}
`


    const response =
      await openai.chat.completions.create({

        model: 'gpt-4o-mini',

        messages: [

          {
            role: 'system',
            content: `
أنت مساعد سيارات ذكي اسمه "تنبه".

━━━━━━━━━━━━━━━━━━━━━━
🎯 شخصيتك:
- خبير سيارات ذكي
- تتحدث بطريقة بشرية
- تشرح الأعطال ببساطة
- تساعد المستخدم على فهم حالة سيارته

━━━━━━━━━━━━━━━━━━━━━━
🌍 اللغة:
- رد بنفس لغة المستخدم

━━━━━━━━━━━━━━━━━━━━━━
🚗 مهامك:
1️⃣ تفسير مشاكل السيارة
2️⃣ تقييم السيارة
3️⃣ التثقيف
4️⃣ التكاليف
5️⃣ الصيانة

━━━━━━━━━━━━━━━━━━━━━━
🚫 ممنوع:
- ذكر أكواد الأعطال
- عرض JSON
- بيانات خام

━━━━━━━━━━━━━━━━━━━━━━
💬 الأسلوب:
- واضح
- بشري
- مختصر
- احترافي
`
          },

          {
            role: 'user',
            content: context
          }

        ],

        temperature: 0.3
      })


    const reply =
      response?.choices?.[0]?.message?.content || '❌ لا يوجد رد من الذكاء الاصطناعي'

    return res.json({ reply })

  } catch (err) {

    console.log('SERVER ERROR:', err)

    return res.json({
      reply: '❌ حدث خطأ في السيرفر'
    })
  }
})

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 4010

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
