const SRS_KNOWLEDGE = {
  airbag: {
    title: "نظام الإيرباق",
    simpleName: "الوسائد الهوائية",
    severity: "critical",
    userMeaning:
      "هذا من أهم أنظمة السلامة. لو فيه خلل، ممكن الإيرباق ما يشتغل وقت الحادث لا قدر الله.",
    simpleTips: [
      "لا تتجاهلين لمبة الإيرباق.",
      "لا تفصلين فيش تحت المقاعد بنفسك.",
      "افحصيه عند مختص أنظمة سلامة.",
    ],
  },

  seatbelt: {
    title: "شدادات الأحزمة",
    simpleName: "نظام شد حزام الأمان وقت الحادث",
    severity: "critical",
    userMeaning:
      "هذا النظام يشد الحزام بسرعة وقت الحادث عشان يحمي الراكب. أي خلل فيه مهم جدًا.",
    simpleTips: [
      "استخدمي الحزام دائمًا.",
      "لو لمبة الإيرباق شغالة، افحصي الأحزمة والفيش.",
    ],
  },

  crash_sensor: {
    title: "حساسات الصدمة",
    simpleName: "حساسات تعرف إذا صار حادث",
    severity: "critical",
    userMeaning:
      "هذه الحساسات تساعد السيارة تعرف متى تفتح الإيرباق. خللها يعتبر مهم.",
    simpleTips: ["لا تؤجلي فحصه.", "هذا مو شيء يتصلح بالتخمين."],
  },

  occupancy_sensor: {
    title: "حساس الراكب",
    simpleName: "حساس يعرف إذا فيه أحد جالس على الكرسي",
    severity: "warning",
    userMeaning:
      "هذا يساعد السيارة تعرف هل تفعل إيرباق الراكب أو لا.",
    simpleTips: [
      "لا تحطي أشياء ثقيلة على كرسي الراكب لفترة طويلة.",
      "لو لمبة الراكب أو الإيرباق غريبة، افحصي الحساس.",
    ],
  },

  communication: {
    title: "اتصال نظام السلامة",
    simpleName: "كمبيوترات السلامة مو متواصلة صح",
    severity: "critical",
    userMeaning:
      "السيارة مو قادرة تتواصل مع جزء من نظام السلامة. هذا يحتاج فحص.",
    simpleTips: [
      "ابدئي بفحص البطارية والفيوزات.",
      "بعدها يحتاج فحص كمبيوتر SRS.",
    ],
  },

  unknown: {
    title: "تنبيه من نظام السلامة",
    simpleName: "النظام أرسل قراءة تخص الإيرباق أو الأحزمة",
    severity: "warning",
    userMeaning:
      "وصلتنا قراءة من نظام السلامة، لكن ما قدرنا نحدد معناها بدقة من البيانات الحالية.",
    simpleTips: [
      "لو لمبة الإيرباق شغالة، لا تتجاهلينها.",
      "نظام السلامة يحتاج فحص مختص.",
    ],
  },
};

function safeText(value) {
  try {
    return JSON.stringify(value || {}).toLowerCase();
  } catch {
    return "";
  }
}

function classifySrsItem(item = {}) {
  const text = safeText(item);

  if (text.includes("airbag") || text.includes("srs") || text.includes("b000")) {
    return "airbag";
  }

  if (text.includes("seat") || text.includes("belt") || text.includes("pretension")) {
    return "seatbelt";
  }

  if (text.includes("crash") || text.includes("impact")) {
    return "crash_sensor";
  }

  if (text.includes("occup") || text.includes("passenger")) {
    return "occupancy_sensor";
  }

  if (text.includes("u0") || text.includes("communication")) {
    return "communication";
  }

  return "unknown";
}

function explainSrsItem(item = {}) {
  const key = classifySrsItem(item);
  const knowledge = SRS_KNOWLEDGE[key] || SRS_KNOWLEDGE.unknown;

  return {
    type: key,
    ...knowledge,
    raw: item,
  };
}

function explainSrsSummary(srs) {
  if (!srs || typeof srs !== "object") {
    return [];
  }

  const found = Array.isArray(srs.found) ? srs.found : [];
  const results = Array.isArray(srs.results) ? srs.results : [];

  const sourceItems = found.length
    ? found
    : results.filter((x) => x && x.hasResponse);

  return sourceItems.map((item) => explainSrsItem(item));
}

module.exports = {
  SRS_KNOWLEDGE,
  classifySrsItem,
  explainSrsItem,
  explainSrsSummary,
};