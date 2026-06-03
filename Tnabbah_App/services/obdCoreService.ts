import { elmBluetoothService } from "./elmBluetoothService";

export type ObdValue = {
  pid: string;
  name: string;
  value: number | string | boolean | null;
  unit: string | null;
  raw: string;
  supported: boolean;
  timestamp: number;
};

export type ObdCommandResult = {
  command: string;
  raw: string;
  success: boolean;
  timestamp: number;
};

type ReadAllOptions = {
  supportedPids?: string[];
  onValue?: (pid: string, value: ObdValue) => Promise<void> | void;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const IMPORTANT_LIVE_PIDS = [
  // الأساسي في اللايف
  "010C", // RPM
  "010D", // Speed
  "0142", // Battery / Control Module Voltage
  "0105", // Coolant Temperature

  // حرارة وضغط
  "015C", // Engine Oil Temperature
  "010A", // Fuel Pressure
  "010B", // Intake Manifold Pressure

  // بيانات مفيدة سريعة
  "0104", // Engine Load
  "010F", // Intake Air Temperature
  "0110", // MAF Air Flow Rate
  "0111", // Throttle Position
  "012F", // Fuel Tank Level
  "0131", // Distance Since DTC Clear
  "0146", // Ambient Air Temperature
  "015E", // Engine Fuel Rate
  "0162", // Driver Demand Torque

  // إضافات من القائمة الثانية
  "011F", // Engine Run Time
  "0147", // Absolute Throttle Position B
  "0149", // Accelerator Pedal Position D
  "014A", // Accelerator Pedal Position E
  "014C", // Commanded Throttle Actuator
  "0151", // Fuel Type\

 /*  // Optional / إذا السيارة تدعمها فقط
  "015B", // optional extra value
  "0167", // optional extra value
  "017C", // optional extra value */
];

const SUPPORT_COMMANDS = ["0100", "0120", "0140", "0160", "0180", "01A0", "01C0"];

const MODE_09_COMMANDS = [
  "0900", "0901", "0902", "0903", "0904", "0905",
  "0906", "0907", "0908", "0909", "090A",
];

function cleanRaw(raw: string) {
  return String(raw || "")
    .replace(/\r/g, "\n")
    .replace(/>/g, "")
    .replace(/\n\n+/g, "\n")
    .trim();
}

function extractHexFrames(raw: string) {
  return cleanRaw(raw)
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^[0-9A-Fa-f]+:/, "")
        .replace(/\s+/g, "")
    )
    .filter((line) => line.length > 0)
    .filter((line) => /^[0-9A-Fa-f]+$/.test(line));
}

function hexToBytes(hex: string) {
  const clean = hex.replace(/\s+/g, "");
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i += 2) {
    const part = clean.slice(i, i + 2);
    if (part.length === 2) {
      const value = parseInt(part, 16);
      if (!Number.isNaN(value)) bytes.push(value);
    }
  }

  return bytes;
}

function normalizeCommand(command: string) {
  return command.trim().replace(/\s+/g, "").toUpperCase();
}

async function safeSend(command: string, waitMs = 900): Promise<string> {
  try {
    const raw = await elmBluetoothService.send(command, waitMs);
    return cleanRaw(raw);
  } catch (error: any) {
    return `ERROR: ${error?.message || "unknown error"}`;
  }
}

function isBadResponse(raw: string) {
  const upper = String(raw || "").toUpperCase();

  return (
    !raw ||
    upper.includes("NO DATA") ||
    upper.includes("ERROR") ||
    upper.includes("UNABLE TO CONNECT") ||
    upper.includes("SEARCHING") ||
    upper.includes("STOPPED") ||
    upper.includes("?")
  );
}

function getPidFrame(raw: string, pid: string) {
  const command = normalizeCommand(pid);
  const responsePrefix = `41${command.slice(2)}`;
  const frames = extractHexFrames(raw);

  return frames.find((f) => f.startsWith(responsePrefix)) || null;
}

function baseValue(pid: string, raw: string): Omit<ObdValue, "name" | "value" | "unit"> {
  return {
    pid: normalizeCommand(pid),
    raw,
    supported: !isBadResponse(raw),
    timestamp: Date.now(),
  };
}

function parsePid(raw: string, pid: string): ObdValue {
  const command = normalizeCommand(pid);
  const base = baseValue(command, raw);
  const frame = getPidFrame(raw, command);

  if (!frame) {
    return {
      ...base,
      name: command,
      value: null,
      unit: null,
    };
  }

  const bytes = hexToBytes(frame);
  const A = bytes[2] ?? 0;
  const B = bytes[3] ?? 0;

  const percent = (x: number) => Number(((x * 100) / 255).toFixed(1));
  const signedTemp = (x: number) => x - 40;
  const fuelTrim = (x: number) => Number((((x - 128) * 100) / 128).toFixed(1));

  const map: Record<string, () => ObdValue> = {
    "0104": () => ({ ...base, name: "calculated_engine_load", value: percent(A), unit: "%" }),
    "0105": () => ({ ...base, name: "coolant_temperature", value: signedTemp(A), unit: "°C" }),
    "0106": () => ({ ...base, name: "short_term_fuel_trim_bank_1", value: fuelTrim(A), unit: "%" }),
    "0107": () => ({ ...base, name: "long_term_fuel_trim_bank_1", value: fuelTrim(A), unit: "%" }),
    "0108": () => ({ ...base, name: "short_term_fuel_trim_bank_2", value: fuelTrim(A), unit: "%" }),
    "0109": () => ({ ...base, name: "long_term_fuel_trim_bank_2", value: fuelTrim(A), unit: "%" }),
    "010A": () => ({ ...base, name: "fuel_pressure", value: A * 3, unit: "kPa" }),
    "010B": () => ({ ...base, name: "intake_manifold_pressure", value: A, unit: "kPa" }),
    "010C": () => ({ ...base, name: "engine_rpm", value: Math.round((A * 256 + B) / 4), unit: "rpm" }),
    "010D": () => ({ ...base, name: "vehicle_speed", value: A, unit: "km/h" }),
    "010E": () => ({ ...base, name: "timing_advance", value: Number((A / 2 - 64).toFixed(1)), unit: "°" }),
    "010F": () => ({ ...base, name: "intake_air_temperature", value: signedTemp(A), unit: "°C" }),
    "0110": () => ({ ...base, name: "maf_air_flow_rate", value: Number(((A * 256 + B) / 100).toFixed(2)), unit: "g/s" }),
    "0111": () => ({ ...base, name: "throttle_position", value: percent(A), unit: "%" }),
    "011F": () => ({ ...base, name: "run_time_since_engine_start", value: A * 256 + B, unit: "s" }),
    "0121": () => ({ ...base, name: "distance_with_mil_on", value: A * 256 + B, unit: "km" }),
    "012C": () => ({ ...base, name: "commanded_egr", value: percent(A), unit: "%" }),
    "012D": () => ({ ...base, name: "egr_error", value: fuelTrim(A), unit: "%" }),
    "012E": () => ({ ...base, name: "commanded_evaporative_purge", value: percent(A), unit: "%" }),
    "012F": () => ({ ...base, name: "fuel_tank_level", value: percent(A), unit: "%" }),
    "0130": () => ({ ...base, name: "warmups_since_codes_cleared", value: A, unit: "count" }),
    "0131": () => ({ ...base, name: "distance_since_codes_cleared", value: A * 256 + B, unit: "km" }),
    "0133": () => ({ ...base, name: "barometric_pressure", value: A, unit: "kPa" }),
    "0142": () => ({ ...base, name: "control_module_voltage", value: Number(((A * 256 + B) / 1000).toFixed(2)), unit: "V" }),
    "0143": () => ({ ...base, name: "absolute_load_value", value: Number((((A * 256 + B) * 100) / 255).toFixed(1)), unit: "%" }),
    "0144": () => ({ ...base, name: "commanded_equivalence_ratio", value: Number(((A * 256 + B) / 32768).toFixed(3)), unit: null }),
    "0145": () => ({ ...base, name: "relative_throttle_position", value: percent(A), unit: "%" }),
    "0146": () => ({ ...base, name: "ambient_air_temperature", value: signedTemp(A), unit: "°C" }),
    "0147": () => ({ ...base, name: "absolute_throttle_position_b", value: percent(A), unit: "%" }),
    "0148": () => ({ ...base, name: "absolute_throttle_position_c", value: percent(A), unit: "%" }),
    "0149": () => ({ ...base, name: "accelerator_pedal_position_d", value: percent(A), unit: "%" }),
    "014A": () => ({ ...base, name: "accelerator_pedal_position_e", value: percent(A), unit: "%" }),
    "014B": () => ({ ...base, name: "accelerator_pedal_position_f", value: percent(A), unit: "%" }),
    "014C": () => ({ ...base, name: "commanded_throttle_actuator", value: percent(A), unit: "%" }),
    "0151": () => ({ ...base, name: "fuel_type", value: A, unit: null }),
    "015C": () => ({ ...base, name: "engine_oil_temperature", value: signedTemp(A), unit: "°C" }),
    "015E": () => ({ ...base, name: "engine_fuel_rate", value: Number(((A * 256 + B) / 20).toFixed(2)), unit: "L/h" }),
    "0162": () => ({ ...base, name: "actual_engine_torque", value: A - 125, unit: "%" }),
  /*   "015B": () => ({ ...base, name: "optional_pressure_015B", value: A, unit: "kPa" }),
    "0167": () => ({ ...base, name: "optional_pressure_0167", value: A, unit: "kPa" }),
    "017C": () => ({ ...base, name: "optional_pressure_017C", value: A, unit: "kPa" }), */
  };

  if (map[command]) return map[command]();

  return {
    ...base,
    name: command,
    value: frame,
    unit: null,
  };
}

function parseSupportedPidBlock(raw: string, command: string) {
  const frames = extractHexFrames(raw);
  const normalized = normalizeCommand(command);
  const modePid = normalized.slice(2);
  const responsePrefix = `41${modePid}`;
  const frame = frames.find((f) => f.startsWith(responsePrefix));

  if (!frame || frame.length < 12) return [];

  const bytes = hexToBytes(frame);
  const supportBytes = bytes.slice(2, 6);
  const basePidDecimal = parseInt(modePid, 16);
  const supported: string[] = [];

  for (let byteIndex = 0; byteIndex < supportBytes.length; byteIndex++) {
    const byte = supportBytes[byteIndex];

    for (let bit = 0; bit < 8; bit++) {
      const isSupported = (byte & (1 << (7 - bit))) !== 0;

      if (isSupported) {
        const pidNumber = basePidDecimal + byteIndex * 8 + bit + 1;
        const pidHex = pidNumber.toString(16).toUpperCase().padStart(2, "0");
        supported.push(`01${pidHex}`);
      }
    }
  }

  return supported;
}

function parseVin(raw: string) {
  const text = cleanRaw(raw).replace(/\s+/g, "").toUpperCase();

  const vinChars: number[] = [];
  const frames = extractHexFrames(raw);

  for (const frame of frames) {
    const idx = frame.indexOf("4902");
    if (idx === -1) continue;

    const useful = frame.slice(idx + 4);
    const bytes = hexToBytes(useful);

    for (const b of bytes) {
      if (b >= 32 && b <= 126) vinChars.push(b);
    }
  }

  let vin = String.fromCharCode(...vinChars)
    .replace(/[^A-HJ-NPR-Z0-9]/g, "")
    .trim();

  if (vin.length > 17) vin = vin.slice(-17);

  return vin.length >= 11 ? vin : null;
}

function parseDtcRaw(raw: string) {
  const frames = extractHexFrames(raw);
  const dtcs: string[] = [];

  for (const frame of frames) {
    const bytes = hexToBytes(frame);
    if (bytes.length < 2) continue;

    let startIndex = -1;

    const responseIndex = bytes.findIndex((b) =>
      [0x43, 0x47, 0x4a].includes(b)
    );

    if (responseIndex === -1) continue;

    startIndex = responseIndex + 1;

    for (let i = startIndex; i + 1 < bytes.length; i += 2) {
      const a = bytes[i];
      const b = bytes[i + 1];

      if (a === 0 && b === 0) continue;

      const firstTwoBits = (a & 0xc0) >> 6;
      const system = ["P", "C", "B", "U"][firstTwoBits];

      const digit1 = ((a & 0x30) >> 4).toString(16).toUpperCase();
      const digit2 = (a & 0x0f).toString(16).toUpperCase();
      const digit3 = ((b & 0xf0) >> 4).toString(16).toUpperCase();
      const digit4 = (b & 0x0f).toString(16).toUpperCase();

      dtcs.push(`${system}${digit1}${digit2}${digit3}${digit4}`);
    }
  }

  return Array.from(new Set(dtcs));
}

function parseMode09Text(raw: string, servicePid: string) {
  const frames = extractHexFrames(raw);
  const chars: number[] = [];

  for (const frame of frames) {
    const idx = frame.indexOf(servicePid);
    if (idx === -1) continue;

    const useful = frame.slice(idx + servicePid.length);
    const bytes = hexToBytes(useful);

    for (const b of bytes) {
      if (b >= 32 && b <= 126) chars.push(b);
    }
  }

  return String.fromCharCode(...chars)
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

export const obdCoreService = {
  async readCommand(command: string, waitMs = 900): Promise<ObdCommandResult> {
    const normalized = normalizeCommand(command);
    const raw = await safeSend(normalized, waitMs);

    return {
      command: normalized,
      raw,
      success: !isBadResponse(raw),
      timestamp: Date.now(),
    };
  },

  parsePid,
  isBadResponse,
  cleanRaw,
  parseDtcRaw,
  parseSupportedPidBlock,
  normalizeCommand,

  async getSupportedPids(options?: {
    onBlock?: (command: string, raw: string, supported: string[]) => Promise<void> | void;
  }) {
    const blocks: Record<string, string> = {};
    const supported = new Set<string>();

    for (const command of SUPPORT_COMMANDS) {
      const raw = await safeSend(command, 1200);
      blocks[command] = raw;

      const list = parseSupportedPidBlock(raw, command);
      list.forEach((pid) => supported.add(pid));

      if (options?.onBlock) {
        await options.onBlock(command, raw, list);
      }

      await sleep(60);
    }

    return {
      supportedPids: Array.from(supported).sort(),
      rawBlocks: blocks,
      timestamp: Date.now(),
    };
  },

  async readLiveImportantPids(options?: ReadAllOptions) {
    const values: Record<string, ObdValue> = {};

    for (const pid of IMPORTANT_LIVE_PIDS) {
      const raw = await safeSend(pid, 650);
      const parsed = parsePid(raw, pid);

      values[pid] = parsed;

      if (options?.onValue) {
        await options.onValue(pid, parsed);
      }

      await sleep(25);
    }

    return {
      values,
      timestamp: Date.now(),
    };
  },

  async readAllSupportedPidValues(options?: ReadAllOptions) {
    const support = options?.supportedPids?.length
      ? {
        supportedPids: options.supportedPids,
        rawBlocks: {},
        timestamp: Date.now(),
      }
      : await this.getSupportedPids();

    const values: Record<string, ObdValue> = {};

    for (const pid of support.supportedPids) {
      const raw = await safeSend(pid, 750);
      const parsed = parsePid(raw, pid);

      values[pid] = parsed;

      if (options?.onValue) {
        await options.onValue(pid, parsed);
      }

      await sleep(35);
    }

    return {
      supported: support,
      values,
      timestamp: Date.now(),
    };
  },

  async readGenericDtcs(options?: {
    onResult?: (
      type: "stored" | "pending" | "permanent",
      result: { raw: string; dtcs: string[] }
    ) => Promise<void> | void;
  }) {
    const commands = {
      stored: "03",
      pending: "07",
      permanent: "0A",
    } as const;

    const result: Record<string, { raw: string; dtcs: string[] }> = {};

    for (const [type, command] of Object.entries(commands)) {
      const raw = await safeSend(command, 3500);
      const parsedDtcs = parseDtcRaw(raw);

      console.log("DTC RAW:", {
        type,
        command,
        raw,
        parsedDtcs,
      });

      result[type] = {
        raw,
        dtcs: parsedDtcs,
      };

      if (options?.onResult) {
        await options.onResult(type as "stored" | "pending" | "permanent", result[type]);
      }

      await sleep(100);
    }

    return {
      ...result,
      timestamp: Date.now(),
    };
  },

  async readMode09(options?: {
    onResult?: (command: string, raw: string) => Promise<void> | void;
  }) {
    const raw: Record<string, string> = {};

    for (const command of MODE_09_COMMANDS) {
      raw[command] = await safeSend(command, 1800);

      if (options?.onResult) {
        await options.onResult(command, raw[command]);
      }

      await sleep(100);
    }

    return {
      raw,
      vin: parseVin(raw["0902"]),
      calibrationId: parseMode09Text(raw["0904"], "4904"),
      cvn: parseMode09Text(raw["0906"], "4906"),
      ecuName: parseMode09Text(raw["090A"], "490A"),
      timestamp: Date.now(),
    };
  },

  async fullSnapshot() {
    const status = await this.readCommand("ATDP", 1200);
    const mode09 = await this.readMode09();
    const dtcs = await this.readGenericDtcs();
    const important = await this.readLiveImportantPids();
    const supported = await this.getSupportedPids();

    return {
      status,
      mode09,
      dtcs,
      important,
      supported,
      timestamp: Date.now(),
    };
  },
};