""" # بعدين اعدل على الكود بحيث انه يضمن جمييع انواع البدز لكل السيارات اعدل جزء الماب بعدين الي تحتها 
PID_NAMES = {
    0x04: "Calculated engine load",
    0x05: "Engine coolant temperature",
    0x06: "Short term fuel trim - Bank 1",
    0x07: "Long term fuel trim - Bank 1",
    0x08: "Short term fuel trim - Bank 2",
    0x09: "Long term fuel trim - Bank 2",
    0x0A: "Fuel pressure",
    0x0B: "Intake manifold absolute pressure",
    0x0C: "Engine RPM",
    0x0D: "Vehicle speed",
    0x0E: "Timing advance",
    0x0F: "Intake air temperature",
    0x10: "MAF air flow rate",
    0x11: "Throttle position",
    0x1C: "OBD standards",
    0x1F: "Run time since engine start",
    0x21: "Distance with MIL on",
    0x2F: "Fuel tank level input",
    0x31: "Distance since codes cleared",
    0x33: "Absolute barometric pressure",
    0x42: "Control module voltage",
    0x46: "Ambient air temperature",
    0x47: "Absolute throttle position B",
    0x49: "Accelerator pedal position D",
    0x4A: "Accelerator pedal position E",
    0x4C: "Commanded throttle actuator",
    0x5C: "Engine oil temperature",
    0x5E: "Engine fuel rate",
}

def parse_supported_pids(resp, start_pid):
    if not resp.startswith("41"):
        return []

    data = resp[4:]
    if len(data) < 8:
        return []

    hex_bits = data[:8]
    bits = bin(int(hex_bits, 16))[2:].zfill(32)

    supported = []
    for i, bit in enumerate(bits):
        if bit == "1":
            supported.append(start_pid + i + 1)

    return supported

def parse_value(pid, resp):
    try:
        if not resp.startswith("41"):
            return None

        pid_hex = resp[2:4]
        data = resp[4:]

        if int(pid_hex, 16) != pid:
            return None

        if pid == 0x04 and len(data) >= 2:
            A = int(data[0:2], 16)
            return round(A * 100 / 255, 2)

        if pid == 0x05 and len(data) >= 2:
            A = int(data[0:2], 16)
            return A - 40

        if pid in [0x06, 0x07, 0x08, 0x09] and len(data) >= 2:
            A = int(data[0:2], 16)
            return round((A - 128) * 100 / 128, 2)

        if pid == 0x0A and len(data) >= 2:
            A = int(data[0:2], 16)
            return A * 3

        if pid == 0x0B and len(data) >= 2:
            A = int(data[0:2], 16)
            return A

        if pid == 0x0C and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return round(((A * 256) + B) / 4, 2)

        if pid == 0x0D and len(data) >= 2:
            A = int(data[0:2], 16)
            return A

        if pid == 0x0E and len(data) >= 2:
            A = int(data[0:2], 16)
            return round((A / 2) - 64, 2)

        if pid == 0x0F and len(data) >= 2:
            A = int(data[0:2], 16)
            return A - 40

        if pid == 0x10 and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return round(((A * 256) + B) / 100, 2)

        if pid == 0x11 and len(data) >= 2:
            A = int(data[0:2], 16)
            return round(A * 100 / 255, 2)

        if pid == 0x1F and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return (A * 256) + B

        if pid == 0x21 and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return (A * 256) + B

        if pid == 0x2F and len(data) >= 2:
            A = int(data[0:2], 16)
            return round(A * 100 / 255, 2)

        if pid == 0x31 and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return (A * 256) + B

        if pid == 0x33 and len(data) >= 2:
            A = int(data[0:2], 16)
            return A

        if pid == 0x42 and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return round(((A * 256) + B) / 1000, 3)

        if pid == 0x46 and len(data) >= 2:
            A = int(data[0:2], 16)
            return A - 40

        if pid in [0x47, 0x49, 0x4A, 0x4C] and len(data) >= 2:
            A = int(data[0:2], 16)
            return round(A * 100 / 255, 2)

        if pid == 0x5C and len(data) >= 2:
            A = int(data[0:2], 16)
            return A - 40

        if pid == 0x5E and len(data) >= 4:
            A = int(data[0:2], 16)
            B = int(data[2:4], 16)
            return round(((A * 256) + B) / 20, 2)

        return None

    except Exception:
        return None """
        
#////////////////////////////////////////////////////////////////////////////        
""" PID_NAMES = {
    0x04: "Calculated engine load",
    0x05: "Engine coolant temperature",
    0x06: "Short term fuel trim - Bank 1",
    0x07: "Long term fuel trim - Bank 1",
    0x08: "Short term fuel trim - Bank 2",
    0x09: "Long term fuel trim - Bank 2",
    0x0A: "Fuel pressure",
    0x0B: "Intake manifold absolute pressure",
    0x0C: "Engine RPM",
    0x0D: "Vehicle speed",
    0x0E: "Timing advance",
    0x0F: "Intake air temperature",
    0x10: "MAF air flow rate",
    0x11: "Throttle position",
    0x1C: "OBD standards",
    0x1F: "Run time since engine start",
    0x21: "Distance with MIL on",
    0x2F: "Fuel tank level input",
    0x31: "Distance since codes cleared",
    0x33: "Absolute barometric pressure",
    0x42: "Control module voltage",
    0x46: "Ambient air temperature",
    0x47: "Absolute throttle position B",
    0x49: "Accelerator pedal position D",
    0x4A: "Accelerator pedal position E",
    0x4C: "Commanded throttle actuator",
    0x5C: "Engine oil temperature",
    0x5E: "Engine fuel rate",
}


def parse_supported_pids(resp, start_pid):
    if not resp.startswith("41") or len(resp) < 12:
        return []

    data = resp[4:12]

    try:
        bits = f"{int(data, 16):032b}"
    except ValueError:
        return []

    return [
        start_pid + i + 1
        for i, bit in enumerate(bits)
        if bit == "1"
    ]


def _u8(hex2):
    return int(hex2, 16)


def _u16(hex4):
    return int(hex4, 16)


def _percent_from_byte(hex2):
    return round(_u8(hex2) * 100 / 255, 2)


def _temp_from_byte(hex2):
    return _u8(hex2) - 40


def _fuel_trim_from_byte(hex2):
    return round((_u8(hex2) - 128) * 100 / 128, 2)


def _rpm_from_data(data):
    return round(_u16(data[:4]) / 4, 2)


def _speed_from_data(data):
    return _u8(data[:2])


def _timing_advance_from_data(data):
    return round((_u8(data[:2]) / 2) - 64, 2)


def _maf_from_data(data):
    return round(_u16(data[:4]) / 100, 2)


def _u16_plain(data):
    return _u16(data[:4])


def _voltage_from_data(data):
    return round(_u16(data[:4]) / 1000, 3)


def _fuel_rate_from_data(data):
    return round(_u16(data[:4]) / 20, 2)


PARSERS = {
    0x04: lambda d: _percent_from_byte(d[:2]),
    0x05: lambda d: _temp_from_byte(d[:2]),
    0x06: lambda d: _fuel_trim_from_byte(d[:2]),
    0x07: lambda d: _fuel_trim_from_byte(d[:2]),
    0x08: lambda d: _fuel_trim_from_byte(d[:2]),
    0x09: lambda d: _fuel_trim_from_byte(d[:2]),
    0x0A: lambda d: _u8(d[:2]) * 3,
    0x0B: lambda d: _u8(d[:2]),
    0x0C: _rpm_from_data,
    0x0D: _speed_from_data,
    0x0E: _timing_advance_from_data,
    0x0F: lambda d: _temp_from_byte(d[:2]),
    0x10: _maf_from_data,
    0x11: lambda d: _percent_from_byte(d[:2]),
    0x1F: _u16_plain,
    0x21: _u16_plain,
    0x2F: lambda d: _percent_from_byte(d[:2]),
    0x31: _u16_plain,
    0x33: lambda d: _u8(d[:2]),
    0x42: _voltage_from_data,
    0x46: lambda d: _temp_from_byte(d[:2]),
    0x47: lambda d: _percent_from_byte(d[:2]),
    0x49: lambda d: _percent_from_byte(d[:2]),
    0x4A: lambda d: _percent_from_byte(d[:2]),
    0x4C: lambda d: _percent_from_byte(d[:2]),
    0x5C: lambda d: _temp_from_byte(d[:2]),
    0x5E: _fuel_rate_from_data,
}


def parse_value(pid, resp):
    if not resp.startswith("41") or len(resp) < 4:
        return None

    try:
        resp_pid = int(resp[2:4], 16)
    except ValueError:
        return None

    if resp_pid != pid:
        return None

    parser = PARSERS.get(pid)
    if parser is None:
        return None

    data = resp[4:]

    try:
        return parser(data)
    except Exception:
        return None
         """
         
PID_META = {
     0x01: {"name": "Monitor status since DTCs cleared", "unit": None},
    0x02: {"name": "Freeze DTC", "unit": None},
    0x03: {"name": "Fuel system status", "unit": None},
    0x12: {"name": "Commanded secondary air status", "unit": None},
    0x13: {"name": "Oxygen sensors present", "unit": None},
    0x14: {"name": "Oxygen Sensor 1 Voltage", "unit": "V"},
    0x15: {"name": "Oxygen Sensor 2 Voltage", "unit": "V"},
    0x16: {"name": "Oxygen Sensor 3 Voltage", "unit": "V"},
    0x17: {"name": "Oxygen Sensor 4 Voltage", "unit": "V"},
    0x18: {"name": "Oxygen Sensor 5 Voltage", "unit": "V"},
    0x19: {"name": "Oxygen Sensor 6 Voltage", "unit": "V"},
    0x1A: {"name": "Oxygen Sensor 7 Voltage", "unit": "V"},
    0x1B: {"name": "Oxygen Sensor 8 Voltage", "unit": "V"},
    0x22: {"name": "Fuel rail pressure", "unit": "kPa"},
    0x23: {"name": "Fuel rail gauge pressure", "unit": "kPa"},
    0x2C: {"name": "Commanded EGR", "unit": "%"},
    0x2D: {"name": "EGR error", "unit": "%"},
    0x2E: {"name": "Commanded evaporative purge", "unit": "%"},
    0x30: {"name": "Warm-ups since codes cleared", "unit": "count"},
    0x32: {"name": "Evap system vapor pressure", "unit": "Pa"},
    0x34: {"name": "O2 Sensor 1 Air-Fuel Ratio / Current", "unit": None},
    0x35: {"name": "O2 Sensor 2 Air-Fuel Ratio / Current", "unit": None},
    0x36: {"name": "O2 Sensor 3 Air-Fuel Ratio / Current", "unit": None},
    0x37: {"name": "O2 Sensor 4 Air-Fuel Ratio / Current", "unit": None},
    0x38: {"name": "O2 Sensor 5 Air-Fuel Ratio / Current", "unit": None},
    0x39: {"name": "O2 Sensor 6 Air-Fuel Ratio / Current", "unit": None},
    0x3A: {"name": "O2 Sensor 7 Air-Fuel Ratio / Current", "unit": None},
    0x3B: {"name": "O2 Sensor 8 Air-Fuel Ratio / Current", "unit": None},
    0x3C: {"name": "Catalyst temperature Bank 1 Sensor 1", "unit": "°C"},
    0x3D: {"name": "Catalyst temperature Bank 2 Sensor 1", "unit": "°C"},
    0x3E: {"name": "Catalyst temperature Bank 1 Sensor 2", "unit": "°C"},
    0x3F: {"name": "Catalyst temperature Bank 2 Sensor 2", "unit": "°C"},
    0x41: {"name": "Monitor status this drive cycle", "unit": None},
    0x43: {"name": "Absolute load value", "unit": "%"},
    0x44: {"name": "Commanded fuel-air equivalence ratio", "unit": "ratio"},
    0x45: {"name": "Relative throttle position", "unit": "%"},
    0x48: {"name": "Absolute throttle position C", "unit": "%"},
    0x4B: {"name": "Accelerator pedal position F", "unit": "%"},
    0x4D: {"name": "Time run with MIL on", "unit": "min"},
    0x4E: {"name": "Time since trouble codes cleared", "unit": "min"},
    0x51: {"name": "Fuel type", "unit": None},
    0x52: {"name": "Ethanol fuel percentage", "unit": "%"},
    0x59: {"name": "Fuel rail absolute pressure", "unit": "kPa"},
    0x5A: {"name": "Relative accelerator pedal position", "unit": "%"},
    0x5B: {"name": "Hybrid battery pack remaining life", "unit": "%"},
    0x5D: {"name": "Fuel injection timing", "unit": "°"},
    0x61: {"name": "Driver demand engine torque", "unit": "%"},
    0x62: {"name": "Actual engine torque", "unit": "%"},
    0x63: {"name": "Engine reference torque", "unit": "Nm"},
    0x66: {"name": "Mass air flow sensor", "unit": None},
    0x67: {"name": "Engine coolant temperature sensor", "unit": "°C"},
    0x68: {"name": "Intake air temperature sensor", "unit": "°C"},
    0x6A: {"name": "Cylinder fuel rate", "unit": None},
    0x6C: {"name": "Intake manifold absolute pressure sensor", "unit": "kPa"},
    0x73: {"name": "Exhaust pressure", "unit": "kPa"},
    0x74: {"name": "Turbocharger RPM", "unit": "rpm"},
    0x77: {"name": "Charge air cooler temperature", "unit": "°C"},
    0x78: {"name": "Exhaust gas temperature bank 1", "unit": "°C"},
    0x79: {"name": "Exhaust gas temperature bank 2", "unit": "°C"},
    0x7F: {"name": "Engine run time", "unit": "s"},
    
    0x04: {"name": "Calculated engine load", "unit": "%"},
    0x05: {"name": "Engine coolant temperature", "unit": "°C"},
    0x06: {"name": "Short term fuel trim - Bank 1", "unit": "%"},
    0x07: {"name": "Long term fuel trim - Bank 1", "unit": "%"},
    0x08: {"name": "Short term fuel trim - Bank 2", "unit": "%"},
    0x09: {"name": "Long term fuel trim - Bank 2", "unit": "%"},
    0x0A: {"name": "Fuel pressure", "unit": "kPa"},
    0x0B: {"name": "Intake manifold absolute pressure", "unit": "kPa"},
    0x0C: {"name": "Engine RPM", "unit": "rpm"},
    0x0D: {"name": "Vehicle speed", "unit": "km/h"},
    0x0E: {"name": "Timing advance", "unit": "°"},
    0x0F: {"name": "Intake air temperature", "unit": "°C"},
    0x10: {"name": "MAF air flow rate", "unit": "g/s"},
    0x11: {"name": "Throttle position", "unit": "%"},
    0x1C: {"name": "OBD standards", "unit": None},
    0x1F: {"name": "Run time since engine start", "unit": "s"},
    0x21: {"name": "Distance with MIL on", "unit": "km"},
    0x2F: {"name": "Fuel tank level input", "unit": "%"},
    0x31: {"name": "Distance since codes cleared", "unit": "km"},
    0x33: {"name": "Absolute barometric pressure", "unit": "kPa"},
    0x42: {"name": "Control module voltage", "unit": "V"},
    0x46: {"name": "Ambient air temperature", "unit": "°C"},
    0x47: {"name": "Absolute throttle position B", "unit": "%"},
    0x49: {"name": "Accelerator pedal position D", "unit": "%"},
    0x4A: {"name": "Accelerator pedal position E", "unit": "%"},
    0x4C: {"name": "Commanded throttle actuator", "unit": "%"},
    0x5C: {"name": "Engine oil temperature", "unit": "°C"},
    0x5E: {"name": "Engine fuel rate", "unit": "L/h"},

    # تقدرين تزودين هنا كل الـ standard PIDs لاحقًا
    # مثال:
    # 0x01: {"name": "Monitor status since DTCs cleared", "unit": None},
    # 0x02: {"name": "Freeze DTC", "unit": None},
    # 0x03: {"name": "Fuel system status", "unit": None},
}


def get_pid_meta(pid):
    meta = PID_META.get(pid)
    if meta:
        return meta

    return {
        "name": f"PID 0x{pid:02X}",
        "unit": None,
    }


def get_pid_name(pid):
    return get_pid_meta(pid)["name"]


def get_pid_unit(pid):
    return get_pid_meta(pid)["unit"]


def parse_supported_pids(resp, start_pid):
    if not resp.startswith("41") or len(resp) < 12:
        return []

    data = resp[4:12]

    try:
        bits = f"{int(data, 16):032b}"
    except ValueError:
        return []

    return [
        start_pid + i + 1
        for i, bit in enumerate(bits)
        if bit == "1"
    ]


def _u8(hex2):
    return int(hex2, 16)


def _u16(hex4):
    return int(hex4, 16)


def _percent_from_byte(hex2):
    return round(_u8(hex2) * 100 / 255, 2)


def _temp_from_byte(hex2):
    return _u8(hex2) - 40


def _fuel_trim_from_byte(hex2):
    return round((_u8(hex2) - 128) * 100 / 128, 2)


def _rpm_from_data(data):
    return round(_u16(data[:4]) / 4, 2)


def _speed_from_data(data):
    return _u8(data[:2])


def _timing_advance_from_data(data):
    return round((_u8(data[:2]) / 2) - 64, 2)


def _maf_from_data(data):
    return round(_u16(data[:4]) / 100, 2)


def _u16_plain(data):
    return _u16(data[:4])


def _voltage_from_data(data):
    return round(_u16(data[:4]) / 1000, 3)


def _fuel_rate_from_data(data):
    return round(_u16(data[:4]) / 20, 2)


PARSERS = {
     0x22: lambda d: round(_u16(d[:4]) * 0.079, 2),
    0x2C: lambda d: _percent_from_byte(d[:2]),
    0x2D: lambda d: _fuel_trim_from_byte(d[:2]),
    0x2E: lambda d: _percent_from_byte(d[:2]),
    0x30: lambda d: _u8(d[:2]),
    0x33: lambda d: _u8(d[:2]),
    0x3C: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x3D: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x3E: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x3F: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x43: lambda d: round(_u16(d[:4]) * 100 / 255, 2),
    0x44: lambda d: round(_u16(d[:4]) / 32768, 4),
    0x45: lambda d: _percent_from_byte(d[:2]),
    0x48: lambda d: _percent_from_byte(d[:2]),
    0x4B: lambda d: _percent_from_byte(d[:2]),
    0x4D: lambda d: _u16(d[:4]),
    0x4E: lambda d: _u16(d[:4]),
    0x52: lambda d: _percent_from_byte(d[:2]),
    0x59: lambda d: _u16(d[:4]) * 10,
    0x5A: lambda d: _percent_from_byte(d[:2]),
    0x5B: lambda d: _percent_from_byte(d[:2]),
    0x5D: lambda d: round((_u16(d[:4]) / 128) - 210, 2),
    0x61: lambda d: _u8(d[:2]) - 125,
    0x62: lambda d: _u8(d[:2]) - 125,
    0x63: lambda d: _u16(d[:4]),
    0x67: lambda d: _temp_from_byte(d[:2]),
    0x68: lambda d: _temp_from_byte(d[:2]),
    0x73: lambda d: _u16(d[:4]) / 10,
    0x74: lambda d: _u16(d[:4]) * 4,
    0x77: lambda d: _temp_from_byte(d[:2]),
    0x78: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x79: lambda d: round((_u16(d[:4]) / 10) - 40, 2),
    0x7F: lambda d: _u16_plain(d),
    
    0x04: lambda d: _percent_from_byte(d[:2]),
    0x05: lambda d: _temp_from_byte(d[:2]),
    0x06: lambda d: _fuel_trim_from_byte(d[:2]),
    0x07: lambda d: _fuel_trim_from_byte(d[:2]),
    0x08: lambda d: _fuel_trim_from_byte(d[:2]),
    0x09: lambda d: _fuel_trim_from_byte(d[:2]),
    0x0A: lambda d: _u8(d[:2]) * 3,
    0x0B: lambda d: _u8(d[:2]),
    0x0C: _rpm_from_data,
    0x0D: _speed_from_data,
    0x0E: _timing_advance_from_data,
    0x0F: lambda d: _temp_from_byte(d[:2]),
    0x10: _maf_from_data,
    0x11: lambda d: _percent_from_byte(d[:2]),
    0x1F: _u16_plain,
    0x21: _u16_plain,
    0x2F: lambda d: _percent_from_byte(d[:2]),
    0x31: _u16_plain,
    0x42: _voltage_from_data,
    0x46: lambda d: _temp_from_byte(d[:2]),
    0x47: lambda d: _percent_from_byte(d[:2]),
    0x49: lambda d: _percent_from_byte(d[:2]),
    0x4A: lambda d: _percent_from_byte(d[:2]),
    0x4C: lambda d: _percent_from_byte(d[:2]),
    0x5C: lambda d: _temp_from_byte(d[:2]),
    0x5E: _fuel_rate_from_data,    
}


def parse_value(pid, resp):
    if not resp.startswith("41") or len(resp) < 4:
        return None

    try:
        resp_pid = int(resp[2:4], 16)
    except ValueError:
        return None

    if resp_pid != pid:
        return None

    parser = PARSERS.get(pid)
    if parser is None:
        return None

    data = resp[4:]

    try:
        return parser(data)
    except Exception:
        return None


def parse_pid_response(pid, resp):
    """
    ترجع نتيجة كاملة جاهزة للنشر في MQTT أو الاستخدام داخل scanner.
    """
    meta = get_pid_meta(pid)

    return {
        "pid": pid,
        "pid_hex": f"0x{pid:02X}",
        "name": meta["name"],
        "unit": meta["unit"],
        "raw": resp,
        "value": parse_value(pid, resp),
    }