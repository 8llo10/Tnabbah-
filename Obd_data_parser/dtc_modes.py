""" from dtc_parser import parse_dtc_response


class DTCScanner:
    def __init__(self, elm):
        self.elm = elm

    def read_stored(self):
        resp = self.elm.send("03", wait=2)
        return {
            "mode": "03",
            "type": "stored",
            "raw": resp,
            "dtcs": parse_dtc_response(resp, "43"),
        }

    def read_pending(self):
        resp = self.elm.send("07", wait=2)
        return {
            "mode": "07",
            "type": "pending",
            "raw": resp,
            "dtcs": parse_dtc_response(resp, "47"),
        }

    def read_permanent(self):
        resp = self.elm.send("0A", wait=2)
        return {
            "mode": "0A",
            "type": "permanent",
            "raw": resp,
            "dtcs": parse_dtc_response(resp, "4A"),
        }

    def read_all(self):
        return {
            "stored": self.read_stored(),
            "pending": self.read_pending(),
            "permanent": self.read_permanent(),
        }
         """
#/////////////////////////////////////////////////////////////        
"""         
from dtc_parser import parse_dtc_response


class DTCScanner:
    def __init__(self, elm):
        self.elm = elm

    def read_stored(self):
        resp = self.elm.send_normal("03")
        return {
            "mode": "03",
            "type": "stored",
            "dtcs": parse_dtc_response(resp, "43"),
        }

    def read_pending(self):
        resp = self.elm.send_normal("07")
        return {
            "mode": "07",
            "type": "pending",
            "dtcs": parse_dtc_response(resp, "47"),
        }

    def read_permanent(self):
        resp = self.elm.send_normal("0A")
        return {
            "mode": "0A",
            "type": "permanent",
            "dtcs": parse_dtc_response(resp, "4A"),
        }

    def read_all(self): 
        # تنفيذ متتابع سريع
        stored = self.read_stored()
        pending = self.read_pending()
        permanent = self.read_permanent()

        return {
            "stored": stored,
            "pending": pending,
            "permanent": permanent,
        } """
        
        
from dtc_parser import parse_dtc_response


class DTCScanner:
    def __init__(self, elm):
        self.elm = elm

    def _read_mode(self, cmd, prefix, mode, dtc_type):
        resp = self.elm.send_normal(cmd)

        return {
            "mode": mode,
            "type": dtc_type,
            "raw": resp,
            "dtcs": parse_dtc_response(resp, prefix),
        }

    def read_stored(self):
        return self._read_mode("03", "43", "03", "stored")

    def read_pending(self):
        return self._read_mode("07", "47", "07", "pending")

    def read_permanent(self):
        return self._read_mode("0A", "4A", "0A", "permanent")

    def read_all(self):
        stored = self.read_stored()
        pending = self.read_pending()
        permanent = self.read_permanent()

        return {
            "stored": stored,
            "pending": pending,
            "permanent": permanent,
        }

    def stream_grouped_dtcs(self):
        """
        يرجع الأنواع الثلاثة كمجموعات:
        stored / pending / permanent
        """
        for group in [self.read_stored(), self.read_pending(), self.read_permanent()]:
            yield group

    def stream_individual_dtcs(self):
        """
        يرجع كل DTC لحاله، مع نوعه وموده والـ raw.
        هذا المناسب للتوبيكات المنفصلة لكل كود.
        """
        for group in [self.read_stored(), self.read_pending(), self.read_permanent()]:
            for code in group["dtcs"]:
                yield {
                    "mode": group["mode"],
                    "type": group["type"],
                    "code": code,
                    "raw": group["raw"],
                }