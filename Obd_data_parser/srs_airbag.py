#حق الايرباق و الي معاه
class SRSAirbagScanner:
    """
    Read-only generic SRS/Airbag scanner.

    الهدف:
    - تجربة أشهر عناوين موديول SRS
    - تنفيذ أوامر قراءة فقط
    - جمع الردود بشكل نظيف
    - عدم لمس أي أوامر كتابة أو مسح أو تشغيل

    ملاحظة:
    - ليس كل السيارات ستدعم كل الخدمات
    - بعض السيارات سترجع NO DATA
    - هذا طبيعي
    """

    def __init__(self, elm):
        self.elm = elm

        # أشهر IDs محتملة لموديول SRS في سيارات كثيرة
        self.possible_request_ids = [
            "7C0",
            "750",
            "780",
            "730",
            "740",
            "760",
        ]

        # خدمات قراءة فقط
        # لا يوجد أي service للكتابة أو المسح أو التشغيل
        self.safe_services = {
            # قراءة DTCs غالبًا عبر UDS
            "read_dtcs": "1902AF",

            # حالة/summary لبعض الأنظمة
            "read_status": "190201",

            # identifiers شائعة
            "read_vin_like": "22F190",
            "read_ecu_name": "22F18C",
            "read_sw_version": "22F195",
            "read_hw_version": "22F187",
            "read_serial": "22F18A",

            # أحيانًا بعض الشركات تدعم identifiers إضافية
            "read_variant": "22F100",
            "read_supplier": "22F110",
        }

    # =========================
    # أدوات داخلية
    # =========================

    def _set_header(self, can_id):
        """
        يحدد الموديول الذي سنرسل له.
        """
        return self.elm.send_slow(f"ATSH{can_id}")

    def _normalize_raw(self, resp):
        if resp is None:
            return ""
        return str(resp).strip()

    def _is_valid_response(self, resp):
        """
        يتحقق هل الرد يبدو فعليًا رد صالح وليس NO DATA.
        """
        raw = self._normalize_raw(resp)
        if not raw:
            return False

        upper = raw.upper().replace(" ", "")

        invalid_tokens = [
            "NODATA",
            "?",
            "ERROR",
            "UNABLETOCONNECT",
            "BUSERROR",
            "STOPPED",
            "CANERROR",
        ]

        return not any(token in upper for token in invalid_tokens)

    def _build_item(self, can_id, service_name, service_cmd, raw):
        return {
            "module": "srs_airbag",
            "request_id": can_id,
            "service_name": service_name,
            "service": service_cmd,
            "raw": raw,
            "valid": self._is_valid_response(raw),
        }

    def _safe_request(self, can_id, service_name, service_cmd):
        """
        طلب قراءة واحد وآمن.
        """
        self._set_header(can_id)
        raw = self.elm.send_slow(service_cmd)
        return self._build_item(can_id, service_name, service_cmd, raw)

    def _scan_services(self, service_names):
        """
        يجرب عدة خدمات قراءة على عدة headers.
        """
        results = []

        for can_id in self.possible_request_ids:
            for service_name in service_names:
                service_cmd = self.safe_services[service_name]
                item = self._safe_request(can_id, service_name, service_cmd)
                results.append(item)

        return results

    # =========================
    # أقسام القراءة
    # =========================

    def probe_module(self):
        """
        اكتشاف أولي: هل يوجد موديول SRS يرد؟
        """
        return self._scan_services(["read_dtcs"])

    def read_dtcs(self):
        """
        قراءة DTCs الخاصة بـ SRS.
        """
        return self._scan_services(["read_dtcs"])

    def read_status(self):
        """
        قراءة status / summary إن كانت مدعومة.
        """
        return self._scan_services(["read_status"])

    def read_module_info(self):
        """
        قراءة معلومات تعريفية من الموديول إن كانت مدعومة.
        """
        return self._scan_services([
            "read_vin_like",
            "read_ecu_name",
            "read_sw_version",
            "read_hw_version",
            "read_serial",
            "read_variant",
            "read_supplier",
        ])

    # =========================
    # Helpers مفيدة
    # =========================

    def get_valid_items(self, items):
        """
        يرجع فقط الردود الصالحة.
        """
        return [item for item in items if item["valid"]]

    def get_detected_request_ids(self, items):
        """
        يرجع IDs التي أعطت ردودًا صالحة.
        """
        ids = []
        for item in items:
            if item["valid"] and item["request_id"] not in ids:
                ids.append(item["request_id"])
        return ids

    # =========================
    # الفحص الكامل
    # =========================

    def scan_all(self):
        """
        فحص SRS كامل - قراءة فقط.
        """
        probe = self.probe_module()
        dtcs = self.read_dtcs()
        status = self.read_status()
        module_info = self.read_module_info()

        return {
            "module": "srs_airbag",
            "read_only": True,
            "probe": probe,
            "probe_valid": self.get_valid_items(probe),
            "detected_request_ids": self.get_detected_request_ids(probe),
            "dtcs": dtcs,
            "dtcs_valid": self.get_valid_items(dtcs),
            "status": status,
            "status_valid": self.get_valid_items(status),
            "module_info": module_info,
            "module_info_valid": self.get_valid_items(module_info),
        }