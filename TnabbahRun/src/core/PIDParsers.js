export const PID_PARSERS = {
  0x04: (d) => (parseInt(d.slice(0, 2), 16) * 100) / 255,
  0x05: (d) => parseInt(d.slice(0, 2), 16) - 40,
  0x06: (d) => ((parseInt(d.slice(0, 2), 16) - 128) * 100) / 128,
  0x07: (d) => ((parseInt(d.slice(0, 2), 16) - 128) * 100) / 128,
  0x08: (d) => ((parseInt(d.slice(0, 2), 16) - 128) * 100) / 128,
  0x09: (d) => ((parseInt(d.slice(0, 2), 16) - 128) * 100) / 128,

  0x0A: (d) => parseInt(d.slice(0, 2), 16) * 3,
  0x0B: (d) => parseInt(d.slice(0, 2), 16),

  0x0C: (d) => (parseInt(d.slice(0, 4), 16) / 4),
  0x0D: (d) => parseInt(d.slice(0, 2), 16),
  0x0E: (d) => (parseInt(d.slice(0, 2), 16) / 2) - 64,
  0x0F: (d) => parseInt(d.slice(0, 2), 16) - 40,

  0x10: (d) => parseInt(d.slice(0, 4), 16) / 100,

  0x1F: (d) => parseInt(d.slice(0, 4), 16),
  0x21: (d) => parseInt(d.slice(0, 4), 16),
  0x31: (d) => parseInt(d.slice(0, 4), 16),

  0x42: (d) => parseInt(d.slice(0, 4), 16) / 1000,

  0x5C: (d) => parseInt(d.slice(0, 2), 16) - 40,
  0x5E: (d) => parseInt(d.slice(0, 4), 16) / 20,
};