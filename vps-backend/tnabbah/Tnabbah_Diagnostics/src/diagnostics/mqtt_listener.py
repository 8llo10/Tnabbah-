"""
MQTT ingestion service for tnabbah diagnostics.

Subscribes to live OBD telemetry published by the mobile app/scanner under
``Tnabbah/{user_id}/{car_id}/...`` and keeps a per-car *latest-value* cache.
The /api/scan-from-mqtt endpoint freezes a snapshot from this cache instead
of consuming the continuous stream directly, so the AI always analyses one
self-consistent moment in time.

Topics consumed (as published by ``vehicleScannerService.ts``):

    Tnabbah/{user_id}/{car_id}/pids/{PID4}            e.g. pids/0104
    Tnabbah/{user_id}/{car_id}/dtc/full
    Tnabbah/{user_id}/{car_id}/dtc/{stored|pending|permanent}

Every published payload is wrapped as
    { app, userId, carId, path, timestamp, data: <ObdValue|...> }
so we unwrap ``data`` defensively.
"""
from __future__ import annotations

import json
import logging
import os
import re
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

import paho.mqtt.client as mqtt

from .obd_pid_decoder import decode_pid_value

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Cache shape
# ---------------------------------------------------------------------------

@dataclass
class PidSample:
    pid: str            # 4-hex e.g. "0104"
    value: Any
    unit: Optional[str] = None
    name: Optional[str] = None
    raw: Optional[str] = None
    ts: float = field(default_factory=time.time)


@dataclass
class CarCache:
    """Latest-value cache for a single (user_id, car_id)."""
    user_id: str
    car_id: str
    pids: Dict[str, PidSample] = field(default_factory=dict)
    dtcs: Dict[str, List[str]] = field(default_factory=lambda: {
        "stored": [],
        "pending": [],
        "permanent": [],
    })
    last_update: float = 0.0


_PID4_RE = re.compile(r"^[0-9A-Fa-f]{4}$")


def mqtt_pid_to_api_code(pid4: str) -> str:
    """Convert MQTT 4-hex PID code (e.g. ``"0104"``) to the API ``"0xNN"``
    format used by the ScanRequest model.
    """
    last = pid4[-2:].upper()
    return f"0x{last}"


# ---------------------------------------------------------------------------
# Listener
# ---------------------------------------------------------------------------

class MqttListener:
    """Background MQTT subscriber maintaining a thread-safe latest-value cache."""

    def __init__(self, url: str, app_root: str = "Tnabbah") -> None:
        self.url = url
        self.app_root = app_root
        self._cache: Dict[Tuple[str, str], CarCache] = {}
        self._lock = threading.RLock()
        self._client: Optional[mqtt.Client] = None
        self._connected_event = threading.Event()
        self._stop = False

    # -- public --------------------------------------------------------------

    def start(self) -> None:
        parsed = urlparse(self.url)
        scheme = (parsed.scheme or "mqtt").lower()
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or (9001 if scheme.startswith("ws") else 1883)

        client_id = f"tnabbah_backend_{int(time.time())}"
        if scheme in ("ws", "wss"):
            client = mqtt.Client(client_id=client_id, transport="websockets")
            # Path defaults to "/mqtt" on Mosquitto WS, but the mobile broker
            # config uses "/" — keep it open so both work.
            client.ws_set_options(path=parsed.path or "/")
            if scheme == "wss":
                client.tls_set()
        else:
            client = mqtt.Client(client_id=client_id)
            if scheme == "mqtts":
                client.tls_set()

        client.on_connect = self._on_connect
        client.on_disconnect = self._on_disconnect
        client.on_message = self._on_message
        # Auto-reconnect with backoff (paho built-in).
        client.reconnect_delay_set(min_delay=1, max_delay=30)

        logger.info("📡 MQTT listener connecting to %s (%s:%s)", self.url, host, port)
        try:
            client.connect_async(host, port, keepalive=30)
        except Exception as e:
            logger.error("❌ MQTT connect_async failed: %s", e)
            return

        self._client = client
        client.loop_start()

    def stop(self) -> None:
        self._stop = True
        if self._client is not None:
            try:
                self._client.loop_stop()
                self._client.disconnect()
            except Exception:
                pass
            self._client = None

    def is_connected(self) -> bool:
        return bool(self._client and self._client.is_connected())

    def wait_until_connected(self, timeout: float = 5.0) -> bool:
        return self._connected_event.wait(timeout=timeout)

    def snapshot(
        self,
        user_id: str,
        car_id: str,
        freshness_seconds: float = 10.0,
    ) -> Dict[str, Any]:
        """Return a frozen snapshot of the latest values for one car.

        PIDs older than ``freshness_seconds`` are dropped so we never feed the
        AI stale readings (e.g. when the OBD piece has been disconnected).
        """
        key = (user_id, car_id)
        now = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                return {
                    "user_id": user_id,
                    "car_id": car_id,
                    "pids": {},
                    "dtcs": {"stored": [], "pending": [], "permanent": []},
                    "last_update": None,
                    "is_empty": True,
                }

            fresh_pids: Dict[str, Dict[str, Any]] = {}
            for pid, sample in entry.pids.items():
                if (now - sample.ts) <= freshness_seconds:
                    fresh_pids[pid] = {
                        "pid": sample.pid,
                        "value": sample.value,
                        "unit": sample.unit,
                        "name": sample.name,
                        "ts": sample.ts,
                    }

            dtcs_copy = {
                "stored": list(entry.dtcs.get("stored", [])),
                "pending": list(entry.dtcs.get("pending", [])),
                "permanent": list(entry.dtcs.get("permanent", [])),
            }

            return {
                "user_id": entry.user_id,
                "car_id": entry.car_id,
                "pids": fresh_pids,
                "dtcs": dtcs_copy,
                "last_update": entry.last_update,
                "is_empty": not fresh_pids,
            }

    # -- callbacks -----------------------------------------------------------

    def _on_connect(self, client: mqtt.Client, _userdata: Any, _flags: Any, rc: int, *_args: Any) -> None:
        if rc != 0:
            logger.error("❌ MQTT connect refused, rc=%s", rc)
            return
        logger.info("✅ MQTT listener connected")
        self._connected_event.set()
        # Subscribe to every car under every user so the AI is ready for any
        # car that publishes telemetry. The broker streams whatever is live.
        topics = [
            (f"{self.app_root}/+/+/pids/+", 0),
            (f"{self.app_root}/+/+/dtc/full", 0),
            (f"{self.app_root}/+/+/dtc/stored", 0),
            (f"{self.app_root}/+/+/dtc/pending", 0),
            (f"{self.app_root}/+/+/dtc/permanent", 0),
        ]
        client.subscribe(topics)

    def _on_disconnect(self, _client: mqtt.Client, _userdata: Any, rc: int, *_args: Any) -> None:
        self._connected_event.clear()
        logger.warning("⚠️ MQTT listener disconnected (rc=%s)", rc)

    def _on_message(self, _client: mqtt.Client, _userdata: Any, msg: "mqtt.MQTTMessage") -> None:
        try:
            self._handle_message(msg.topic, msg.payload)
        except Exception:
            logger.debug("MQTT message handler error", exc_info=True)

    # -- core dispatch -------------------------------------------------------

    def _handle_message(self, topic: str, raw: bytes) -> None:
        parts = topic.split("/")
        # Expected: Tnabbah / {userId} / {carId} / {section} / {sub?}
        if len(parts) < 5 or parts[0] != self.app_root:
            return
        user_id = parts[1]
        car_id = parts[2]
        section = parts[3]
        sub = parts[4] if len(parts) >= 5 else None
        if not user_id or not car_id:
            return

        try:
            outer = json.loads(raw.decode("utf-8", errors="replace"))
        except Exception:
            return
        payload = outer.get("data") if isinstance(outer, dict) else None
        if payload is None:
            payload = outer
        if not isinstance(payload, dict):
            return

        if section == "pids":
            self._handle_pid(user_id, car_id, sub, payload)
        elif section == "dtc":
            self._handle_dtc(user_id, car_id, sub, payload)

    def _handle_pid(self, user_id: str, car_id: str, sub: Optional[str], payload: Dict[str, Any]) -> None:
        # Skip aggregate / bookkeeping topics like pids/all, pids/supported,
        # pids/support-blocks/<cmd>, and any "supported: false" rows.
        if not sub or sub in {"all", "supported", "support-blocks"}:
            return
        if payload.get("supported") is False:
            return

        pid4 = str(payload.get("pid") or sub or "").upper()
        if not _PID4_RE.match(pid4):
            return

        value = payload.get("value")
        raw = payload.get("raw")
        if value is None:
            # Some PIDs publish only raw frames; we need a numeric/boolean to
            # analyse, so skip entries without a usable value.
            return

        # Defensive re-decoding: some publishers forward the raw OBD frame as
        # an integer in ``value`` (e.g. 0x55 trim reported as 415580 instead
        # of 0%). When the SAE J1979 formula is known for this PID, recompute
        # from the raw bytes so the analyser sees engineering units.
        decoded = decode_pid_value(pid4, raw if isinstance(raw, str) else None, value)
        if decoded is not None:
            if decoded != value:
                logger.debug(
                    "Re-decoded PID %s via OBD-II formula: %s -> %s",
                    pid4, value, decoded,
                )
            value = decoded

        sample = PidSample(
            pid=pid4,
            value=value,
            unit=payload.get("unit"),
            name=payload.get("name"),
            raw=raw,
            ts=time.time(),
        )

        key = (user_id, car_id)
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                entry = CarCache(user_id=user_id, car_id=car_id)
                self._cache[key] = entry
            entry.pids[pid4] = sample
            entry.last_update = sample.ts

    def _handle_dtc(self, user_id: str, car_id: str, sub: Optional[str], payload: Dict[str, Any]) -> None:
        def extract(arr: Any) -> List[str]:
            if not isinstance(arr, list):
                return []
            out: List[str] = []
            for item in arr:
                if isinstance(item, dict):
                    code = str(item.get("code") or "").strip().upper()
                else:
                    code = str(item or "").strip().upper()
                if code:
                    out.append(code)
            return out

        updates: Dict[str, List[str]] = {}
        if sub == "full":
            updates["stored"] = extract((payload.get("stored") or {}).get("dtcs"))
            updates["pending"] = extract((payload.get("pending") or {}).get("dtcs"))
            updates["permanent"] = extract((payload.get("permanent") or {}).get("dtcs"))
        elif sub in {"stored", "pending", "permanent"}:
            updates[sub] = extract(payload.get("dtcs"))
        else:
            return

        key = (user_id, car_id)
        ts = time.time()
        with self._lock:
            entry = self._cache.get(key)
            if entry is None:
                entry = CarCache(user_id=user_id, car_id=car_id)
                self._cache[key] = entry
            for cat, codes in updates.items():
                # Replace per-category list with the latest publish (the
                # publisher always emits the full set for that category).
                entry.dtcs[cat] = list(dict.fromkeys(codes))
            entry.last_update = ts


# ---------------------------------------------------------------------------
# Singleton helpers
# ---------------------------------------------------------------------------

_listener: Optional[MqttListener] = None


def get_listener() -> Optional[MqttListener]:
    return _listener


def start_listener() -> Optional[MqttListener]:
    """Start the singleton listener using ``MQTT_URL`` env, if configured."""
    global _listener
    if _listener is not None:
        return _listener

    url = os.getenv("MQTT_URL", "").strip() or "ws://207.180.244.27:9001"
    listener = MqttListener(url=url)
    listener.start()
    _listener = listener
    return _listener


def stop_listener() -> None:
    global _listener
    if _listener is not None:
        _listener.stop()
        _listener = None
