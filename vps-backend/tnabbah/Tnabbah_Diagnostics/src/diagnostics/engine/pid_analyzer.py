"""
Professional PID Analyzer
Analyzes each parameter with detailed interpretations and anomaly detection
"""

import logging
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum

from ..models import PIDAnomaly, FailureMode, RangeThreshold

logger = logging.getLogger(__name__)


class AnomalyType(str, Enum):
    """Types of anomalies detected"""
    OUT_OF_RANGE = "OUT_OF_RANGE"
    TREND_ABNORMAL = "TREND_ABNORMAL"
    STUCK_VALUE = "STUCK_VALUE"
    OSCILLATING = "OSCILLATING"
    MISSING_DATA = "MISSING_DATA"
    THRESHOLD_WARNING = "THRESHOLD_WARNING"
    THRESHOLD_CRITICAL = "THRESHOLD_CRITICAL"


class PIDAnalyzer:
    """
    Advanced PID analyzer with professional interpretation
    
    Features:
    - Detailed parameter explanation
    - Multi-level anomaly detection
    - Severity scoring
    - Automatic diagnosis based on knowledge base
    """
    
    def __init__(self, pid_kb: Dict):
        """
        Initialize PID Analyzer
        
        Args:
            pid_kb: PID knowledge base
        """
        self.pid_kb = pid_kb
        self.analysis_history = {}
        
        # 🔧 Arabic translation map for user-friendly messages
        self.pid_arabic_names = {
            "0x0C": "سرعة المحرك (دورات)",
            "0x05": "درجة حرارة المحرك",
            "0x04": "حمل المحرك",
            "0x0D": "سرعة السيارة",
            "0x06": "معايرة الوقود القصيرة المدى",
            "0x07": "معايرة الوقود الطويلة المدى",
            "0x0F": "درجة حرارة الهواء الداخل",
            "0x10": "معدل تدفق الهواء",
            "0x42": "جهد البطارية",
            "0x11": "موضع المخنق",
            "0x0A": "ضغط الوقود",
            "0x67": "درجة حرارة المحرك الموسعة",
            "0x77": "درجة حرارة مبرد الهواء",
            "STFT": "معايرة الوقود القصيرة المدى",
            "LTFT": "معايرة الوقود الطويلة المدى",
        }
        logger.info("📊 PID Analyzer initialized")
    
    def _extract_min_max(self, range_obj: Any) -> Tuple[float, float]:
        """
        Extract min and max from various range formats
        
        Supports:
        - RangeThreshold objects
        - Dicts with min/max keys
        - None or empty
        
        Args:
            range_obj: Range object in any format
        
        Returns:
            Tuple of (min_value, max_value)
        """
        
        # Handle None
        if range_obj is None:
            return float('-inf'), float('inf')
        
        # Handle RangeThreshold object
        if hasattr(range_obj, 'min') and hasattr(range_obj, 'max'):
            return float(range_obj.min), float(range_obj.max)
        
        # Handle dict
        if isinstance(range_obj, dict):
            min_val = range_obj.get("min", float('-inf'))
            max_val = range_obj.get("max", float('inf'))
            return float(min_val) if min_val != float('-inf') else float('-inf'), \
                   float(max_val) if max_val != float('inf') else float('inf')
        
        # Handle empty or invalid
        return float('-inf'), float('inf')
    
    
    def analyze_pid(
        self,
        pid_code: str,
        current_value: float,
        historical_values: Optional[List[float]] = None,
        vehicle_info: Optional[Dict] = None
    ) -> Tuple[Optional[PIDAnomaly], Dict[str, Any]]:
        """
        Analyze a single PID and detect anomalies

        Args:
            pid_code: OBD-II code (e.g., "0x0C") - ONLY standardized codes!
            current_value: Current PID value
            historical_values: Previous values for trend analysis
            vehicle_info: Vehicle information for context

        Returns:
            Tuple of (PIDAnomaly or None, detailed_analysis_dict)
        """

        # ✅ CRITICAL: Only accept standardized PID codes
        if pid_code not in self.pid_kb:
            return None, {
                "interpretation": f"معامل {pid_code} غير معروف",
                "status": "UNKNOWN",
                "action": "اطلب من فني متخصص التحقق"
            }

        # Get PID definition - direct lookup only
        pid_def = self.pid_kb[pid_code]
        if not pid_def:
            return None, {"status": "NOT_FOUND"}

        # Perform comprehensive analysis
        analysis = self._detailed_analysis(
            pid_code, current_value, pid_def,
            historical_values, vehicle_info
        )

        # Detect anomalies
        anomaly = self._detect_anomalies(
            pid_code, current_value, pid_def,
            historical_values, analysis
        )

        return anomaly, analysis
    
    def _detailed_analysis(
        self,
        pid_code: str,
        current_value: float,
        pid_def: Dict,
        historical_values: Optional[List[float]],
        vehicle_info: Optional[Dict]
    ) -> Dict[str, Any]:
        """
        Generate detailed analysis for a PID

        Returns:
            Dictionary with comprehensive analysis
        """

        # Get human-readable name for display
        pid_name = pid_def.get("name", pid_code)

        analysis = {
            "pid_name": pid_name,
            "pid_code": pid_code,
            "current_value": current_value,
            "unit": pid_def.get("unit", ""),
            "description": pid_def.get("description", ""),
            "interpretation": "",
            "status": "NORMAL",
            "severity_score": 0,
            "confidence": 0,
            "recommendations": [],
            "related_systems": pid_def.get("systems", []),
            "related_dtcs": pid_def.get("related_dtcs", [])
        }

        # Get ranges
        normal_range = pid_def.get("normal_range", {})
        warning_range = pid_def.get("warning_range", {})
        critical_range = pid_def.get("critical_range", {})

        # Determine status and severity
        analysis = self._classify_status(
            analysis, current_value, normal_range,
            warning_range, critical_range
        )

        # Get interpretation using pid_code mapping or generic
        analysis["interpretation"] = self._generic_interpretation(
                pid_name, current_value, analysis["status"], pid_def
            )
        
        # Analyze historical trend
        if historical_values and len(historical_values) > 1:
            trend_analysis = self._analyze_trend(historical_values, current_value)
            analysis.update(trend_analysis)
        
        return analysis
    
    def _classify_status(
        self,
        analysis: Dict,
        value: float,
        normal_range: Any,
        warning_range: Any,
        critical_range: Any
    ) -> Dict:
        """
        Classify PID status and severity
        
        Handles ranges in multiple formats:
        - RangeThreshold objects
        - Dicts with min/max
        - None or empty values
        """
        
        # Extract min/max safely from any format
        min_normal, max_normal = self._extract_min_max(normal_range)
        min_warning, max_warning = self._extract_min_max(warning_range)
        min_critical, max_critical = self._extract_min_max(critical_range)

        # FIRST check: Is value inside normal range?
        if min_normal <= value <= max_normal:
            # Inside normal range = NORMAL status
            analysis["status"] = "NORMAL"
            analysis["severity_score"] = 0
            analysis["confidence"] = 95
        # SECOND check: Is value outside normal but inside warning?
        elif (min_warning != float('-inf') or max_warning != float('inf')) and \
             (min_warning <= value <= max_warning):
            analysis["status"] = "WARNING"
            # Calculate distance from normal range
            if value < min_normal:
                distance = abs(value - min_normal)
            else:
                distance = abs(value - max_normal)
            
            # Calculate max possible distance in warning range
            warn_width = max_warning - min_warning

            
            # Severity as proportion of warning range
            if warn_width > 0:
                # Closer to normal = lower severity, closer to edge = higher severity
                distance_in_warning = min(
                    abs(value - max_normal) if value > max_normal else 0,
                    abs(value - min_normal) if value < min_normal else 0
                )
                analysis["severity_score"] = int((distance_in_warning / warn_width) * 40) + 20
            else:
                analysis["severity_score"] = 30
            
            analysis["confidence"] = 85
        # THIRD check: Is value outside normal and warning but inside critical?
        elif (min_critical != float('-inf') or max_critical != float('inf')) and \
             (min_critical <= value <= max_critical):
            analysis["status"] = "CRITICAL"
            # Graduated severity within critical band: align bottom (at critical_min) with
            # overall CRITICAL threshold (>=75) — same banding as RulesEngine._score_to_severity.
            crit_width = max_critical - min_critical
            if crit_width > 0:
                distance_in_critical = value - min_critical
                analysis["severity_score"] = int((distance_in_critical / crit_width) * 25) + 75
            else:
                analysis["severity_score"] = 75
            analysis["confidence"] = 95
        # FOURTH check: Is value completely outside all ranges?
        else:
            analysis["status"] = "WARNING"
            # Value is way beyond all ranges - high severity
            distance = min(
                abs(value - min_normal) if value < min_normal else 0,
                abs(value - max_normal) if value > max_normal else 0
            )
            if distance > 0:
                analysis["severity_score"] = min(100, 50 + int(min(distance / 10, 1) * 40))
            else:
                analysis["severity_score"] = 30
            analysis["confidence"] = 85

        return analysis
    
    def _generic_interpretation(
        self,
        pid_name: str,
        value: float,
        status: str,
        pid_def: Dict
    ) -> str:
        """Generate generic interpretation for unknown PIDs"""
        
        unit = pid_def.get("unit", "")
        normal_range = pid_def.get("normal_range", {})
        
        # Extract min/max safely
        min_val, max_val = self._extract_min_max(normal_range)
        
        # Format min/max for display
        min_str = str(int(min_val)) if min_val != float('-inf') else "?"
        max_str = str(int(max_val)) if max_val != float('inf') else "?"
        
        if status == "NORMAL":
            return f"✅ {pid_name} طبيعي: القيمة {value}{unit} ضمن النطاق الطبيعي ({min_str}-{max_str}{unit})"
        elif status == "WARNING":
            return f"⚠️ {pid_name} غير طبيعي: القيمة {value}{unit} خارج النطاق الطبيعي. قد يوجد مشكلة في هذا المعامل."
        elif status == "CRITICAL":
            return f"❌ {pid_name} خطر: القيمة {value}{unit} خارجة عن المأمون بشكل كبير! توقف وتوجه للورشة فوراً."
        
        return f"معامل {pid_name} = {value}{unit}"
    
    def _analyze_trend(
        self,
        historical_values: List[float],
        current_value: float
    ) -> Dict[str, Any]:
        """Analyze trend in PID values"""
        
        if len(historical_values) < 2:
            return {}
        
        trend_analysis = {
            "trend": "STABLE",
            "direction": "FLAT",
            "rate_of_change": 0,
            "trend_severity": 0
        }
        
        # Calculate rate of change
        prev_value = historical_values[-1] if historical_values else current_value
        rate_of_change = current_value - prev_value
        trend_analysis["rate_of_change"] = rate_of_change
        
        # Analyze last 5 values for trend
        recent_values = historical_values[-5:] if len(historical_values) >= 5 else historical_values
        
        # Calculate slope
        if len(recent_values) > 1:
            diffs = [recent_values[i] - recent_values[i-1] for i in range(1, len(recent_values))]
            avg_diff = sum(diffs) / len(diffs)
            
            # Determine direction
            if avg_diff > 0.5:
                trend_analysis["direction"] = "INCREASING"
                trend_analysis["trend_severity"] = min(abs(avg_diff) / 10, 1) * 40
            elif avg_diff < -0.5:
                trend_analysis["direction"] = "DECREASING"
                trend_analysis["trend_severity"] = min(abs(avg_diff) / 10, 1) * 40
            else:
                trend_analysis["direction"] = "STABLE"
            
            # Check for oscillation
            variance = sum((v - avg_diff)**2 for v in diffs) / len(diffs)
            if variance > 50:
                trend_analysis["trend"] = "OSCILLATING"
                trend_analysis["trend_severity"] = min(variance / 100, 1) * 50
        
        return trend_analysis
    
    def _detect_anomalies(
        self,
        pid_code: str,
        current_value: float,
        pid_def: Dict,
        historical_values: Optional[List[float]],
        analysis: Dict
    ) -> Optional[PIDAnomaly]:
        """
        Detect anomalies and create PIDAnomaly if found

        Returns:
            PIDAnomaly object or None
        """

        # Get human-readable name for display
        pid_name = pid_def.get("name", pid_code)

        status = analysis.get("status")
        severity_score = analysis.get("severity_score", 0)

        # No anomaly if normal
        if status == "NORMAL":
            return None

        # Determine failure mode
        failure_mode = self._determine_failure_mode(
            pid_code, current_value, pid_def,
            historical_values, analysis
        )

        # Convert ranges to RangeThreshold objects
        def dict_to_range(range_dict: Dict) -> Optional[RangeThreshold]:
            if not range_dict or not isinstance(range_dict, dict):
                return None
            min_val = range_dict.get("min", float('-inf'))
            max_val = range_dict.get("max", float('inf'))
            if min_val != float('-inf') and max_val != float('inf'):
                return RangeThreshold(min=min_val, max=max_val)
            return None

        # Create anomaly with all three ranges
        anomaly = PIDAnomaly(
            pid_code=pid_code,
            pid_name=pid_name,
            current_value=current_value,
            normal_range=dict_to_range(pid_def.get("normal_range", {})),
            warning_range=dict_to_range(pid_def.get("warning_range", {})),
            critical_range=dict_to_range(pid_def.get("critical_range", {})),
            severity_score=severity_score,
            failure_mode=failure_mode,
            reason=analysis.get("interpretation", "قيمة غير طبيعية"),
            recommendation=self._get_recommendation(
                pid_code, status, current_value, pid_def
            ),
            related_dtcs=pid_def.get("related_dtcs", [])  # 🔧 Add related DTCs from PID definition
        )

        return anomaly

    def _determine_failure_mode(
        self,
        pid_code: str,
        value: float,
        pid_def: Dict,
        historical_values: Optional[List[float]],
        analysis: Dict
    ) -> Optional[FailureMode]:
        """Determine the type of failure"""
        
        normal_range = pid_def.get("normal_range", {})
        min_normal, max_normal = self._extract_min_max(normal_range)
        
        # Check if stuck
        if historical_values and len(historical_values) > 3:
            recent = historical_values[-3:]
            if all(v == recent[0] for v in recent):
                return FailureMode.STUCK_HIGH if value > max_normal else FailureMode.STUCK_LOW
        
        # Check oscillation
        if analysis.get("trend") == "OSCILLATING":
            return FailureMode.OSCILLATING
        
        # Check drift
        if analysis.get("direction") in ["INCREASING", "DECREASING"]:
            return FailureMode.DRIFT
        
        # Check high/low
        if value > max_normal:
            return FailureMode.STUCK_HIGH
        elif value < min_normal:
            return FailureMode.STUCK_LOW
        
        return None
    
    def _get_recommendation(
        self,
        pid_code: str,
        status: str,
        value: float,
        pid_def: Dict
    ) -> str:
        """Get specific recommendation based on PID status"""

        # Get Arabic name if available, otherwise use English name
        pid_name = self.pid_arabic_names.get(pid_code, pid_def.get("name", pid_code))

        # Get from knowledge base first
        insights = pid_def.get("insights", {})

        for key, insight in insights.items():
            # Check if value matches the insight condition
            if self._matches_insight_condition(pid_code, value, key, pid_def):
                return insight

        # Generic recommendation - clearer messages
        if status == "CRITICAL":
            return f"مشكلة خطيرة جداً: {pid_name} بقيمة {value}. توقف السيارة فوراً واطلب سيارة إسعاف أو توجه للورشة بحذر."
        elif status == "WARNING":
            return f"تنبيه: {pid_name} بقيمة {value}. يجب فحص السيارة قريباً عند أقرب ورشة صيانة."

        return f"طمأنينة نسبياً: راقب {pid_name}. يُفضّل ذكر ذلك في الصيانة الدورية."

    def _matches_insight_condition(
        self,
        pid_code: str,
        value: float,
        condition_key: str,
        pid_def: Dict
    ) -> bool:
        """Check if value matches insight condition based on range key."""
        key = condition_key.lower()

        # Get ranges
        normal = pid_def.get("normal_range", {})
        min_normal, max_normal = self._extract_min_max(normal)
        warning = pid_def.get("warning_range", {})
        min_warning, max_warning = self._extract_min_max(warning)
        critical = pid_def.get("critical_range", {})
        min_critical, max_critical = self._extract_min_max(critical)

        # "above_normal", "high", "above_warning" → value above normal max
        if any(k in key for k in ("above", "high", "over")):
            return value > max_normal if max_normal != float("inf") else False

        # "below_normal", "low", "under" → value below normal min
        if any(k in key for k in ("below", "low", "under")):
            return value < min_normal if min_normal != float("-inf") else False

        # "warning" → value in warning band (outside normal but not critical yet)
        if "warning" in key:
            in_warning = False
            if max_warning != float("inf") and value > max_normal and value <= max_warning:
                in_warning = True
            if min_warning != float("-inf") and value < min_normal and value >= min_warning:
                in_warning = True
            return in_warning

        # "critical" → value in critical band
        if "critical" in key:
            return min_critical <= value <= max_critical if (min_critical != float("-inf") and max_critical != float("inf")) else False

        return False

