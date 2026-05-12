export const PID_META = {
  0x01: { name: "Monitor status since DTCs cleared", unit: null },
  0x02: { name: "Freeze DTC", unit: null },
  0x03: { name: "Fuel system status", unit: null },
  0x12: { name: "Commanded secondary air status", unit: null },
  0x13: { name: "Oxygen sensors present", unit: null },

  0x14: { name: "Oxygen Sensor 1 Voltage", unit: "V" },
  0x15: { name: "Oxygen Sensor 2 Voltage", unit: "V" },
  0x16: { name: "Oxygen Sensor 3 Voltage", unit: "V" },
  0x17: { name: "Oxygen Sensor 4 Voltage", unit: "V" },
  0x18: { name: "Oxygen Sensor 5 Voltage", unit: "V" },
  0x19: { name: "Oxygen Sensor 6 Voltage", unit: "V" },
  0x1A: { name: "Oxygen Sensor 7 Voltage", unit: "V" },
  0x1B: { name: "Oxygen Sensor 8 Voltage", unit: "V" },

  0x22: { name: "Fuel rail pressure", unit: "kPa" },
  0x23: { name: "Fuel rail gauge pressure", unit: "kPa" },

  0x2C: { name: "Commanded EGR", unit: "%" },
  0x2D: { name: "EGR error", unit: "%" },
  0x2E: { name: "Commanded evaporative purge", unit: "%" },

  0x30: { name: "Warm-ups since codes cleared", unit: "count" },
  0x32: { name: "Evap system vapor pressure", unit: "Pa" },

  0x34: { name: "O2 Sensor 1 AFR/Current", unit: null },
  0x35: { name: "O2 Sensor 2 AFR/Current", unit: null },
  0x36: { name: "O2 Sensor 3 AFR/Current", unit: null },
  0x37: { name: "O2 Sensor 4 AFR/Current", unit: null },
  0x38: { name: "O2 Sensor 5 AFR/Current", unit: null },
  0x39: { name: "O2 Sensor 6 AFR/Current", unit: null },
  0x3A: { name: "O2 Sensor 7 AFR/Current", unit: null },
  0x3B: { name: "O2 Sensor 8 AFR/Current", unit: null },

  0x3C: { name: "Catalyst temp B1S1", unit: "°C" },
  0x3D: { name: "Catalyst temp B2S1", unit: "°C" },
  0x3E: { name: "Catalyst temp B1S2", unit: "°C" },
  0x3F: { name: "Catalyst temp B2S2", unit: "°C" },

  0x41: { name: "Monitor status this drive cycle", unit: null },

  0x43: { name: "Absolute load value", unit: "%" },
  0x44: { name: "Commanded fuel-air equivalence ratio", unit: "ratio" },
  0x45: { name: "Relative throttle position", unit: "%" },

  0x48: { name: "Absolute throttle position C", unit: "%" },
  0x4B: { name: "Accelerator pedal position F", unit: "%" },

  0x4D: { name: "Time run with MIL on", unit: "min" },
  0x4E: { name: "Time since codes cleared", unit: "min" },

  0x51: { name: "Fuel type", unit: null },
  0x52: { name: "Ethanol fuel percentage", unit: "%" },

  0x59: { name: "Fuel rail absolute pressure", unit: "kPa" },
  0x5A: { name: "Relative accelerator pedal position", unit: "%" },
  0x5B: { name: "Hybrid battery pack remaining life", unit: "%" },

  0x5D: { name: "Fuel injection timing", unit: "°" },

  0x61: { name: "Driver demand engine torque", unit: "%" },
  0x62: { name: "Actual engine torque", unit: "%" },
  0x63: { name: "Engine reference torque", unit: "Nm" },

  0x66: { name: "Mass air flow sensor", unit: null },
  0x67: { name: "Engine coolant temperature sensor", unit: "°C" },
  0x68: { name: "Intake air temperature sensor", unit: "°C" },

  0x6A: { name: "Cylinder fuel rate", unit: null },
  0x6C: { name: "Intake manifold absolute pressure sensor", unit: "kPa" },

  0x73: { name: "Exhaust pressure", unit: "kPa" },
  0x74: { name: "Turbocharger RPM", unit: "rpm" },

  0x77: { name: "Charge air cooler temperature", unit: "°C" },
  0x78: { name: "Exhaust gas temperature bank 1", unit: "°C" },
  0x79: { name: "Exhaust gas temperature bank 2", unit: "°C" },

  0x7F: { name: "Engine run time", unit: "s" },

  // Standard PIDs
  0x04: { name: "Calculated engine load", unit: "%" },
  0x05: { name: "Engine coolant temperature", unit: "°C" },
  0x06: { name: "Short term fuel trim - Bank 1", unit: "%" },
  0x07: { name: "Long term fuel trim - Bank 1", unit: "%" },
  0x08: { name: "Short term fuel trim - Bank 2", unit: "%" },
  0x09: { name: "Long term fuel trim - Bank 2", unit: "%" },

  0x0A: { name: "Fuel pressure", unit: "kPa" },
  0x0B: { name: "Intake manifold absolute pressure", unit: "kPa" },
  0x0C: { name: "Engine RPM", unit: "rpm" },
  0x0D: { name: "Vehicle speed", unit: "km/h" },
  0x0E: { name: "Timing advance", unit: "°" },
  0x0F: { name: "Intake air temperature", unit: "°C" },
  0x10: { name: "MAF air flow rate", unit: "g/s" },
  0x11: { name: "Throttle position", unit: "%" },

  0x1C: { name: "OBD standards", unit: null },
  0x1F: { name: "Run time since engine start", unit: "s" },

  0x21: { name: "Distance with MIL on", unit: "km" },
  0x2F: { name: "Fuel tank level input", unit: "%" },

  0x31: { name: "Distance since codes cleared", unit: "km" },
  0x33: { name: "Absolute barometric pressure", unit: "kPa" },

  0x42: { name: "Control module voltage", unit: "V" },
  0x46: { name: "Ambient air temperature", unit: "°C" },

  0x47: { name: "Absolute throttle position B", unit: "%" },
  0x49: { name: "Accelerator pedal position D", unit: "%" },
  0x4A: { name: "Accelerator pedal position E", unit: "%" },
  0x4C: { name: "Commanded throttle actuator", unit: "%" },

  0x5C: { name: "Engine oil temperature", unit: "°C" },
  0x5E: { name: "Engine fuel rate", unit: "L/h" },
};

export function getPIDMeta(pid) {
  return PID_META[pid] || { name: `PID 0x${pid.toString(16).toUpperCase()}`, unit: null };
}