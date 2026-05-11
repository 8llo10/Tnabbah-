import { Buffer } from "buffer";

export default class ELM327 {
  device = null;
  writeChar = null;
  readChar = null;

  defaultCommandTimeout = 1200; // ms
  writeDelay = 30; // ms

  constructor(device) {
    this.device = device;
  }

  async initCharacteristics() {
    const services = await this.device.services();

    for (const service of services) {
      const chars = await service.characteristics();

      for (const c of chars) {
        if (c.isWritableWithResponse || c.isWritableWithoutResponse) {
          this.writeChar = c;
        }

        if (c.isReadable || c.isNotifiable) {
          this.readChar = c;
        }
      }
    }

    if (!this.writeChar || !this.readChar) {
      throw new Error("لم يتم العثور على خصائص الكتابة/القراءة");
    }
  }

  clean(raw) {
    if (!raw) return "";

    return raw
      .replace("SEARCHING...", "")
      .replace(/\r/g, "")
      .replace(/\n/g, "")
      .replace(/ /g, "")
      .replace(/>/g, "")
      .trim();
  }

  async _read_until_prompt(timeout = this.defaultCommandTimeout) {
    const end = Date.now() + timeout;
    let buffer = "";

    while (Date.now() < end) {
      const res = await this.readChar.read();
      const decoded = Buffer.from(res.value, "base64").toString("utf8");

      if (decoded) {
        buffer += decoded;
        if (buffer.includes(">")) break;
      }

      await new Promise((r) => setTimeout(r, 5));
    }

    return buffer;
  }

  async write(cmd) {
    const payload = Buffer.from(cmd + "\r", "utf8").toString("base64");
    await this.writeChar.writeWithoutResponse(payload);
    await new Promise((r) => setTimeout(r, this.writeDelay));
  }

  async send(cmd, { wait = this.writeDelay, timeout = this.defaultCommandTimeout, retries = 1, returnRaw = false } = {}) {
    let lastRaw = "";
    let lastClean = "";

    for (let attempt = 0; attempt <= retries; attempt++) {
      const raw = await this._sendOnce(cmd, wait, timeout);
      const clean = this.clean(raw);

      lastRaw = raw;
      lastClean = clean;

      if (clean) {
        return returnRaw ? { raw, clean } : clean;
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    return returnRaw ? { raw: lastRaw, clean: lastClean } : lastClean;
  }

  async _sendOnce(cmd, wait, timeout) {
    await this.write(cmd);
    await new Promise((r) => setTimeout(r, wait));
    return await this._read_until_prompt(timeout);
  }

  async send_fast(cmd) {
    return this.send(cmd, { wait: 20, timeout: 700, retries: 0 });
  }

  async send_normal(cmd) {
    return this.send(cmd, { wait: 20, timeout: 900, retries: 0 });
  }

  async send_slow(cmd) {
    return this.send(cmd, { wait: 50, timeout: 2500, retries: 1 });
  }

  async init() {
    const commands = [
      ["ATZ", 1500, 2500],
      ["ATE0", 30, 1000],
      ["ATL0", 30, 1000],
      ["ATS0", 30, 1000],
      ["ATH0", 30, 1000],
      ["ATSP0", 50, 2000],
      ["ATAT2", 30, 1000],
    ];

    const results = {};

    for (const [cmd, wait, timeout] of commands) {
      const res = await this.send(cmd, {
        wait,
        timeout,
        retries: 1,
        returnRaw: true,
      });

      results[cmd] = res;
    }

    return results;
  }
}