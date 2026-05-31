function normalizePid(pid) {
  return String(pid || "").trim().replace(/\s+/g, "").toUpperCase();
}

function cleanHex(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[^0-9A-Fa-f]/g, "")
    .toUpperCase();
}

function hexToBytes(hex) {
  const clean = cleanHex(hex);
  const bytes = [];

  for (let i = 0; i < clean.length; i += 2) {
    const part = clean.slice(i, i + 2);
    if (part.length === 2) {
      const value = parseInt(part, 16);
      if (!Number.isNaN(value)) bytes.push(value);
    }
  }

  return bytes;
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function percent(byte) {
  return Number(((byte * 100) / 255).toFixed(1));
}

function fuelTrim(byte) {
  return Number((((byte - 128) * 100) / 128).toFixed(1));
}

function signedTemp(byte) {
  return byte - 40;
}

function getDataBytes(pid, rawOrValue) {
  const normalizedPid = normalizePid(pid);
  const raw = cleanHex(rawOrValue);

  if (!raw) return [];

  const expectedPrefix = `41${normalizedPid.slice(2)}`;

  let frame = raw;

  const prefixIndex = raw.indexOf(expectedPrefix);
  if (prefixIndex >= 0) {
    frame = raw.slice(prefixIndex);
  }

  const bytes = hexToBytes(frame);

  if (bytes.length >= 2 && bytes[0] === 0x41) {
    return bytes.slice(2);
  }

  return bytes;
}

function createDecoded({
  pid,
  name,
  title,
  value,
  unit = null,
  kind = "numeric",
  category = "عام",
  confidence = "high",
  raw,
}) {
  return {
    pid: normalizePid(pid),
    name,
    title,
    value,
    unit,
    kind,
    category,
    confidence,
    raw,
    decodedBy: "cortex_decoder",
  };
}

function decodeBitfield(pid, raw, name, title, category = "تقني") {
  return createDecoded({
    pid,
    name,
    title,
    value: cleanHex(raw),
    unit: null,
    kind: "bitfield",
    category,
    confidence: "medium",
    raw,
  });
}

function decodePid(pid, pidData = {}) {
  const normalizedPid = normalizePid(pid || pidData.pid);
  const originalValue = pidData.value;
  const raw = pidData.raw || originalValue;

  if (!normalizedPid) return pidData;

  if (
    isNumber(originalValue) &&
    pidData.name &&
    !String(pidData.name).startsWith("01")
  ) {
    return {
      ...pidData,
      decodedBy: pidData.decodedBy || "app",
      confidence: pidData.confidence || "high",
      kind: pidData.kind || "numeric",
    };
  }

  const data = getDataBytes(normalizedPid, raw);
  const A = data[0] ?? 0;
  const B = data[1] ?? 0;
  const C = data[2] ?? 0;
  const D = data[3] ?? 0;

  const map = {
    "0101": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "monitor_status_since_dtcs_cleared",
        "حالة لمبة المكينة واختبارات السيارة",
        "الأعطال"
      ),

    "0103": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "fuel_system_status",
        "حالة نظام البنزين",
        "البنزين"
      ),

    "0104": () =>
      createDecoded({
        pid: normalizedPid,
        name: "calculated_engine_load",
        title: "جهد المحرك",
        value: percent(A),
        unit: "%",
        category: "المكينة",
        raw,
      }),

    "0105": () =>
      createDecoded({
        pid: normalizedPid,
        name: "coolant_temperature",
        title: "حرارة المحرك",
        value: signedTemp(A),
        unit: "°C",
        category: "التبريد",
        raw,
      }),

    "0106": () =>
      createDecoded({
        pid: normalizedPid,
        name: "short_term_fuel_trim_bank_1",
        title: "تعديل البنزين اللحظي",
        value: fuelTrim(A),
        unit: "%",
        category: "البنزين والهواء",
        raw,
      }),

    "0107": () =>
      createDecoded({
        pid: normalizedPid,
        name: "long_term_fuel_trim_bank_1",
        title: "تعديل البنزين طويل المدى",
        value: fuelTrim(A),
        unit: "%",
        category: "البنزين والهواء",
        raw,
      }),

    "0108": () =>
      createDecoded({
        pid: normalizedPid,
        name: "short_term_fuel_trim_bank_2",
        title: "تعديل البنزين اللحظي للبنك الثاني",
        value: fuelTrim(A),
        unit: "%",
        category: "البنزين والهواء",
        raw,
      }),

    "0109": () =>
      createDecoded({
        pid: normalizedPid,
        name: "long_term_fuel_trim_bank_2",
        title: "تعديل البنزين طويل المدى للبنك الثاني",
        value: fuelTrim(A),
        unit: "%",
        category: "البنزين والهواء",
        raw,
      }),

    "010A": () =>
      createDecoded({
        pid: normalizedPid,
        name: "fuel_pressure",
        title: "ضغط البنزين",
        value: A * 3,
        unit: "kPa",
        category: "البنزين",
        raw,
      }),

    "010B": () =>
      createDecoded({
        pid: normalizedPid,
        name: "intake_manifold_pressure",
        title: "ضغط الهواء داخل المكينة",
        value: A,
        unit: "kPa",
        category: "الهواء",
        raw,
      }),

    "010C": () =>
      createDecoded({
        pid: normalizedPid,
        name: "engine_rpm",
        title: "دورات المحرك",
        value: Math.round((A * 256 + B) / 4),
        unit: "rpm",
        category: "المكينة",
        raw,
      }),

    "010D": () =>
      createDecoded({
        pid: normalizedPid,
        name: "vehicle_speed",
        title: "سرعة السيارة",
        value: A,
        unit: "km/h",
        category: "القيادة",
        raw,
      }),

    "010E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "timing_advance",
        title: "توقيت الشرارة",
        value: Number((A / 2 - 64).toFixed(1)),
        unit: "°",
        category: "المكينة",
        raw,
      }),

    "010F": () =>
      createDecoded({
        pid: normalizedPid,
        name: "intake_air_temperature",
        title: "حرارة الهواء الداخل",
        value: signedTemp(A),
        unit: "°C",
        category: "الهواء",
        raw,
      }),

    "0110": () =>
      createDecoded({
        pid: normalizedPid,
        name: "maf_air_flow_rate",
        title: "تدفق الهواء",
        value: Number(((A * 256 + B) / 100).toFixed(2)),
        unit: "g/s",
        category: "الهواء",
        raw,
      }),

    "0111": () =>
      createDecoded({
        pid: normalizedPid,
        name: "throttle_position",
        title: "فتحة الدعسة",
        value: percent(A),
        unit: "%",
        category: "الدعسة والهواء",
        raw,
      }),

    "0113": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "oxygen_sensors_present",
        "حساسات الأكسجين الموجودة",
        "العادم"
      ),

    "0115": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "oxygen_sensor_2",
        "قراءة حساس الأكسجين",
        "العادم"
      ),

    "011C": () =>
      createDecoded({
        pid: normalizedPid,
        name: "obd_standard",
        title: "نوع معيار OBD",
        value: A,
        unit: null,
        kind: "info",
        category: "معلومات السيارة",
        raw,
      }),

    "011F": () =>
      createDecoded({
        pid: normalizedPid,
        name: "run_time_since_engine_start",
        title: "مدة تشغيل السيارة",
        value: A * 256 + B,
        unit: "s",
        category: "معلومات عامة",
        raw,
      }),

    "0120": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "supported_pids_21_40",
        "قائمة قراءات مدعومة",
        "تقني"
      ),

    "0121": () =>
      createDecoded({
        pid: normalizedPid,
        name: "distance_with_mil_on",
        title: "المسافة ولمبة المكينة شغالة",
        value: A * 256 + B,
        unit: "km",
        category: "الأعطال",
        raw,
      }),

    "0124": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "oxygen_sensor_1_equivalence_ratio",
        "قراءة حساس الأكسجين ونسبة الخليط",
        "العادم"
      ),

    "012E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "commanded_evaporative_purge",
        title: "أمر نظام تبخير البنزين",
        value: percent(A),
        unit: "%",
        category: "البنزين",
        raw,
      }),

    "012F": () =>
      createDecoded({
        pid: normalizedPid,
        name: "fuel_tank_level",
        title: "مستوى البنزين",
        value: percent(A),
        unit: "%",
        category: "البنزين",
        raw,
      }),

    "0130": () =>
      createDecoded({
        pid: normalizedPid,
        name: "warmups_since_codes_cleared",
        title: "عدد مرات التشغيل بعد مسح الأعطال",
        value: A,
        unit: "count",
        category: "الأعطال",
        raw,
      }),

    "0131": () =>
      createDecoded({
        pid: normalizedPid,
        name: "distance_since_codes_cleared",
        title: "المسافة بعد مسح الأعطال",
        value: A * 256 + B,
        unit: "km",
        category: "الأعطال",
        raw,
      }),

    "0133": () =>
      createDecoded({
        pid: normalizedPid,
        name: "barometric_pressure",
        title: "ضغط الجو",
        value: A,
        unit: "kPa",
        category: "الهواء",
        raw,
      }),

    "0134": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "oxygen_sensor_1_current",
        "قراءة حساس الأكسجين",
        "العادم"
      ),

    "013C": () =>
      createDecoded({
        pid: normalizedPid,
        name: "catalyst_temperature_bank_1_sensor_1",
        title: "حرارة دبة التلوث",
        value: Number(((A * 256 + B) / 10 - 40).toFixed(1)),
        unit: "°C",
        category: "العادم",
        raw,
      }),

    "013E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "catalyst_temperature_bank_1_sensor_2",
        title: "حرارة دبة التلوث الخلفية",
        value: Number(((A * 256 + B) / 10 - 40).toFixed(1)),
        unit: "°C",
        category: "العادم",
        raw,
      }),

    "0140": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "supported_pids_41_60",
        "قائمة قراءات مدعومة",
        "تقني"
      ),

    "0142": () =>
      createDecoded({
        pid: normalizedPid,
        name: "control_module_voltage",
        title: "فولت الكهرباء",
        value: Number(((A * 256 + B) / 1000).toFixed(2)),
        unit: "V",
        category: "الكهرباء",
        raw,
      }),

    "0143": () =>
      createDecoded({
        pid: normalizedPid,
        name: "absolute_load_value",
        title: "حمل المحرك المطلق",
        value: Number((((A * 256 + B) * 100) / 255).toFixed(1)),
        unit: "%",
        category: "المكينة",
        raw,
      }),

    "0144": () =>
      createDecoded({
        pid: normalizedPid,
        name: "commanded_equivalence_ratio",
        title: "نسبة خلط البنزين والهواء المطلوبة",
        value: Number(((A * 256 + B) / 32768).toFixed(3)),
        unit: null,
        category: "البنزين والهواء",
        raw,
      }),

    "0145": () =>
      createDecoded({
        pid: normalizedPid,
        name: "relative_throttle_position",
        title: "فتحة الثروتل النسبية",
        value: percent(A),
        unit: "%",
        category: "الدعسة والهواء",
        raw,
      }),

    "0146": () =>
      createDecoded({
        pid: normalizedPid,
        name: "ambient_air_temperature",
        title: "حرارة الجو الخارجي",
        value: signedTemp(A),
        unit: "°C",
        category: "الجو",
        raw,
      }),

    "0147": () =>
      createDecoded({
        pid: normalizedPid,
        name: "absolute_throttle_position_b",
        title: "فتحة هواء إضافية",
        value: percent(A),
        unit: "%",
        category: "الدعسة والهواء",
        raw,
      }),

    "0149": () =>
      createDecoded({
        pid: normalizedPid,
        name: "accelerator_pedal_position_d",
        title: "موضع دعسة البنزين",
        value: percent(A),
        unit: "%",
        category: "الدعسة",
        raw,
      }),

    "014A": () =>
      createDecoded({
        pid: normalizedPid,
        name: "accelerator_pedal_position_e",
        title: "موضع دعسة البنزين الثاني",
        value: percent(A),
        unit: "%",
        category: "الدعسة",
        raw,
      }),

    "014C": () =>
      createDecoded({
        pid: normalizedPid,
        name: "commanded_throttle_actuator",
        title: "أمر فتح الثروتل",
        value: percent(A),
        unit: "%",
        category: "الدعسة والهواء",
        raw,
      }),

    "014D": () =>
      createDecoded({
        pid: normalizedPid,
        name: "time_run_with_mil_on",
        title: "مدة التشغيل ولمبة المكينة شغالة",
        value: A * 256 + B,
        unit: "min",
        category: "الأعطال",
        raw,
      }),

    "014E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "time_since_trouble_codes_cleared",
        title: "الوقت بعد مسح الأعطال",
        value: A * 256 + B,
        unit: "min",
        category: "الأعطال",
        raw,
      }),

    "0151": () =>
      createDecoded({
        pid: normalizedPid,
        name: "fuel_type",
        title: "نوع الوقود",
        value: A,
        unit: null,
        kind: "info",
        category: "البنزين",
        raw,
      }),

    "015C": () =>
      createDecoded({
        pid: normalizedPid,
        name: "engine_oil_temperature",
        title: "حرارة زيت المكينة",
        value: signedTemp(A),
        unit: "°C",
        category: "المكينة",
        raw,
      }),

    "015E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "engine_fuel_rate",
        title: "استهلاك الوقود اللحظي",
        value: Number(((A * 256 + B) / 20).toFixed(2)),
        unit: "L/h",
        category: "البنزين",
        raw,
      }),

    "0160": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "supported_pids_61_80",
        "قائمة قراءات مدعومة",
        "تقني"
      ),

    "0162": () =>
      createDecoded({
        pid: normalizedPid,
        name: "actual_engine_torque",
        title: "عزم المحرك الفعلي",
        value: A - 125,
        unit: "%",
        category: "المكينة",
        raw,
      }),

    "0180": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "supported_pids_81_A0",
        "قائمة قراءات مدعومة",
        "تقني"
      ),

    "018E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "engine_friction_percent_torque",
        title: "احتكاك المحرك كنسبة عزم",
        value: A - 125,
        unit: "%",
        category: "المكينة",
        raw,
      }),

    "019D": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "fuel_system_percentage_use",
        "نسب استخدام أنظمة الوقود",
        "البنزين"
      ),

    "019E": () =>
      createDecoded({
        pid: normalizedPid,
        name: "engine_exhaust_flow_rate",
        title: "تدفق العادم",
        value: Number(((A * 256 + B) / 20).toFixed(2)),
        unit: "kg/h",
        category: "العادم",
        raw,
      }),

    "01A0": () =>
      decodeBitfield(
        normalizedPid,
        raw,
        "supported_pids_A1_C0",
        "قائمة قراءات مدعومة",
        "تقني"
      ),
  };

  if (map[normalizedPid]) {
    return {
      ...pidData,
      ...map[normalizedPid](),
      originalValue,
    };
  }

  return {
    ...pidData,
    pid: normalizedPid,
    name: pidData.name || normalizedPid,
    title: "قراءة خاصة من السيارة",
    value: originalValue,
    unit: pidData.unit ?? null,
    kind: "unknown",
    category: "خاص بالشركة",
    confidence: "low",
    decodedBy: "cortex_decoder",
    userHidden: true,
  };
}

module.exports = {
  decodePid,
  normalizePid,
  cleanHex,
  hexToBytes,
};