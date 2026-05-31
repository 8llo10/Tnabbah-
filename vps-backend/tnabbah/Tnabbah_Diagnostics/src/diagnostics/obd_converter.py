"""
OBD Data Converter
Converts raw OBD-II JSON payloads to ScanRequest format for analysis.
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from .models import ScanRequest

logger = logging.getLogger(__name__)


class OBDDataConverter:
    """
    Converts OBD-II scan results to internal format
    
    Handles:
    - Mode 01 (Show Current Data) - PIDs
    - Mode 03 (Show Stored Diagnostic Trouble Codes)
    - Mode 07 (Show Pending Diagnostic Trouble Codes)
    - Mode 0A (Show Permanent Diagnostic Trouble Codes)
    - Mode 09 (Show Vehicle Information)
    """
    
    # PID code mappings from raw hex to meaningful names
    PID_MAPPINGS = {
        "0x01": "MIL_STATUS",
        "0x03": "FUEL_SYSTEM_STATUS",
        "0x04": "ENGINE_LOAD",
        "0x05": "COOLANT_TEMP",
        "0x06": "STFT",  # Short Term Fuel Trim
        "0x07": "LTFT",  # Long Term Fuel Trim
        "0x0C": "RPM",
        "0x0D": "SPEED",
        "0x0E": "TIMING_ADVANCE",
        "0x0F": "INTAKE_TEMP",
        "0x10": "MAF",
        "0x11": "THROTTLE",
        "0x13": "O2_SENSORS_PRESENT",
        "0x15": "O2_SENSOR_1",
        "0x1C": "OBD_STANDARDS",
        "0x1F": "RUNTIME",
        "0x20": "PIDS_SUPPORTED_20",
        "0x21": "DISTANCE_WITH_MIL",
        "0x24": "FUEL_RAIL_PRESSURE",
        "0x2E": "FUEL_TANK_LEVEL",
        "0x30": "NUM_EMISSIONS_TCM",
        "0x31": "DISTANCE_SINCE_CLEAR",
        "0x33": "BARO_PRESSURE",
        "0x34": "O2_SENSOR_2",
        "0x3C": "CATALYST_TEMP",
        "0x3E": "UNKNOWN",
        "0x40": "PIDS_SUPPORTED_40",
        "0x42": "VOLTAGE",
        "0x43": "UNKNOWN",
        "0x44": "O2_SENSOR_TRIM",
        "0x45": "RELATIVE_THROTTLE",
        "0x46": "AMBIENT_TEMP",
        "0x47": "THROTTLE_POSITION_B",
        "0x49": "ACCEL_PEDAL_D",
        "0x4A": "ACCEL_PEDAL_E",
        "0x4C": "THROTTLE_ACTUATOR",
        "0x4D": "UNKNOWN",
        "0x4E": "UNKNOWN",
    }

    @staticmethod
    def normalize_pid_hex_key(pid_hex: Any) -> str:
        """
        Canonical PID key for KB / internal maps: ``0x`` + uppercase hex digits.

        JSON keys use ``0x2F`` while users often type ``0x2f`` — both must match.
        Non-hex strings (e.g. ``STFT``) are returned stripped, unchanged.
        """
        if pid_hex is None:
            return ""
        s = str(pid_hex).strip()
        if not s:
            return ""
        m = re.match(r"^(0x)([0-9a-fA-F]+)$", s)
        if m:
            return m.group(1) + m.group(2).upper()
        return s

    @staticmethod
    def convert_obd_scan_to_request(
        obd_scan_result: Dict[str, Any],
        vehicle_info: Optional[Dict[str, Any]] = None
    ) -> ScanRequest:
        """
        Convert OBD scan result to ScanRequest
        
        Args:
            obd_scan_result: Raw OBD-II JSON (e.g. mode01 / dtcs / mode09 keys)
            vehicle_info: Optional vehicle information (VIN, make, model, year)
        
        Returns:
            ScanRequest ready for analysis
        """
        
        # Extract PIDs from Mode 01
        pids = OBDDataConverter._extract_pids(
            obd_scan_result.get("mode01", {})
        )
        
        # Extract DTCs from all modes
        dtcs = OBDDataConverter._extract_dtcs(obd_scan_result.get("dtcs", {}))
        
        # Extract vehicle info from Mode 09
        mode09_info = OBDDataConverter._extract_mode09_info(
            obd_scan_result.get("mode09", {})
        )
        
        # Merge vehicle info
        if vehicle_info is None:
            vehicle_info = {}
        vehicle_info.update(mode09_info)
        
        logger.info("✅ OBD Data Converted:")
        logger.info(f"   - PIDs extracted: {len(pids)}")
        logger.info(f"   - DTCs extracted: {len(dtcs)}")
        logger.info(f"   - Vehicle info keys: {list(vehicle_info.keys())}")
        
        # Create ScanRequest
        return ScanRequest(
            pids=pids,
            dtcs=dtcs,
            vehicle_info=vehicle_info,
            timestamp=datetime.now()
        )
    
    @staticmethod
    def _extract_pids(mode01_data: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract PIDs from Mode 01 data
        
        Only includes PIDs with valid parsed values
        """
        pids = {}
        
        mode01_values = mode01_data.get("values", [])
        
        for pid_entry in mode01_values:
            pid_hex = pid_entry.get("pid_hex")
            parsed_value = pid_entry.get("parsed")
            
            # Only include if we have a parsed value
            if parsed_value is None:
                logger.debug(f"⏭️  Skipping PID {pid_hex} - no parsed value")
                continue
            
            # Validate the value is numeric
            try:
                float_value = float(parsed_value)
            except (ValueError, TypeError):
                logger.warning(f"⚠️ Invalid value for {pid_hex}: {parsed_value}")
                continue
            
            code_key = OBDDataConverter.normalize_pid_hex_key(pid_hex)
            if not code_key:
                continue

            # Map to meaningful name if available
            mapped_name = OBDDataConverter.PID_MAPPINGS.get(
                code_key, OBDDataConverter.PID_MAPPINGS.get(pid_hex, code_key)
            )
            
            # Store by canonical code (for knowledge base matching)
            pids[code_key] = float_value
            
            logger.debug(f"✅ PID {code_key} ({mapped_name}): {float_value}")
        
        return pids
    
    @staticmethod
    def _extract_dtcs(dtc_data: Dict[str, Any]) -> List[str]:
        """
        Extract DTC codes from all DTC modes
        
        Checks stored, pending, and permanent DTCs
        """
        dtcs = []
        
        # Check all DTC types
        for dtc_type in ["stored", "pending", "permanent"]:
            dtc_entry = dtc_data.get(dtc_type, {})
            type_dtcs = dtc_entry.get("dtcs", [])
            
            if type_dtcs:
                logger.info(f"📍 Found {len(type_dtcs)} {dtc_type} DTC codes")
                dtcs.extend(type_dtcs)
            else:
                logger.debug(f"✅ No {dtc_type} DTCs")
        
        return dtcs
    
    @staticmethod
    def _extract_mode09_info(mode09_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract vehicle information from Mode 09 data
        
        Extracts: VIN, calibration ID, ECU name, etc.
        """
        info = {}
        
        # VIN (Mode 09 02)
        vin_data = mode09_data.get("vin", {})
        if vin_data.get("parsed"):
            info["vin"] = vin_data.get("parsed")
        
        # Calibration ID (Mode 09 04)
        calib_data = mode09_data.get("calibration_id", {})
        if calib_data.get("parsed"):
            info["calibration_id"] = calib_data.get("parsed")
        
        # ECU Name (Mode 09 0A)
        ecu_data = mode09_data.get("ecu_name", {})
        if ecu_data.get("parsed"):
            info["ecu_name"] = ecu_data.get("parsed")
        
        # CVN (Mode 09 06)
        cvn_data = mode09_data.get("cvn", {})
        if cvn_data.get("parsed"):
            info["cvn"] = cvn_data.get("parsed")
        
        if info:
            logger.info(f"📱 Vehicle info extracted: {list(info.keys())}")
        
        return info
    
    @staticmethod
    def validate_pid_value(
        pid_code: str,
        value: float,
        pid_kb: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate PID value against knowledge base
        
        Returns:
            Tuple of (is_valid, validation_message)
        """
        
        if pid_code not in pid_kb:
            return True, None  # Unknown PID, can't validate
        
        pid_def = pid_kb[pid_code]
        
        # Check normal range
        normal_range = pid_def.get("normal_range", {})
        if normal_range:
            min_val = normal_range.get("min", float("-inf"))
            max_val = normal_range.get("max", float("inf"))
            
            if not (min_val <= value <= max_val):
                return False, f"خارج النطاق الطبيعي ({min_val}-{max_val})"
        
        return True, None
    
    @staticmethod
    def handle_missing_critical_pids(
        pids: Dict[str, float],
        required_pids: Optional[List[str]] = None
    ) -> List[str]:
        """
        Check for missing critical PIDs
        
        Returns list of missing critical PIDs
        """
        
        if required_pids is None:
            # Default critical PIDs for engine analysis
            required_pids = [
                "0x0C",  # RPM
                "0x05",  # Coolant Temp
                "0x04",  # Engine Load
                "0x0D",  # Speed
            ]
        
        missing = []
        for pid in required_pids:
            if pid not in pids:
                missing.append(pid)
        
        if missing:
            logger.warning(f"⚠️ Missing PIDs: {missing}")
        
        return missing
    
    @staticmethod
    def sanitize_pids(
        pids: Dict[str, float],
        pid_kb: Dict[str, Any]
    ) -> Dict[str, float]:
        """
        Sanitize PID values to handle outliers and invalid data
        
        Strategy:
        - Remove clearly invalid values (negatives, NaN, Inf)
        - Keep extreme values that may indicate critical failures
        - Log suspicious values for investigation
        
        Returns:
            Cleaned PID dictionary with extreme values KEPT (not removed)
        """
        cleaned = {}
        outliers = []
        
        for pid_code, value in pids.items():
            try:
                # Check for NaN or Inf
                if not (-1e6 < float(value) < 1e6):
                    logger.warning(f"⚠️ Extreme value for {pid_code}: {value} - skipping")
                    continue
                
                # Skip negative values only for genuinely unsigned PIDs.
                # NOTE: 0x05 (coolant temp) and 0x0F (intake air temp) are signed —
                # cold-start / cold-climate readings can legitimately be negative,
                # so they are NOT included here.
                unsigned_pids = ['0x0C', '0x0D', '0x10', '0x04', '0x11']
                if value < 0 and pid_code in unsigned_pids:
                    logger.warning(f"⚠️ Negative value for unsigned PID {pid_code}: {value} - skipping")
                    continue
                
                # Check for outliers - but KEEP them instead of removing
                if pid_code in pid_kb:
                    pid_def = pid_kb[pid_code]
                    critical_range = pid_def.get("critical_range", {})
                    
                    if critical_range:
                        max_critical = critical_range.get("max", float("inf"))
                        min_critical = critical_range.get("min", float("-inf"))
                        
                        # ⚠️ IMPORTANT: Keep extreme values - they may be REAL critical failures!
                        # Examples: Engine at 150°C, RPM at 9000+, Pressure at 2x normal
                        # These are NOT sensor errors - they are CRITICAL CONDITIONS
                        
                        if value > max_critical * 1.5:  # 50% above critical
                            # Mark as outlier but KEEP the value
                            outliers.append({
                                'pid': pid_code,
                                'value': value,
                                'max_critical': max_critical,
                                'severity': 'EXTREME_HIGH'
                            })
                            logger.warning(
                                f"⚠️ EXTREME VALUE (kept) for {pid_code}: {value} "
                                f"(max critical: {max_critical}) - "
                                f"May indicate critical failure! ⛔"
                            )
                        elif value < min_critical * 0.5:  # 50% below critical
                            # Mark as outlier but KEEP the value
                            outliers.append({
                                'pid': pid_code,
                                'value': value,
                                'min_critical': min_critical,
                                'severity': 'EXTREME_LOW'
                            })
                            logger.warning(
                                f"⚠️ EXTREME VALUE (kept) for {pid_code}: {value} "
                                f"(min critical: {min_critical}) - "
                                f"May indicate critical failure! ⛔"
                            )
                
                cleaned[pid_code] = value
                
            except (ValueError, TypeError) as e:
                logger.warning(f"⚠️ Could not process {pid_code}: {value} - {e}")
                continue
        
        # Log summary
        if outliers:
            logger.warning(
                f"⚠️⚠️⚠️ OUTLIER SUMMARY: {len(outliers)} extreme values detected "
                f"and KEPT for analysis (not removed)"
            )
            for outlier in outliers:
                logger.warning(
                    f"   • PID {outlier['pid']}: {outlier['value']} "
                    f"({outlier.get('severity', 'UNKNOWN')})"
                )
        
        return cleaned


def convert_json_to_request(json_data: Dict[str, Any]) -> ScanRequest:
    """
    Convenience function to convert OBD JSON directly to ScanRequest
    
    Usage:
        with open("obd_scan_result.json") as f:
            data = json.load(f)
        request = convert_json_to_request(data)
    """
    return OBDDataConverter.convert_obd_scan_to_request(json_data)
