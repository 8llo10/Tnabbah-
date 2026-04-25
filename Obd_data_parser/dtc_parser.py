""" def decode_dtc_pair(byte1, byte2):
    if byte1 == 0 and byte2 == 0:
        return None

    first_two_bits = (byte1 & 0b11000000) >> 6
    dtc_type_map = {
        0: "P",
        1: "C",
        2: "B",
        3: "U",
    }
    first_char = dtc_type_map[first_two_bits]

    second_digit = (byte1 & 0b00110000) >> 4
    third_digit = byte1 & 0b00001111
    fourth_digit = (byte2 & 0b11110000) >> 4
    fifth_digit = byte2 & 0b00001111

    return f"{first_char}{second_digit}{third_digit:X}{fourth_digit:X}{fifth_digit:X}"


def parse_dtc_response(resp, expected_mode_prefix):
"""

""" 
    //43 = stored
 //   47 = pending
  //  4A = permanent
"""
    
"""
    if not resp.startswith(expected_mode_prefix):
        return []

    data = resp[2:]
    if len(data) < 4:
        return []

    dtcs = []

    for i in range(0, len(data), 4):
        chunk = data[i:i+4]
        if len(chunk) < 4:
            continue

        b1 = int(chunk[0:2], 16)
        b2 = int(chunk[2:4], 16)

        dtc = decode_dtc_pair(b1, b2)
        if dtc:
            dtcs.append(dtc)

    return dtcs
 """
 

DTC_TYPE = ("P", "C", "B", "U")


def decode_dtc_pair(byte1, byte2):
    # أسرع check
    if not (byte1 | byte2):
        return None

    return (
        f"{DTC_TYPE[byte1 >> 6]}"
        f"{(byte1 >> 4) & 0x3}"
        f"{byte1 & 0xF:X}"
        f"{byte2 >> 4:X}"
        f"{byte2 & 0xF:X}"
    )


def parse_dtc_response(resp, expected_mode_prefix):
    if not resp.startswith(expected_mode_prefix):
        return []

    data = resp[2:]
    if len(data) < 4:
        return []

    # نحول كل البيانات مرة وحدة بدل كل loop
    try:
        raw_bytes = bytes.fromhex(data)
    except ValueError:
        return []

    dtcs = []
    append = dtcs.append  # optimization

    # نمشي كل 2 bytes
    for i in range(0, len(raw_bytes), 2):
        b1 = raw_bytes[i]
        b2 = raw_bytes[i + 1] if i + 1 < len(raw_bytes) else 0

        if not (b1 | b2):
            break  # غالبًا الباقي صفر

        dtc = decode_dtc_pair(b1, b2)
        if dtc:
            append(dtc)

    return dtcs

def build_dtc_payload(resp, expected_mode_prefix, mode, dtc_type):
    return {
        "mode": mode,
        "type": dtc_type,
        "raw": resp,
        "dtcs": parse_dtc_response(resp, expected_mode_prefix),
    }