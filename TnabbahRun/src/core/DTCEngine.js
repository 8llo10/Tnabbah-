const DTC_TYPES = ["P", "C", "B", "U"];

function decodeDTC(byte1, byte2) {
  if (!(byte1 | byte2)) return null;

  const type = DTC_TYPES[byte1 >> 6];
  const digit1 = (byte1 >> 4) & 0x3;
  const digit2 = (byte1 & 0xF).toString(16).toUpperCase();
  const digit3 = (byte2 >> 4).toString(16).toUpperCase();
  const digit4 = (byte2 & 0xF).toString(16).toUpperCase();

  return `${type}${digit1}${digit2}${digit3}${digit4}`;
}

function parseDTCResponse(resp, expectedPrefix) {
  if (!resp || !resp.startsWith(expectedPrefix)) return [];

  const data = resp.slice(2);
  if (data.length < 4) return [];

  let bytes;
  try {
    bytes = Buffer.from(data, "hex");
  } catch {
    return [];
  }

  const dtcs = [];

  for (let i = 0; i < bytes.length; i += 2) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1] ?? 0;

    if (!(b1 | b2)) break;

    const code = decodeDTC(b1, b2);
    if (code) dtcs.push(code);
  }

  return dtcs;
}

export default class DTCEngine {
  constructor(elm) {
    this.elm = elm;
  }

  async readMode(cmd, prefix, mode, type) {
    const resp = await this.elm.send_slow(cmd);

    return {
      mode,
      type,
      raw: resp,
      dtcs: parseDTCResponse(resp, prefix),
    };
  }

  async readStored() {
    return this.readMode("03", "43", "03", "stored");
  }

  async readPending() {
    return this.readMode("07", "47", "07", "pending");
  }

  async readPermanent() {
    return this.readMode("0A", "4A", "0A", "permanent");
  }

  async readFreezeFrame() {
    return this.readMode("02", "42", "02", "freeze_frame");
  }

  async readMILStatus() {
    const resp = await this.elm.send_normal("0101");
    return {
      mode: "01",
      type: "mil_status",
      raw: resp,
      dtcs: [],
    };
  }

  async readAll() {
    return {
      stored: await this.readStored(),
      pending: await this.readPending(),
      permanent: await this.readPermanent(),
      freezeFrame: await this.readFreezeFrame(),
      milStatus: await this.readMILStatus(),
    };
  }

  async *streamGrouped() {
    yield await this.readStored();
    yield await this.readPending();
    yield await this.readPermanent();
  }

  async *streamIndividual() {
    for (const group of [await this.readStored(), await this.readPending(), await this.readPermanent()]) {
      for (const code of group.dtcs) {
        yield {
          mode: group.mode,
          type: group.type,
          code,
          raw: group.raw,
        };
      }
    }
  }
}