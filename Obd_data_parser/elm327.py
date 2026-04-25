""" import serial
import time

class ELM327:
    def __init__(self, port, baud=38400):
        self.ser = serial.Serial(port, baudrate=baud, timeout=0.2)
        time.sleep(2)

    def read_until_prompt(self, timeout=4):
        end_time = time.time() + timeout
        buffer = b""
        while time.time() < end_time:
            chunk = self.ser.read(self.ser.in_waiting or 1)
            if chunk:
                buffer += chunk
                if b">" in buffer:
                    break
            time.sleep(0.05)
        return buffer.decode(errors="ignore")

    def clean(self, raw):
        return raw.replace("SEARCHING...", "") \
                  .replace("\r", "") \
                  .replace("\n", "") \
                  .replace(" ", "") \
                  .replace(">", "") \
                  .strip()

    def send(self, cmd, wait=0.15):
        self.ser.reset_input_buffer()
        self.ser.write((cmd + "\r").encode())
        time.sleep(wait)
        raw = self.read_until_prompt()
        return self.clean(raw)

    def init(self):
        for cmd, wait in [
            ("ATZ", 2),
            ("ATE0", 1),
            ("ATL0", 1),
            ("ATS0", 1),
            ("ATH0", 1),
            ("ATSP0", 2),
            ("ATAT2",1)
        ]:
            self.send(cmd, wait); """


#///////////////////////////////////////////////////////////////////////////////////////////
              
import serial
import time


class ELM327:
    def __init__(
        self,
        port: str,
        baud: int = 38400,
        serial_timeout: float = 0.05,
        default_command_timeout: float = 1.2,
        write_delay: float = 0.03,
    ):
        self.port = port
        self.baud = baud
        self.serial_timeout = serial_timeout
        self.default_command_timeout = default_command_timeout
        self.write_delay = write_delay

        self.ser = serial.Serial(
            port=self.port,
            baudrate=self.baud,
            timeout=self.serial_timeout,
        )

        # بعض القطع تحتاج مهلة قصيرة بعد فتح المنفذ
        time.sleep(0.8)

    def close(self):
        if getattr(self, "ser", None) and self.ser.is_open:
            self.ser.close()

    def flush_buffers(self):
        self.ser.reset_input_buffer()
        self.ser.reset_output_buffer()

    """ def _read_until_prompt(self, timeout: float | None = None) -> str:
        
       # يقرأ حتى ظهور علامة > أو انتهاء المهلة.
        
        timeout = timeout or self.default_command_timeout
        end_time = time.time() + timeout
        chunks = []

        while time.time() < end_time:
            waiting = self.ser.in_waiting
            chunk = self.ser.read(waiting if waiting > 0 else 1)

            if chunk:
                chunks.append(chunk)
                joined = b"".join(chunks)
                if b">" in joined:
                    break
            else:
                time.sleep(0.01)

        return b"".join(chunks).decode(errors="ignore") """
    def _read_until_prompt(self, timeout: float | None = None) -> str:
        timeout = timeout or self.default_command_timeout
        end_time = time.time() + timeout
        buffer = bytearray()

        while time.time() < end_time:
            waiting = self.ser.in_waiting
            chunk = self.ser.read(waiting if waiting > 0 else 1)
 
            if chunk:
                buffer.extend(chunk)
                if b">" in buffer:
                    break
            else:
                time.sleep(0.005)

        return buffer.decode(errors="ignore")    
        

    def clean(self, raw: str) -> str:
        """
        تنظيف الرد الخام من:
        - SEARCHING...
        - الفراغات
        - الأسطر
        - prompt >
        """
        cleaned = raw
        cleaned = cleaned.replace("SEARCHING...", "")
        cleaned = cleaned.replace("\r", "")
        cleaned = cleaned.replace("\n", "")
        cleaned = cleaned.replace(" ", "")
        cleaned = cleaned.replace(">", "")
        return cleaned.strip()

    def send(
        self,
        cmd: str,
        wait: float | None = None,
        timeout: float | None = None,
        retries: int = 1,
        return_raw: bool = False,
    ):
        """
        يرسل أمر ويرجع الرد المنظف.
        - wait: مهلة صغيرة جدًا بعد الكتابة
        - timeout: مهلة انتظار الرد
        - retries: إعادة المحاولة لو ما جاء رد
        - return_raw: لو تبين raw + clean
        """
        wait = self.write_delay if wait is None else wait
        timeout = self.default_command_timeout if timeout is None else timeout

        last_raw = ""
        last_clean = ""

        for attempt in range(retries + 1):
            self.ser.reset_input_buffer()

            self.ser.write((cmd + "\r").encode())
            self.ser.flush()

            if wait > 0:
                time.sleep(wait)

            raw = self._read_until_prompt(timeout=timeout)
            clean = self.clean(raw)

            last_raw = raw
            last_clean = clean

            if clean:
                return (raw, clean) if return_raw else clean

            # إعادة المحاولة السريعة
            if attempt < retries:
                time.sleep(0.05)

        return (last_raw, last_clean) if return_raw else last_clean

    def send_fast(self, cmd: str):
        """
        للأوامر السريعة مثل live PIDs
        """
        return self.send(cmd, wait=0.02, timeout=0.7, retries=0)

    def send_normal(self, cmd: str):
        """
        للأوامر العادية
        """
        return self.send(cmd, wait=0.02, timeout=0.9, retries=0)

    def send_slow(self, cmd: str):
        """
        للأوامر الأثقل مثل VIN وبعض أوامر mode09
        """
        return self.send(cmd, wait=0.05, timeout=2.5, retries=1)

    def init(self):
        """
        تهيئة سريعة ومناسبة لمعظم قطع ELM327.
        """
        init_commands = [
            ("ATZ", 1.5, 2.5),   # reset
            ("ATE0", 0.03, 1.0), # echo off
            ("ATL0", 0.03, 1.0), # linefeeds off
            ("ATS0", 0.03, 1.0), # spaces off
            ("ATH0", 0.03, 1.0), # headers off
            ("ATSP0", 0.05, 2.0),# auto protocol
            ("ATAT2", 0.03, 1.0),# adaptive timing auto2
        ]

        results = {}

        for cmd, wait, timeout in init_commands:
            raw, clean = self.send(
                cmd,
                wait=wait,
                timeout=timeout,
                retries=1,
                return_raw=True,
            )
            results[cmd] = {
                "raw": raw,
                "clean": clean,
            }

        return results

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.close()