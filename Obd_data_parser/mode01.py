""" from pid_parser import PID_NAMES, parse_supported_pids, parse_value


class Mode01Scanner:
    def __init__(self, elm):
        self.elm = elm

    def discover_supported_pids(self):
        queries = [
            ("0100", 0x00),
            ("0120", 0x20),
            ("0140", 0x40),
            ("0160", 0x60),
            ("0180", 0x80),
            ("01A0", 0xA0),
            ("01C0", 0xC0),
        ]

        all_supported = []

        for cmd, start_pid in queries:
            resp = self.elm.send(cmd, wait=2)
            pids = parse_supported_pids(resp, start_pid)
            if pids:
                all_supported.extend(pids)

        return sorted(set(all_supported))

    def read_pid(self, pid):
        cmd = f"01{pid:02X}"
        resp = self.elm.send(cmd, wait=1.5)

        return {
            "pid_hex": f"0x{pid:02X}",
            "name": PID_NAMES.get(pid, f"PID 0x{pid:02X}"),
            "raw": resp,
            "parsed": parse_value(pid, resp),
        }

    def read_all_supported(self):
        supported = self.discover_supported_pids()
        results = []

        for pid in supported:
            results.append(self.read_pid(pid))

        return {
            "supported_pids": [f"0x{pid:02X}" for pid in supported],
            "values": results,
        } """
  #////////////////////////////////////////////////////////////////////////////

"""        
from pid_parser import PID_NAMES, parse_supported_pids, parse_value


class Mode01Scanner:
    def __init__(self, elm):
        self.elm = elm
        self._cached_supported = None  # 🔥 caching

    def discover_supported_pids(self):
        # 🔥 إذا حسبناها قبل، لا نعيد
        if self._cached_supported is not None:
            return self._cached_supported

        queries = [
            ("0100", 0x00),
            ("0120", 0x20),
            ("0140", 0x40),
            ("0160", 0x60),
            ("0180", 0x80),
            ("01A0", 0xA0),
            ("01C0", 0xC0),
        ]

        all_supported = []

        for cmd, start_pid in queries:
            # 🔥 سريع بدل wait=2
            resp = self.elm.send_fast(cmd)

            pids = parse_supported_pids(resp, start_pid)
            if pids:
                all_supported.extend(pids)

        self._cached_supported = sorted(set(all_supported))
        return self._cached_supported

    def read_pid(self, pid):
        cmd = f"01{pid:02X}"

        # 🔥 استخدام send_fast بدل wait=1.5
        resp = self.elm.send_fast(cmd)

        return {
            "pid_hex": f"0x{pid:02X}",
            "name": PID_NAMES.get(pid, f"PID 0x{pid:02X}"),
            "parsed": parse_value(pid, resp),
        }

    def read_all_supported(self):
        supported = self.discover_supported_pids()

        results = []
        append = results.append  # 🔥 optimization

        for pid in supported:
            append(self.read_pid(pid))

        return {
            "supported_pids": [f"0x{pid:02X}" for pid in supported],
            "values": results,
        } """
        
from pid_parser import parse_supported_pids, parse_pid_response


class Mode01Scanner:
    def __init__(self, elm):
        self.elm = elm
        self._cached_supported = None

    def discover_supported_pids(self):
        # إذا اكتشفناها قبل، لا نعيد
        if self._cached_supported is not None:
            return self._cached_supported

        queries = [
            ("0100", 0x00),
            ("0120", 0x20),
            ("0140", 0x40),
            ("0160", 0x60),
            ("0180", 0x80),
            ("01A0", 0xA0),
            ("01C0", 0xC0),
        ]

        all_supported = []

        for cmd, start_pid in queries:
            resp = self.elm.send(cmd, wait=0.015, timeout=0.7, retries=0)#/////////////////////////////////

            pids = parse_supported_pids(resp, start_pid)

            if pids:
                all_supported.extend(pids)

        self._cached_supported = sorted(set(all_supported))
        return self._cached_supported

    def read_pid(self, pid):
        cmd = f"01{pid:02X}"
        resp = self.elm.send(cmd, wait=0.015, timeout=0.7, retries=0)

        # هذا يرجع object مرتب:
        # pid / pid_hex / name / unit / raw / value
        return parse_pid_response(pid, resp)

    def read_all_supported(self, include_none_values=True):
        supported = self.discover_supported_pids()

        results = []
        append = results.append

        for pid in supported:
            data = self.read_pid(pid)

            if include_none_values:
                append(data)
            else:
                if data["raw"]:   #////
                    yield data

        return {
            "supported_pids": [f"0x{pid:02X}" for pid in supported],
            "values": results,
        }

    def stream_all_supported(self, include_none_values=False):
        """
        يطلع كل PID لحاله، وهذا المناسب للـ MQTT
        بدل ما نجمعهم في frame واحد.
        """
        supported = self.discover_supported_pids()

        for pid in supported:
            data = self.read_pid(pid)

            if include_none_values:
                yield data
            else:
                if data["value"] is not None:
                    yield data

    def stream_all_supported_batched(self, batch_size=4, include_none_values=False):
        """
        هذا اختياري لو احتجتي batching لاحقًا للسرعة،
        لكنه ما يزال يرجع عناصر مرتبة، مو frame عشوائي.
        """
        supported = self.discover_supported_pids()
        total = len(supported)

        i = 0
        while True:
            batch = supported[i:i + batch_size]

            items = []
            for pid in batch:
                data = self.read_pid(pid)

                if include_none_values:
                    items.append(data)
                else:
                    if data["value"] is not None:
                        items.append(data)

            yield items

            i += batch_size
            if i >= total:
                i = 0
                
    def _topic_safe_name(self, name: str, pid: int):
        if not name or name.startswith("PID"):
            return f"{pid:02X}"

        return (
            name.lower()
            .replace(" ", "_")
            .replace("-", "_")
            .replace("/", "_")
        )