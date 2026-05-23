export default class PIDDiscoveryEngine {
  constructor(elm) {
    this.elm = elm;
  }

  async discover() {
    const ranges = [
      { cmd: "0100", start: 0x01 },
      { cmd: "0120", start: 0x21 },
      { cmd: "0140", start: 0x41 },
      { cmd: "0160", start: 0x61 },
      { cmd: "0180", start: 0x81 },
      { cmd: "01A0", start: 0xA1 },
      { cmd: "01C0", start: 0xC1 },
    ];

    const supported = [];

    for (const { cmd, start } of ranges) {
      const res = await this.elm.send_normal(cmd);

      if (!res) continue;

      // remove echo
      const clean = res.replace(cmd, "").trim();

      if (clean.length < 8) continue;

      const bits = parseInt(clean, 16);

      for (let i = 0; i < 32; i++) {
        if (bits & (1 << (31 - i))) {
          supported.push(start + i);
        }
      }
    }

    return supported;
  }
}