""" from mode01 import Mode01Scanner
from dtc_modes import DTCScanner
from mode09 import Mode09Scanner


class OBDScanner:
    def __init__(self, elm):
        self.elm = elm
        self.mode01 = Mode01Scanner(elm)
        self.dtc = DTCScanner(elm)
        self.mode09 = Mode09Scanner(elm)

    def scan_mode01(self):
        return self.mode01.read_all_supported()

    def scan_dtcs(self):
        return self.dtc.read_all()

    def scan_mode09(self):
        return self.mode09.read_all()

    def full_scan(self):
        return {
            "mode01": self.scan_mode01(),
            "dtcs": self.scan_dtcs(),
            "mode09": self.scan_mode09(),
        } """

#///////////////////////////////////////////////////////////////////////////////////////////////////        
        
from mode01 import Mode01Scanner
from dtc_modes import DTCScanner
from mode09 import Mode09Scanner
from srs_airbag import SRSAirbagScanner


class OBDScanner:
    def __init__(self, elm):
        self.elm = elm
        self.mode01 = Mode01Scanner(elm)
        self.dtc = DTCScanner(elm)
        self.mode09 = Mode09Scanner(elm)
        self.srs = SRSAirbagScanner(elm)

    # 🔥 FULL (قديم)
    def full_scan(self):
        return {
            "mode01": self.mode01.read_all_supported(),
            "dtcs": self.dtc.read_all(),
            "mode09": self.mode09.read_all(),
        }

    # 🚀 FAST VERSION
    def full_scan_fast(self):
        return {
            "mode01": self.mode01.read_all_supported(),
            "dtcs": self.dtc.read_all(),
            "mode09": {
                "vin": self.mode09.read_vin()
            },
        }

    # 🔥 STREAMING (الأهم)
    def stream_full_scan(self):

        # 1) supported pids
        supported = self.mode01.discover_supported_pids()
        yield {
            "type": "supported_pids",
            "data": supported
        }

        # 2) PIDs واحد واحد
        for pid in supported:
            yield {
                "type": "mode01_pid",
                "data": self.mode01.read_pid(pid)
            }

        # 3) DTC
        yield {
            "type": "dtc_stored",
            "data": self.dtc.read_stored()
        }

        yield {
            "type": "dtc_pending",
            "data": self.dtc.read_pending()
        }

        yield {
            "type": "dtc_permanent",
            "data": self.dtc.read_permanent()
        }

        # 4) VIN فقط (أسرع)
        yield {
            "type": "vin",
            "data": self.mode09.read_vin()
        }
        
    #///8888888888888888888888888888888888888
        
    def live_stream_all_pids(self, batch_size=4):
        supported = self.mode01.discover_supported_pids()

        i = 0
        total = len(supported)

        print(f"Total PIDs: {total}")

        while True:
            frame = {}

            batch = supported[i:i+batch_size]

            for pid in batch:
                data = self.mode01.read_pid(pid)
                frame[data["name"]] = data["parsed"]

            yield frame

            i += batch_size

            if i >= total:
                i = 0
        
    #//////888888888888888888888888888888888888
    
    def get_vehicle_identity(self, fallback_car_id="unknown-car"):
        """
        يجيب car_id + vehicle info من mode09 مرة واحدة
        """
        return self.mode09.build_car_identity(fallback_car_id=fallback_car_id)

    def get_vehicle_info_once(self):
        """
        معلومات السيارة من mode09 مرة واحدة عند التشغيل
        """
        return self.mode09.build_vehicle_info_payload()

    def stream_all_pids(self, include_none_values=False):
        """
        يطلع كل PID لحاله
        مناسب للـ MQTT:
        obd/{car_id}/live/{topic_name}
        """
        yield from self.mode01.stream_all_supported(
            include_none_values=include_none_values
        )

    def stream_all_dtcs(self):
        """
        يطلع كل DTC لحاله
        مناسب للـ MQTT:
        obd/{car_id}/dtcs/{type}/{code}
        """
        yield from self.dtc.stream_individual_dtcs()

    def discover_supported_pids(self):
        return self.mode01.discover_supported_pids()
    
    
    #srs///////////////////////////////////////////////
    def scan_srs_once(self):
        return self.srs.scan_all()
    