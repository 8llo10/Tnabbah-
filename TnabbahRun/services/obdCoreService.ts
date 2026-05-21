import { elmBluetoothService } from "./elmBluetoothService";

type ObdValue = {
  pid: string;
  name: string;
  value: number | string | null;
  unit: string | null;
  raw: string;
  supported: boolean;
  timestamp: number;
};

type ObdCommandResult = {
  command: string;
  raw: string;
  success: boolean;
  timestamp: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    .map((line) => line.trim().replace(/\s+/g, ""))
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
  return command.trim().toUpperCase();
}

async function safeSend(command: string, waitMs = 1200): Promise<string> {
  try {
    const raw = await elmBluetoothService.send(command, waitMs);
    return cleanRaw(raw);
  } catch (error: any) {
    return `ERROR: ${error?.message || "unknown error"}`;
  }
}

function isBadResponse(raw: string) {
  const upper = raw.toUpperCase();

  return (
    !raw ||
    upper.includes("NO DATA") ||
    upper.includes("ERROR") ||
    upper.includes("UNABLE TO CONNECT") ||
    upper.includes("STOPPED") ||
    upper.includes("?")
  );
}

function parsePid(raw: string, pid: string): ObdValue {
  const command = normalizeCommand(pid);
  const frames = extractHexFrames(raw);
  const timestamp = Date.now();

  const base = {
    pid: command,
    raw,
    supported: !isBadResponse(raw),
    timestamp,
  };

  const frame = frames.find((f) => f.startsWith(`41${command.slice(2)}`));

  if (!frame) {
    return {
      ...base,
      name: command,
      value: null,
      unit: null,
    };
  }

  const bytes = hexToBytes(frame);

  if (command === "0104") {
    return {
      ...base,
      name: "engine_load",
      value: Number(((bytes[2] * 100) / 255).toFixed(1)),
      unit: "%",
    };
  }

  if (command === "0105") {
    return {
      ...base,
      name: "coolant_temperature",
      value: bytes[2] - 40,
      unit: "°C",
    };
  }

  if (command === "010B") {
    return {
      ...base,
      name: "intake_manifold_pressure",
      value: bytes[2],
      unit: "kPa",
    };
  }

  if (command === "010C") {
    return {
      ...base,
      name: "engine_rpm",
      value: Math.round(((bytes[2] * 256 + bytes[3]) / 4)),
      unit: "rpm",
    };
  }

  if (command === "010D") {
    return {
      ...base,
      name: "vehicle_speed",
      value: bytes[2],
      unit: "km/h",
    };
  }

  if (command === "010F") {
    return {
      ...base,
      name: "intake_air_temperature",
      value: bytes[2] - 40,
      unit: "°C",
    };
  }

  if (command === "0111") {
    return {
      ...base,
      name: "throttle_position",
      value: Number(((bytes[2] * 100) / 255).toFixed(1)),
      unit: "%",
    };
  }

  if (command === "0142") {
    return {
      ...base,
      name: "control_module_voltage",
      value: Number(((bytes[2] * 256 + bytes[3]) / 1000).toFixed(2)),
      unit: "V",
    };
  }

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

  if (!frame || frame.length < 12) {
    return [];
  }

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
  const frames = extractHexFrames(raw);
  const bytes: number[] = [];

  for (const frame of frames) {
    if (!frame.startsWith("4902")) continue;

    const frameBytes = hexToBytes(frame);

    // غالبًا أول 3 أو 4 bytes headers داخل response
    // نأخذ الأحرف القابلة للطباعة فقط
    for (const b of frameBytes) {
      if (b >= 32 && b <= 126) bytes.push(b);
    }
  }

  const vin = String.fromCharCode(...bytes)
    .replace(/[^A-HJ-NPR-Z0-9]/g, "")
    .trim();

  return vin.length >= 11 ? vin : null;
}

function parseDtcRaw(raw: string) {
  const frames = extractHexFrames(raw);

  const dtcs: string[] = [];

  for (const frame of frames) {
    const bytes = hexToBytes(frame);

    if (bytes.length < 3) continue;

    const responseMode = bytes[0];

    if (![0x43, 0x47, 0x4a].includes(responseMode)) continue;

    for (let i = 1; i + 1 < bytes.length; i += 2) {
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

export const obdCoreService = {
  async readCommand(command: string, waitMs = 1200): Promise<ObdCommandResult> {
    const normalized = normalizeCommand(command);
    const raw = await safeSend(normalized, waitMs);

    return {
      command: normalized,
      raw,
      success: !isBadResponse(raw),
      timestamp: Date.now(),
    };
  },

  async getSupportedPids() {
    const supportCommands = ["0100", "0120", "0140", "0160", "0180", "01A0", "01C0"];

    const blocks: Record<string, string> = {};
    const supported = new Set<string>();

    for (const command of supportCommands) {
      const raw = await safeSend(command, 1800);
      blocks[command] = raw;

      const list = parseSupportedPidBlock(raw, command);
      list.forEach((pid) => supported.add(pid));

      await sleep(120);
    }

    return {
      supportedPids: Array.from(supported).sort(),
      rawBlocks: blocks,
      timestamp: Date.now(),
    };
  },

  async readLiveImportantPids() {
    const pids = ["0104", "0105", "010B", "010C", "010D", "010F", "0111", "0142"];

    const values: Record<string, ObdValue> = {};

    for (const pid of pids) {
      const raw = await safeSend(pid, 1000);
      values[pid] = parsePid(raw, pid);
      await sleep(80);
    }

    return {
      values,
      timestamp: Date.now(),
    };
  },

  async readAllSupportedPidValues() {
    const support = await this.getSupportedPids();
    const values: Record<string, ObdValue> = {};

    for (const pid of support.supportedPids) {
      const raw = await safeSend(pid, 1000);
      values[pid] = parsePid(raw, pid);
      await sleep(80);
    }

    return {
  supported: support,
  values,
  timestamp: Date.now(),
};
  },

  async readGenericDtcs() {
    const commands = {
      stored: "03",
      pending: "07",
      permanent: "0A",
    };

    const result: Record<string, { raw: string; dtcs: string[] }> = {};

    for (const [type, command] of Object.entries(commands)) {
      const raw = await safeSend(command, 2500);

      result[type] = {
        raw,
        dtcs: parseDtcRaw(raw),
      };

      await sleep(150);
    }

    return {
      ...result,
      timestamp: Date.now(),
    };
  },

  async readMode09() {
    const commands = ["0900", "0901", "0902", "0904", "0906", "090A"];
    const raw: Record<string, string> = {};

    for (const command of commands) {
      raw[command] = await safeSend(command, 2500);
      await sleep(150);
    }

    return {
      raw,
      vin: parseVin(raw["0902"]),
      timestamp: Date.now(),
    };
  },

  async fullSnapshot() {
    const status = await this.readCommand("ATDP", 1500);
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