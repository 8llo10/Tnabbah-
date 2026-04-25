""" def hex_to_ascii(hex_string):
    chars = []
    for i in range(0, len(hex_string), 2):
        byte = hex_string[i:i+2]
        if len(byte) < 2:
            continue
        value = int(byte, 16)
        if 32 <= value <= 126:
            chars.append(chr(value))
    return "".join(chars)


def extract_mode09_text(resp, mode_pid_prefix):
    if not resp.startswith(mode_pid_prefix):
        return None

    data = resp[len(mode_pid_prefix):]
    if not data:
        return None

    return hex_to_ascii(data)


class Mode09Scanner:
    def __init__(self, elm):
        self.elm = elm

    def read_supported_info_pids(self):
        resp = self.elm.send("0900", wait=3)
        return {
            "mode": "0900",
            "name": "Supported Mode 09 PIDs",
            "raw": resp,
            "parsed": None,
        }

    def read_vin(self):
        resp = self.elm.send("0902", wait=3)
        return {
            "mode": "0902",
            "name": "VIN",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "4902"),
        }

    def read_calibration_id(self):
        resp = self.elm.send("0904", wait=3)
        return {
            "mode": "0904",
            "name": "Calibration ID",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "4904"),
        }

    def read_cvn(self):
        resp = self.elm.send("0906", wait=3)
        return {
            "mode": "0906",
            "name": "CVN",
            "raw": resp,
            "parsed": None,
        }

    def read_in_use_perf_tracking(self):
        resp = self.elm.send("0908", wait=3)
        return {
            "mode": "0908",
            "name": "In-use performance tracking",
            "raw": resp,
            "parsed": None,
        }

    def read_ecu_name(self):
        resp = self.elm.send("090A", wait=3)
        return {
            "mode": "090A",
            "name": "ECU name",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "490A"),
        }

    def read_all(self):
        return {
            "supported_info_pids": self.read_supported_info_pids(),
            "vin": self.read_vin(),
            "calibration_id": self.read_calibration_id(),
            "cvn": self.read_cvn(),
            "in_use_perf_tracking": self.read_in_use_perf_tracking(),
            "ecu_name": self.read_ecu_name(),
        } """
 #///////////////////////////////////////////////////////////////////////////////       
        
""" def hex_to_ascii(hex_string):
    try:
        data = bytes.fromhex(hex_string)
    except ValueError:
        return None

    return "".join(
        chr(b) for b in data if 32 <= b <= 126
    )


def extract_mode09_text(resp, mode_pid_prefix):
    if not resp.startswith(mode_pid_prefix):
        return None

    data = resp[len(mode_pid_prefix):]
    if not data:
        return None

    return hex_to_ascii(data)


class Mode09Scanner:
    def __init__(self, elm):
        self.elm = elm

    def read_supported_info_pids(self):
        resp = self.elm.send_normal("0900")
        return {
            "mode": "0900",
            "name": "Supported Mode 09 PIDs",
            "parsed": None,
        }

    def read_vin(self):
        resp = self.elm.send_slow("0902")
        return {
            "mode": "0902",
            "name": "VIN",
            "parsed": extract_mode09_text(resp, "4902"),
        }

    def read_calibration_id(self):
        resp = self.elm.send_slow("0904")
        return {
            "mode": "0904",
            "name": "Calibration ID",
            "parsed": extract_mode09_text(resp, "4904"),
        }

    def read_cvn(self):
        resp = self.elm.send_normal("0906")
        return {
            "mode": "0906",
            "name": "CVN",
            "parsed": None,
        }

    def read_in_use_perf_tracking(self):
        resp = self.elm.send_normal("0908")
        return {
            "mode": "0908",
            "name": "In-use performance tracking",
            "parsed": None,
        }

    def read_ecu_name(self):
        resp = self.elm.send_slow("090A")
        return {
            "mode": "090A",
            "name": "ECU name",
            "parsed": extract_mode09_text(resp, "490A"),
        }

    def read_all(self):
        return {
            "supported_info_pids": self.read_supported_info_pids(),
            "vin": self.read_vin(),
            "calibration_id": self.read_calibration_id(),
            "cvn": self.read_cvn(),
            "in_use_perf_tracking": self.read_in_use_perf_tracking(),
            "ecu_name": self.read_ecu_name(),
        } """
        
        
#///////////////////////////////////////////////////////

def hex_to_ascii(hex_string):
    try:
        data = bytes.fromhex(hex_string)
    except ValueError:
        return None

    text = "".join(chr(b) for b in data if 32 <= b <= 126).strip()
    return text or None


def extract_mode09_text(resp, mode_pid_prefix):
    if not resp or not resp.startswith(mode_pid_prefix):
        return None

    data = resp[len(mode_pid_prefix):]
    if not data:
        return None

    return hex_to_ascii(data)


class Mode09Scanner:
    def __init__(self, elm):
        self.elm = elm
        self._cached_info = None

    def read_supported_info_pids(self):
        resp = self.elm.send_normal("0900")
        return {
            "mode": "0900",
            "name": "Supported Mode 09 PIDs",
            "raw": resp,
            "parsed": None,
        }

    def read_vin(self):
        resp = self.elm.send_slow("0902")
        return {
            "mode": "0902",
            "name": "VIN",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "4902"),
        }

    def read_calibration_id(self):
        resp = self.elm.send_slow("0904")
        return {
            "mode": "0904",
            "name": "Calibration ID",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "4904"),
        }

    def read_cvn(self):
        resp = self.elm.send_normal("0906")
        return {
            "mode": "0906",
            "name": "CVN",
            "raw": resp,
            "parsed": resp if resp else None,
        }

    def read_in_use_perf_tracking(self):
        resp = self.elm.send_normal("0908")
        return {
            "mode": "0908",
            "name": "In-use performance tracking",
            "raw": resp,
            "parsed": resp if resp else None,
        }

    def read_ecu_name(self):
        resp = self.elm.send_slow("090A")
        return {
            "mode": "090A",
            "name": "ECU name",
            "raw": resp,
            "parsed": extract_mode09_text(resp, "490A"),
        }

    def read_all(self, use_cache=True):
        """
        Mode09 يشتغل مرة واحدة غالبًا عند بداية التشغيل.
        """
        if use_cache and self._cached_info is not None:
            return self._cached_info

        result = {
            "supported_info_pids": self.read_supported_info_pids(),
            "vin": self.read_vin(),
            "calibration_id": self.read_calibration_id(),
            "cvn": self.read_cvn(),
            "in_use_perf_tracking": self.read_in_use_perf_tracking(),
            "ecu_name": self.read_ecu_name(),
        }

        self._cached_info = result
        return result

    def build_vehicle_info_payload(self):
        """
        هذا جاهز للنشر في MQTT مرة واحدة عند التشغيل
        """
        info = self.read_all()

        vin = info["vin"]["parsed"]
        ecu_name = info["ecu_name"]["parsed"]
        calibration_id = info["calibration_id"]["parsed"]
        cvn = info["cvn"]["parsed"]
        supported_info_pids = info["supported_info_pids"]["raw"]

        return {
            "vin": vin,
            "ecu_name": ecu_name,
            "calibration_id": calibration_id,
            "cvn": cvn,
            "supported_info_pids": supported_info_pids,
            "in_use_perf_tracking": info["in_use_perf_tracking"]["parsed"],
            "limited_access": vin is None,
            "access_message": None if vin else "الوصول لكمبيوتر سيارتك محدود",
        }

    def build_car_identity(self, fallback_car_id="unknown-car"):
        """
        نحدد car_id من mode09:
        1) VIN
        2) ECU name
        3) fallback
        """
        payload = self.build_vehicle_info_payload()

        vin = payload["vin"]
        ecu_name = payload["ecu_name"]

        if vin:
            return {
                "car_id": vin,
                "identity_source": "vin",
                "limited_access": False,
                "access_message": None,
                "vehicle_info": payload,
            }

        if ecu_name:
            return {
                "car_id": ecu_name,
                "identity_source": "ecu_name",
                "limited_access": True,
                "access_message": "الوصول لكمبيوتر سيارتك محدود",
                "vehicle_info": payload,
            }

        return {
            "car_id": fallback_car_id,
            "identity_source": "fallback",
            "limited_access": True,
            "access_message": "الوصول لكمبيوتر سيارتك محدود",
            "vehicle_info": payload,
        }