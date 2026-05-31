const { getPidKnowledge } = require("./knowledge/pidKnowledge");
const { explainDtcList } = require("./knowledge/dtcKnowledge");
const { explainSrsSummary } = require("./knowledge/srsKnowledge");

const LEVEL_SCORE = {
  normal: 0,
  info: 1,
  warning: 2,
  critical: 3,
};

const HOME_MESSAGES = {
  normal: [
    "سيارتك ماشية زي الحلا اليوم 🤍",
    "كل شي تمام يا قمر، كملي طريقك 👌",
    "الوضع بالسليم يا قمر لا تشيلي هم",
    "واضح سيارتك مرتاحة اليوم ✨",
    "أمورك تمام يا قمر، بس استمري على الصيانة الدورية",
    "مافيه شي يزعج امورتنا، كملي وانبسطي 🚗",
  ],
  warning: [
    "يا امورة فيه شي مو مريحني شوي 👀 اضغطي زر الفحص وخلينا نتأكد.",
    "يا بنت شيكي على سيارتك بس للاطمئنان، اضغطي الفحص.",
    "يا حلوة! واضح فيه قراءة غريبة بسيطة، الأفضل تسوي فحص سريع.",
    "لا تهملي هالتنبيه يا حب ✋ اضغطي زر الفحص واطمني.",
    "ممكن الموضوع بسيط، بس الأفضل تفحصيها يا ماما.",
    "هي ترا سيارتك تبغى منك تشييكه سريعة يا قمر، اضغطي الفحص.",
  ],
  critical: [
    "يا بنت افحصي السيارة بأسرع وقت، فيه شي مو طبيعي.",
    "يمه الوضع مو مطمني أبدًا، اضغطي زر الفحص الحين.",
    "اففف لا تطولي على هالمشكلة، الأفضل تفحصيها بسرعة.",
    "يووه واضح فيه شي يحتاج تشيك فوري، لا تسحبي عليه.",
    "بننت! وقفي شوي وافحصي السيارة، سلامتك أهم.",
    " حبيبتي فيه مشكلة واضحة، اضغطي الفحص وخلينا نشوف التفاصيل.",
  ],
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function getHomeMessage(level) {
  if (level === "critical") return randomFrom(HOME_MESSAGES.critical);
  if (level === "warning") return randomFrom(HOME_MESSAGES.warning);
  return randomFrom(HOME_MESSAGES.normal);
}

function now() {
  return Date.now();
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeLevel(level) {
  if (!level) return "info";
  if (["normal", "info", "warning", "critical"].includes(level)) return level;
  return "info";
}

function levelRank(level) {
  return LEVEL_SCORE[normalizeLevel(level)] ?? 0;
}

function pickWorseLevel(a, b) {
  return levelRank(a) >= levelRank(b) ? a : b;
}

function humanLevel(level) {
  if (level === "critical") return "خطر";
  if (level === "warning") return "تنبيه";
  if (level === "info") return "معلومة";
  return "طبيعي";
}

function findRangeLevel(value, ranges = []) {
  if (!isNumber(value)) return "info";

  for (const range of ranges) {
    if (value >= range.min && value <= range.max) {
      return normalizeLevel(range.level);
    }
  }

  return "info";
}

function getMessageByLevel(knowledge, level) {
  if (level === "critical") return knowledge.criticalMessage || knowledge.warningMessage || knowledge.goodMessage;
  if (level === "warning") return knowledge.warningMessage || knowledge.goodMessage;
  if (level === "normal") return knowledge.goodMessage;
  return knowledge.goodMessage || knowledge.userMeaning;
}

function formatValue(value, unit) {
  if (value === null || value === undefined || value === "") return "غير متوفر";
  if (unit) return `${value} ${unit}`;
  return String(value);
}

function createPidAlert(pid, pidData, vehicle) {
  const knowledge = getPidKnowledge(pid, pidData?.name, vehicle?.identity);
  const value = pidData?.value;
  const unit = pidData?.unit ?? knowledge.unit ?? null;

  const hasRanges = Array.isArray(knowledge.ranges) && knowledge.ranges.length > 0;
  const level = hasRanges ? findRangeLevel(value, knowledge.ranges) : "info";

  if (level === "normal") return null;
  if (knowledge.userHidden && level === "info") return null;

  return {
    type: "pid",
    level,
    levelText: humanLevel(level),
    code: pid,
    title: knowledge.title,
    simpleName: knowledge.simpleName,
    category: knowledge.category || "عام",
    value,
    unit,
    displayValue: formatValue(value, unit),
    message: getMessageByLevel(knowledge, level),
    userMeaning: knowledge.userMeaning,
    whyItMatters: knowledge.whyItMatters || null,
    possibleCauses: knowledge.possibleCauses || [],
    tips: knowledge.simpleTips || [],
    raw: pidData,
    timestamp: now(),
  };
}

function extractDtcCodes(dtcFull) {
  const codes = [];

  if (!dtcFull || typeof dtcFull !== "object") return codes;

  const groups = ["stored", "pending", "permanent"];

  for (const group of groups) {
    const list = dtcFull?.[group]?.dtcs;

    if (Array.isArray(list)) {
      for (const code of list) {
        if (code) codes.push(String(code).toUpperCase());
      }
    }
  }

  return Array.from(new Set(codes));
}

function createDtcAlerts(dtcFull) {
  const codes = extractDtcCodes(dtcFull);
  const explained = explainDtcList(codes);

  return explained.map((item) => ({
    type: "dtc",
    level: normalizeLevel(item.severity),
    levelText: humanLevel(item.severity),
    code: item.code,
    title: item.title,
    simpleName: item.simpleName,
    category: item.system,
    message: item.userMeaning,
    userMeaning: item.userMeaning,
    systemMeaning: item.systemMeaning,
    possibleCauses: item.possibleCauses || [],
    tips: item.simpleTips || [],
    timestamp: now(),
  }));
}

function createSrsAlerts(srsFull) {
  const explained = explainSrsSummary(srsFull);

  return explained.map((item) => ({
    type: "srs",
    level: normalizeLevel(item.severity),
    levelText: humanLevel(item.severity),
    code: item.type,
    title: item.title,
    simpleName: item.simpleName,
    category: "السلامة",
    message: item.userMeaning,
    userMeaning: item.userMeaning,
    possibleCauses: [],
    tips: item.simpleTips || [],
    raw: item.raw,
    timestamp: now(),
  }));
}

function getPid(vehicle, pid) {
  return vehicle?.pids?.[pid]?.value;
}

function createSmartContextAlerts(vehicle) {
  const alerts = [];

  const rpm = getPid(vehicle, "010C");
  const speed = getPid(vehicle, "010D");
  const coolant = getPid(vehicle, "0105");
  const voltage = getPid(vehicle, "0142");
  const intakeTemp = getPid(vehicle, "010F");
  const stft = getPid(vehicle, "0106");
  const ltft = getPid(vehicle, "0107");
  const maf = getPid(vehicle, "0110");
  const throttle = getPid(vehicle, "0111");

  if (isNumber(coolant) && coolant >= 100 && isNumber(speed) && speed === 0) {
    alerts.push({
      type: "smart",
      level: coolant >= 110 ? "critical" : "warning",
      levelText: coolant >= 110 ? "خطر" : "تنبيه",
      code: "SMART_COOLANT_IDLE",
      title: "حرارة السيارة وهي واقفة",
      simpleName: "المكينة تسخن والسيارة مو ماشية",
      category: "التبريد",
      value: coolant,
      unit: "°C",
      displayValue: `${coolant} °C`,
      message:
        coolant >= 110
          ? "حرارة المكينة عالية والسيارة واقفة. وقفي بمكان آمن وخليها تبرد."
          : "حرارة المكينة مرتفعة شوي والسيارة واقفة. راقبيها خصوصًا في الزحمة.",
      userMeaning:
        "لما السيارة تكون واقفة والحرارة ترتفع، ممكن يكون السبب مروحة تبريد، نقص ماء، أو ضغط حرارة.",
      possibleCauses: ["مروحة التبريد", "نقص ماء الرديتر", "رديتر", "ثرموستات"],
      tips: [
        "راقبي مؤشر الحرارة.",
        "لا تفتحي غطاء الرديتر والسيارة حارة.",
        "إذا زادت الحرارة، وقفي بأمان.",
      ],
      timestamp: now(),
    });
  }

  if (isNumber(voltage) && voltage < 12.2 && isNumber(rpm) && rpm > 500) {
    alerts.push({
      type: "smart",
      level: voltage < 11.8 ? "critical" : "warning",
      levelText: voltage < 11.8 ? "خطر" : "تنبيه",
      code: "SMART_LOW_VOLTAGE_RUNNING",
      title: "كهرباء السيارة منخفضة وهي شغالة",
      simpleName: "البطارية أو الدينمو يحتاجون فحص",
      category: "الكهرباء",
      value: voltage,
      unit: "V",
      displayValue: `${voltage} V`,
      message:
        "فولت السيارة منخفض وهي شغالة. هذا ممكن يدل على بطارية ضعيفة أو دينمو ما يشحن كويس.",
      userMeaning:
        "السيارة وهي شغالة المفروض الكهرباء تكون مستقرة. لو نزلت كثير ممكن السيارة تتعب في التشغيل أو تطلع لمبات غريبة.",
      possibleCauses: ["بطارية ضعيفة", "دينمو", "سلك أرضي", "منظم شحن"],
      tips: ["افحصي البطارية.", "افحصي شحن الدينمو.", "لا تتجاهلين لمبات الكهرباء."],
      timestamp: now(),
    });
  }

  if (isNumber(ltft) && Math.abs(ltft) > 15) {
    alerts.push({
      type: "smart",
      level: Math.abs(ltft) > 22 ? "critical" : "warning",
      levelText: Math.abs(ltft) > 22 ? "خطر" : "تنبيه",
      code: "SMART_FUEL_TRIM_LONG",
      title: "خلط البنزين والهواء مو مضبوط من فترة",
      simpleName: "السيارة تحاول تعوض مشكلة مستمرة",
      category: "البنزين والهواء",
      value: ltft,
      unit: "%",
      displayValue: `${ltft} %`,
      message:
        "السيارة من فترة تحاول تعدل خلط البنزين والهواء. هذا ممكن يسبب صرفية أو رجفة أو ضعف.",
      userMeaning:
        "هذا مو رقم تحتاجين تحفظينه. معناه إن السيارة تحاول تصلح شيء مو مضبوط في البنزين أو الهواء.",
      possibleCauses:
        ltft > 0
          ? ["تهريب هواء", "حساس MAF", "ضعف ضغط البنزين", "بخاخات"]
          : ["بنزين زائد", "بخاخ يرش زيادة", "حساس أكسجين", "فلتر هواء مكتوم"],
      tips: [
        "لا تغيّرين قطع مباشرة.",
        "افحصي تهريب الهواء وحساس الهواء.",
        "راقبي الصرفية والرجفة.",
      ],
      timestamp: now(),
    });
  }

  if (isNumber(stft) && isNumber(ltft) && Math.abs(stft) > 12 && Math.abs(ltft) > 12) {
    alerts.push({
      type: "smart",
      level: "warning",
      levelText: "تنبيه",
      code: "SMART_FUEL_TRIM_BOTH",
      title: "تعديل البنزين اللحظي والطويل واضح",
      simpleName: "السيارة تحاول تصلح الخلط الآن ومن فترة",
      category: "البنزين والهواء",
      message:
        "فيه مؤشر إن خلط البنزين والهواء يحتاج فحص، لأن التعديل اللحظي والطويل الاثنين خارجين عن الطبيعي.",
      userMeaning:
        "هذا يعني المشكلة غالبًا مو لحظة عابرة، ممكن تكون موجودة من فترة.",
      possibleCauses: ["تهريب هواء", "حساس هواء", "حساس أكسجين", "ضغط بنزين"],
      tips: ["افحصيها قبل ما تزيد الصرفية أو تظهر رجفة."],
      timestamp: now(),
    });
  }

  if (isNumber(intakeTemp) && intakeTemp >= 66 && isNumber(speed) && speed === 0) {
    alerts.push({
      type: "smart",
      level: intakeTemp >= 86 ? "critical" : "warning",
      levelText: intakeTemp >= 86 ? "خطر" : "تنبيه",
      code: "SMART_HOT_INTAKE_IDLE",
      title: "الهواء الداخل للمكينة حار",
      simpleName: "السيارة تتنفس هواء حار",
      category: "الهواء",
      value: intakeTemp,
      unit: "°C",
      displayValue: `${intakeTemp} °C`,
      message:
        "حرارة الهواء الداخل عالية، وهذا ممكن يقلل أداء السيارة خصوصًا مع الزحمة والحر.",
      userMeaning:
        "المكينة مثل الإنسان، إذا الهواء اللي يدخلها حار جدًا، أداءها يصير أضعف.",
      possibleCauses: ["حرارة الجو", "زحمة", "فلتر هواء", "مكان حساس الهواء"],
      tips: ["راقبيها مع حرارة المحرك.", "لو السيارة مكتومة، افحصي فلتر الهواء."],
      timestamp: now(),
    });
  }

  if (
    isNumber(speed) &&
    speed === 0 &&
    isNumber(rpm) &&
    rpm > 1200 &&
    (!isNumber(throttle) || throttle < 25)
  ) {
    alerts.push({
      type: "smart",
      level: "warning",
      levelText: "تنبيه",
      code: "SMART_HIGH_IDLE_RPM",
      title: "دورات المحرك عالية والسيارة واقفة",
      simpleName: "المكينة تلف بسرعة وهي واقفة",
      category: "المكينة",
      value: rpm,
      unit: "rpm",
      displayValue: `${rpm} rpm`,
      message:
        "السيارة واقفة لكن دوران المكينة أعلى من المتوقع. إذا استمر، يحتاج فحص.",
      userMeaning:
        "السيارة وهي واقفة المفروض تكون هادية. لو RPM عالي بدون دعس، فيه شيء يحتاج متابعة.",
      possibleCauses: ["ثروتل متسخ", "تهريب هواء", "حساس", "مكيف أو حمل كهربائي"],
      tips: ["راقبي هل الرقم ينزل بعد دقيقة.", "لو يتكرر، افحصي الثروتل والهواء."],
      timestamp: now(),
    });
  }

  if (isNumber(maf) && isNumber(rpm) && rpm > 600 && maf <= 0) {
    alerts.push({
      type: "smart",
      level: "warning",
      levelText: "تنبيه",
      code: "SMART_MAF_ZERO_RUNNING",
      title: "قراءة الهواء غير منطقية",
      simpleName: "المكينة شغالة لكن قراءة الهواء شبه صفر",
      category: "الهواء",
      value: maf,
      unit: "g/s",
      displayValue: `${maf} g/s`,
      message:
        "المكينة شغالة لكن قراءة تدفق الهواء غير منطقية. ممكن حساس الهواء أو القراءة نفسها فيها مشكلة.",
      userMeaning:
        "السيارة لازم تتنفس هواء وهي شغالة. لو القراءة صفر أو قريبة من الصفر، نحتاج نتحقق.",
      possibleCauses: ["حساس MAF", "سلك", "قراءة غير مدعومة", "مشكلة parsing"],
      tips: ["قارنيها مع RPM.", "افحصي حساس الهواء لو فيه ضعف أو صرفية."],
      timestamp: now(),
    });
  }

  return alerts;
}

function removeDuplicateAlerts(alerts) {
  const seen = new Set();
  const result = [];

  for (const alert of alerts) {
    const key = `${alert.type}:${alert.code}:${alert.level}`;

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(alert);
  }

  return result;
}

function sortAlerts(alerts) {
  return [...alerts].sort((a, b) => levelRank(b.level) - levelRank(a.level));
}

function calculateHealth(alerts, vehicle) {
  let level = "normal";

  for (const alert of alerts) {
    level = pickWorseLevel(level, alert.level);
  }

  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;
  const infoCount = alerts.filter((a) => a.level === "info").length;

  let score = 100;
  score -= criticalCount * 25;
  score -= warningCount * 10;
  score -= infoCount * 1;

  if (score < 0) score = 0;

  let title = "تنبّه على سيارتك";
  let message = getHomeMessage("normal");

  if (level === "critical") {
    title = "تنبّه على سيارتك";
    message = getHomeMessage("critical");
  } else if (level === "warning") {
    title = "تنبّه على سيارتك";
    message = getHomeMessage("warning");
  } else {
    title = "تنبّه على سيارتك";
    message = getHomeMessage("normal");
  }

  return {
    level,
    levelText: humanLevel(level),
    score,
    title,
    message,
    criticalCount,
    warningCount,
    infoCount,
    alertCount: alerts.length,
    obdConnected: !!vehicle?.status?.obdConnected,
    streaming: !!vehicle?.status?.streaming,
    updatedAt: now(),
  };
}

function buildSummary(health, alerts, vehicle) {
  const importantAlerts = alerts.filter((a) =>
    ["critical", "warning"].includes(a.level)
  );

  const topAlerts = importantAlerts.slice(0, 3);

  if (importantAlerts.length === 0) {
    const message = getHomeMessage("normal");

    return {
      title: "تنبّه على سيارتك",
      short: message,
      spoken: message,
      topThings: [],
      recommendedAction: "كملي عادي، وإذا حسيتي بشي غريب اضغطي زر الفحص.",
      actionRequired: false,
      actionText: null,
    };
  }

  const critical = importantAlerts.filter((a) => a.level === "critical");
  const warning = importantAlerts.filter((a) => a.level === "warning");

  const message =
    critical.length > 0 ? getHomeMessage("critical") : getHomeMessage("warning");

  return {
    title: "تنبّه على سيارتك",
    short: message,
    spoken: message,
    topThings: topAlerts.map((a) => ({
      level: a.level,
      title: a.title,
      simpleName: a.simpleName,
      message: a.message,
      displayValue: a.displayValue || null,
    })),
    recommendedAction:
      critical.length > 0
        ? "اضغطي زر الفحص وافحصي السيارة بأسرع وقت."
        : warning.length > 0
        ? "اضغطي زر الفحص وخلينا نتأكد."
        : "كملي عادي.",
    actionRequired: true,
    actionText: "اضغطي زر الفحص وافحصي",
  };
}

function analyzeVehicle(vehicle = {}) {
  const alerts = [];

  const pids = vehicle.pids || {};

  for (const [pid, pidData] of Object.entries(pids)) {
    if (!pidData || typeof pidData !== "object") continue;
    if (!("value" in pidData)) continue;
    if (pidData.value === null || pidData.value === undefined) continue;

    const alert = createPidAlert(pid, pidData, vehicle);

    if (alert) alerts.push(alert);
  }

  alerts.push(...createDtcAlerts(vehicle.dtcFull));
  alerts.push(...createSrsAlerts(vehicle.srsFull));
  alerts.push(...createSmartContextAlerts(vehicle));

  const cleanAlerts = sortAlerts(removeDuplicateAlerts(alerts));
  const health = calculateHealth(cleanAlerts, vehicle);
  const summary = buildSummary(health, cleanAlerts, vehicle);

  return {
    health,
    alerts: cleanAlerts,
    summary,
    meta: {
      userId: vehicle.userId || null,
      carId: vehicle.carId || null,
      identity: vehicle.identity || null,
      analyzedAt: now(),
      pidsCount: Object.keys(pids).length,
      dtcCount: extractDtcCodes(vehicle.dtcFull).length,
      srsAvailable: !!vehicle.srsFull,
    },
  };
}

module.exports = {
  analyzeVehicle,
};