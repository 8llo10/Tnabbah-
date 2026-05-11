import { PID_META, getPIDMeta } from "./PIDMeta";
import { PID_PARSERS } from "./PIDParsers";

export default class LiveDataEngine {
  constructor(elm, supportedPIDs) {
    this.elm = elm;
    this.supported = supportedPIDs;
  }

  async readPID(pid) {
    const hex = pid.toString(16).padStart(2, "0").toUpperCase();
    const cmd = "01" + hex;

    const resp = await this.elm.send_fast(cmd);
    if (!resp || !resp.startsWith("41")) return null;

    const data = resp.slice(4);

    const parser = PID_PARSERS[pid];
    const value = parser ? parser(data) : data;

    return {
      pid,
      pid_hex: "0x" + hex,
      name: getPIDMeta(pid).name,
      unit: getPIDMeta(pid).unit,
      raw: resp,
      value,
    };
  }

  async readAll() {
    const result = {};

    for (const pid of this.supported) {
      try {
        result[pid] = await this.readPID(pid);
      } catch {
        result[pid] = null;
      }
    }

    return result;
  }
}