"""
OBD-II Mode 01 PID decoder.

Defensive layer for cases where the MQTT publisher (vehicle scanner app /
device firmware) forwards a numeric ``value`` that was not converted from
the raw response bytes using the standardized OBD-II formula. When the
``raw`` frame is available (or when ``value`` itself happens to *be* the
raw frame coerced to an integer), this module re-derives the engineering
unit value from the raw bytes using the SAE J1979 formulas.

The decoder is a registry: only PIDs with an entry in ``_FORMULAS`` are
re-decoded. Unknown PIDs pass through unchanged, preserving backward
compatibility with publishers that already send correct values.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Raw frame parsing
# ---------------------------------------------------------------------------

_HEX_PAIR_RE = re.compile(r"[0-9A-Fa-f]{2}")


def _hex_string_to_bytes(raw: str) -> Optional[List[int]]:
    """Parse a hex string ("41 55 80", "415580", "0x41 0x55 0x80") into ints.

    Returns ``None`` if the string contains no recognisable hex pairs.
    """
    if not raw:
        return None
    cleaned = raw.replace("0x", "").replace("0X", "")
    pairs = _HEX_PAIR_RE.findall(cleaned)
    if not pairs:
        return None
    try:
        return [int(p, 16) for p in pairs]
    except ValueError:
        return None


def _strip_response_header(
    pid_hex_byte: int, frame: List[int]
) -> Optional[List[int]]:
    """Strip the ``41 <pid>`` Mode 01 response header.

    Returns the data bytes after the header, or ``None`` if the frame does
    not start with a valid Mode 01 response for this PID.
    """
    if len(frame) < 3:
        return None
    if frame[0] != 0x41:
        return None
    if frame[1] != pid_hex_byte:
        return None
    return frame[2:]


def _coerce_raw_to_bytes(
    pid_hex_byte: int, raw: Optional[str], value: Any
) -> Optional[List[int]]:
    """Recover the OBD-II data bytes for this PID.

    Strategy:
      1. If ``raw`` is a hex string, parse it and strip the response header.
      2. Else if ``value`` is a large integer that, when expressed as a hex
         string, begins with ``41 <pid>``, treat ``value`` itself as the raw
         frame (handles publishers that put the raw integer in ``value``).
    """
    # 1) prefer the explicit raw field
    frame = _hex_string_to_bytes(raw) if isinstance(raw, str) else None
    if frame:
        data = _strip_response_header(pid_hex_byte, frame)
        if data:
            return data

    # 2) value may itself be the raw frame as an integer
    try:
        ivalue = int(float(value))
    except (TypeError, ValueError):
        return None

    if ivalue <= 0xFF:
        return None

    # 2a) publisher stringified the hex digits as decimal
    #     (e.g. raw "41 55 80" → "415580" → parsed back as decimal int 415580).
    #     Re-interpret the decimal *digits* as a hex string.
    decimal_as_hex = str(ivalue)
    if len(decimal_as_hex) % 2 == 0:
        frame = _hex_string_to_bytes(decimal_as_hex)
        if frame:
            data = _strip_response_header(pid_hex_byte, frame)
            if data:
                return data

    # 2b) value is the actual numeric encoding of the raw frame
    hexed = f"{ivalue:X}"
    if len(hexed) % 2:  # pad to even nibble count
        hexed = "0" + hexed
    frame = _hex_string_to_bytes(hexed)
    if not frame:
        return None
    return _strip_response_header(pid_hex_byte, frame)


# ---------------------------------------------------------------------------
# Standardised SAE J1979 formulas (one entry per PID we want to (re)decode)
# ---------------------------------------------------------------------------

Formula = Callable[[List[int]], Optional[float]]


def _byte_minus_128_percent(data: List[int]) -> Optional[float]:
    """``(A - 128) * 100 / 128`` — used by all fuel/O2 trim PIDs."""
    if not data:
        return None
    return (data[0] - 128) * 100.0 / 128.0


def _byte_percent_255(data: List[int]) -> Optional[float]:
    """``A * 100 / 255`` — engine load, throttle, accelerator pedal, etc."""
    if not data:
        return None
    return data[0] * 100.0 / 255.0


def _byte_minus_40(data: List[int]) -> Optional[float]:
    """``A - 40`` — coolant / intake / ambient temperatures (°C)."""
    if not data:
        return None
    return float(data[0] - 40)


def _two_byte_rpm(data: List[int]) -> Optional[float]:
    """``(256*A + B) / 4`` — engine RPM."""
    if len(data) < 2:
        return None
    return (256 * data[0] + data[1]) / 4.0


def _byte_passthrough(data: List[int]) -> Optional[float]:
    """``A`` — vehicle speed (km/h), fuel type, etc."""
    if not data:
        return None
    return float(data[0])


# Registry keyed by canonical "0xNN" code (uppercase).
# Add new PIDs here as their raw-encoding publisher bug surfaces.
_FORMULAS: Dict[str, Formula] = {
    # Short / long term fuel trims (primary O2)
    "0x06": _byte_minus_128_percent,
    "0x07": _byte_minus_128_percent,
    "0x08": _byte_minus_128_percent,
    "0x09": _byte_minus_128_percent,
    # Short / long term fuel trims (secondary O2) — the ones reported as raw.
    "0x55": _byte_minus_128_percent,
    "0x56": _byte_minus_128_percent,
    "0x57": _byte_minus_128_percent,
    "0x58": _byte_minus_128_percent,
    # Common percent / temperature / speed PIDs (defensive coverage)
    "0x04": _byte_percent_255,       # calculated engine load
    "0x05": _byte_minus_40,          # coolant temp
    "0x0C": _two_byte_rpm,           # RPM
    "0x0D": _byte_passthrough,       # vehicle speed
    "0x0F": _byte_minus_40,          # intake air temp
    "0x11": _byte_percent_255,       # throttle position
    "0x45": _byte_percent_255,       # relative throttle position
    "0x46": _byte_minus_40,          # ambient temp
    "0x47": _byte_percent_255,       # absolute throttle position B
    "0x49": _byte_percent_255,       # accelerator pedal D
    "0x4A": _byte_percent_255,       # accelerator pedal E
    "0x4C": _byte_percent_255,       # commanded throttle actuator
    "0x5A": _byte_percent_255,       # relative accelerator pedal
    "0x5B": _byte_percent_255,       # hybrid battery life
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def _pid4_to_code_and_byte(pid4: str) -> Optional[tuple]:
    """Convert a 4-hex PID like ``"0155"`` to ("0x55", 0x55)."""
    if not isinstance(pid4, str) or len(pid4) != 4:
        return None
    try:
        pid_byte = int(pid4[2:], 16)
    except ValueError:
        return None
    return (f"0x{pid4[2:].upper()}", pid_byte)


def decode_pid_value(
    pid4: str, raw: Optional[str], value: Any
) -> Optional[float]:
    """Decode a PID value using the SAE J1979 formula when possible.

    Args:
        pid4: 4-hex PID identifier (e.g. ``"0155"`` for mode 01 PID 0x55).
        raw: Raw OBD response frame as a hex string, if available.
        value: Whatever the publisher put in ``value`` (used as fallback or
               as a source of raw bytes when ``raw`` is missing).

    Returns:
        Decoded value in engineering units, or ``None`` if this PID is not
        in the registry or the raw data could not be recovered.
    """
    info = _pid4_to_code_and_byte(pid4)
    if info is None:
        return None
    code, pid_byte = info
    formula = _FORMULAS.get(code)
    if formula is None:
        return None

    data = _coerce_raw_to_bytes(pid_byte, raw, value)
    if not data:
        return None

    try:
        decoded = formula(data)
    except Exception as exc:  # pragma: no cover - defensive
        logger.debug("OBD decode error for %s: %s", code, exc)
        return None
    return decoded
