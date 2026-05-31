"""
Rules Engine for vehicle diagnostics (PIDs, DTCs, recommendations).
Analyzes PIDs, detects anomalies, and generates recommendations
"""

import logging
import re
from typing import Any, Dict, List, Optional

from ..models import (
    PIDAnomaly, LikelyCause, DIYChecklistItem,
    MaintenanceRecommendation, SeverityLevel, UrgencyLevel,
    PIDAnalysisResult, PIDReading
)
from .pid_analyzer import PIDAnalyzer

logger = logging.getLogger(__name__)

_MIN_SEVERITY_SCORE_WHEN_ANALYZER_CRITICAL = 75.0

# SeverityLevel inherits from str, so direct comparison / max() is alphabetical
# ("CRITICAL" < "HIGH" < "LOW" < "MEDIUM"), which silently inverts intent.
# Always combine severities through this rank map.
_SEVERITY_RANK: Dict[SeverityLevel, int] = {
    SeverityLevel.LOW: 1,
    SeverityLevel.MEDIUM: 2,
    SeverityLevel.HIGH: 3,
    SeverityLevel.CRITICAL: 4,
}


def _max_severity(*levels: SeverityLevel) -> SeverityLevel:
    """Return the worst SeverityLevel by rank (not alphabetical str order)."""
    return max(levels, key=lambda s: _SEVERITY_RANK.get(s, 0))


def _pid_code_is_live_sensor(pid_code: str) -> bool:
    """True for OBD PID keys ``0x..`` hex (excludes synthetic DTC rows ``P0420`` …)."""
    code = str(pid_code or "").strip()
    return bool(code and re.fullmatch(r"0x[0-9a-fA-F]+", code, flags=re.I))


def kb_severity_level_from_score(score: float) -> str:
    """
    Map 0–100 anomaly score to the same four-way keys as DTC KB / overall severity.

    For **PID path**: if the analyzer classified the reading as ``WARNING``, callers
    should set ``severity_level`` to ``"MEDIUM"`` directly (alignment with DTC MEDIUM);
    this function is then used for ``CRITICAL`` analyzer status and any other cases.
    """
    s = float(score or 0)
    if s >= 75:
        return "CRITICAL"
    if s >= 50:
        return "HIGH"
    if s >= 25:
        return "MEDIUM"
    return "LOW"


class RulesEngine:
    """
    Core engine for analyzing vehicle diagnostics
    
    Features:
    - PID anomaly detection
    - DTC pattern matching
    - Adaptive learning
    """
    
    def __init__(self, pid_kb: Dict, dtc_kb: Dict):
        """
        Initialize RulesEngine
        
        Args:
            pid_kb: PID knowledge base
            dtc_kb: DTC knowledge base
        """
        self.pid_kb = pid_kb
        self.dtc_kb = dtc_kb
        self.pid_analyzer = PIDAnalyzer(pid_kb)
        logger.info("🔧 RulesEngine initialized with PIDAnalyzer")
    
    # ========================
    # MAIN ANALYSIS METHODS
    # ========================
    
    def analyze_pids(self, pids: Dict[str, float], dtcs: Optional[List[str]] = None, learning_state: Optional[Any] = None, vehicle_info: Optional[Dict] = None) -> PIDAnalysisResult:
        """
        Analyze PIDs with professional interpretation

        Args:
            pids: Dictionary of PID codes (ONLY standardized codes like 0x0C, NOT names)
            dtcs: Optional list of DTC codes (e.g., ['P0171', 'P0217'])
            learning_state: Optional adaptive learning state
            vehicle_info: Optional vehicle information for context

        Returns:
            PIDAnalysisResult with detected anomalies
        """
        if dtcs is None:
            dtcs = []
        anomalies = []
        system_scores = {}
        priority_issues = []
        detailed_analyses = {}
        overall_health = 100.0

        # Analyze each PID using professional analyzer
        for pid_key, value in pids.items():
            # ✅ CRITICAL: Only accept standardized PID codes (0x0C, 0x05, etc.)
            # Do NOT search by name to avoid spelling errors
            
            if pid_key not in self.pid_kb:
                logger.warning(f"⚠️ Unknown PID code: {pid_key} - Skipping (use standardized codes like 0x0C)")
                continue
            
            # Direct lookup - no name-based search
            pid_code = pid_key
            pid_def = self.pid_kb[pid_code]
            pid_name = pid_def.get("name", pid_code)

            # Analyze using PIDAnalyzer - pass ONLY the standardized code
            try:
                anomaly, analysis = self.pid_analyzer.analyze_pid(
                    pid_code=pid_code,  # ✅ Only use standardized code
                    current_value=value,
                    vehicle_info=vehicle_info
                )

                # Store detailed analysis
                detailed_analyses[pid_key] = analysis

                # Add anomaly if found
                if anomaly:
                    # Enrich anomaly with professional explanation
                    anomaly.professional_explanation = analysis.get("interpretation", "")
                    ast = str(analysis.get("status") or "").strip()
                    anomaly.analyzer_status = ast.upper() if ast else None
                    ast_u = anomaly.analyzer_status or ""
                    if ast_u == "CRITICAL":
                        anomaly.severity_score = float(
                            max(float(anomaly.severity_score), _MIN_SEVERITY_SCORE_WHEN_ANALYZER_CRITICAL)
                        )
                    # Align PID labels with DTC KB: analyzer WARNING → MEDIUM (not score bands).
                    if ast_u == "WARNING":
                        anomaly.severity_level = "MEDIUM"
                    else:
                        anomaly.severity_level = kb_severity_level_from_score(
                            float(anomaly.severity_score or 0)
                        )
                    anomaly.affected_systems = analysis.get("related_systems", [])
                    anomaly.trend = analysis.get("direction", None)

                    anomalies.append(anomaly)
                    priority_issues.append(pid_key)

                logger.debug(f"✅ {pid_name}: {analysis.get('status')} - Score: {analysis.get('severity_score')}")

            except Exception as e:
                logger.warning(f"⚠️ Error analyzing {pid_name}: {e}")
                import traceback
                logger.debug(traceback.format_exc())
                continue

        # Calculate system scores based on detected anomalies and DTCs
        for system in ["ENGINE", "COOLING", "ELECTRICAL", "FUEL", "AIR", "EXHAUST", "DRIVETRAIN"]:
            score = self._calculate_system_score(system, pids, anomalies, dtcs)
            system_scores[system] = score

        # 🔧 overall_health is DTC-ONLY now. PID anomalies and system scores do
        # NOT affect the headline health number. Each stored DTC subtracts a
        # fixed amount based on its KB severity. No DTCs → health = 100.
        # CRITICAL: -30, HIGH: -20, MEDIUM: -10, LOW: -5 (unknown → MEDIUM).
        dtc_health_penalty = 0.0
        if dtcs:
            for dtc_code in dtcs:
                dtc_code_upper = dtc_code.upper().strip()
                if dtc_code_upper in self.dtc_kb:
                    severity = self.dtc_kb[dtc_code_upper].get("severity", "MEDIUM").upper()
                else:
                    severity = "MEDIUM"
                if severity == "CRITICAL":
                    dtc_health_penalty += 30
                elif severity == "HIGH":
                    dtc_health_penalty += 20
                elif severity == "LOW":
                    dtc_health_penalty += 5
                else:  # MEDIUM (default)
                    dtc_health_penalty += 10
                logger.debug(f"   DTC {dtc_code_upper} ({severity}): health penalty applied")

        overall_health = 100.0 - dtc_health_penalty
        # Clamp to 0..100
        overall_health = max(0.0, min(100.0, overall_health))

        # Create PIDReading objects for analyzed_pids
        analyzed_pid_readings = []
        for pid_key, value in pids.items():
            # ✅ Only use standardized codes - skip unknown codes
            if pid_key not in self.pid_kb:
                logger.debug(f"Skipping unknown PID code: {pid_key}")
                continue
            
            pid_code = pid_key
            pid_def = self.pid_kb.get(pid_code, {})

            analyzed_pid_readings.append(
                PIDReading(
                    pid_code=pid_code,
                    value=value,
                    name=pid_def.get("name", pid_key),
                    unit=pid_def.get("unit", "")
                )
            )

        logger.info("✅ PID Analysis Complete:")
        logger.info(f"   - Analyzed PIDs: {len(pids)}")
        logger.info(f"   - Anomalies detected (from PIDs): {len(anomalies)}")
        logger.info(f"   - System scores: {system_scores}")
        logger.info(f"   - Overall health: {overall_health:.1f}%")

        # 🔧🔧 CRITICAL FIX: Convert DTCs to anomalies so they appear in "الأعطال المكتشفة"
        # BUT: Check if DTC is already detected from PIDs to avoid duplication!
        if dtcs:
            # Get list of DTCs already detected from PIDs
            existing_dtcs_in_anomalies = set()
            for anomaly in anomalies:
                if hasattr(anomaly, 'related_dtcs') and anomaly.related_dtcs:
                    existing_dtcs_in_anomalies.update(anomaly.related_dtcs)
            
            for dtc_code in dtcs:
                dtc_code_upper = dtc_code.upper().strip()
                
                # ✅ Skip if already detected from PIDs - avoid duplication!
                if dtc_code_upper in existing_dtcs_in_anomalies:
                    logger.info(f"   ⏭️  DTC {dtc_code_upper} already detected from PIDs - skipping duplicate")
                    continue
                
                if dtc_code_upper in self.dtc_kb:
                    dtc_info = self.dtc_kb[dtc_code_upper]
                    severity = dtc_info.get("severity", "MEDIUM").upper()
                    
                    # Map DTC severity to anomaly severity score
                    if severity == "CRITICAL":
                        severity_score = 90
                        severity_level = "CRITICAL"
                    elif severity == "HIGH":
                        severity_score = 70
                        severity_level = "HIGH"
                    elif severity == "LOW":
                        severity_score = 20
                        severity_level = "LOW"
                    else:  # MEDIUM (default in KB)
                        severity_score = 40
                        severity_level = "MEDIUM"
                    
                    # 🔧 NEW: Try to find related PID value to display instead of 0
                    related_pid_value = 0
                    related_pids = dtc_info.get("related_pids", [])
                    
                    # If no explicit related_pids, search by related_dtcs in PIDs
                    if not related_pids:
                        for pid_code, pid_def in self.pid_kb.items():
                            if dtc_code_upper in pid_def.get("related_dtcs", []):
                                related_pids.append(pid_code)
                    
                    # Get value from first matching PID
                    if related_pids:
                        for pid_code in related_pids:
                            if pid_code in pids:
                                related_pid_value = pids[pid_code]
                                logger.debug(f"   Found related PID {pid_code} = {related_pid_value}")
                                break
                    
                    # Create anomaly object from DTC
                    dtc_anomaly = PIDAnomaly(
                        pid_code=dtc_code_upper,
                        pid_name=dtc_info.get("name", dtc_code_upper),
                        current_value=related_pid_value,  # 🔧 Use related PID value instead of 0
                        normal_range=None,
                        warning_range=None,
                        critical_range=None,
                        severity_score=severity_score,
                        failure_mode=None,
                        reason=dtc_info.get("description", ""),
                        recommendation="اكود عطل مسجل - تحتاج صيانة متخصصة",
                        severity_level=severity_level,
                        affected_systems=dtc_info.get("related_systems", []),
                        related_dtcs=[]  # DTCs don't have related_dtcs (they ARE DTCs)
                    )
                    
                    # Add to anomalies so it appears in UI
                    anomalies.append(dtc_anomaly)
                    logger.info(f"   ✅ DTC {dtc_code_upper} ({severity_level}) converted to anomaly - value: {related_pid_value}")

        # 🔧 Extract DTC diagnoses
        dtc_diagnoses = {}
        if dtcs:
            for dtc_code in dtcs:
                dtc_code_upper = dtc_code.upper().strip()
                if dtc_code_upper in self.dtc_kb:
                    dtc_info = self.dtc_kb[dtc_code_upper]
                    dtc_diagnoses[dtc_code_upper] = {
                        "name": dtc_info.get("name", "Unknown"),
                        "description": dtc_info.get("description", "No description available"),
                    }

        logger.info(f"   - Total anomalies (after adding DTCs): {len(anomalies)}")
        
        return PIDAnalysisResult(
            analyzed_pids=analyzed_pid_readings,
            detected_anomalies=anomalies,
            system_scores=system_scores,
            priority_issues=priority_issues,
            overall_health=overall_health,
            dtc_diagnoses=dtc_diagnoses
        )
    
    def suggest_likely_causes(
        self, 
        pids: Dict[str, float],
        dtcs: List[str],
        anomalies: Optional[List[PIDAnomaly]] = None
    ) -> List[LikelyCause]:
        """
        Suggest likely causes based on PIDs and DTCs
        
        Args:
            pids: Analyzed PIDs
            dtcs: Detected DTC codes
            anomalies: Detected PID anomalies
        
        Returns:
            List of likely causes ranked by likelihood
        """
        causes = []
        
        # Process DTC codes
        for dtc_code in dtcs:
            if dtc_code not in self.dtc_kb:
                logger.debug(f"DTC {dtc_code} not in knowledge base")
                continue
            
            dtc_info = self.dtc_kb[dtc_code]
            
            # Extract causes from DTC knowledge base
            common_causes = dtc_info.get("common_causes", [])
            
            for cause_item in common_causes:
                cause = LikelyCause(
                    cause=cause_item.get("cause", ""),
                    likelihood=cause_item.get("likelihood", 0),
                    confidence=self._calculate_confidence(dtc_code, pids),
                    related_pids=self._get_related_pids(dtc_code),
                    related_dtcs=[dtc_code],
                    evidence=self._find_evidence(dtc_code, pids, anomalies)
                )
                causes.append(cause)
        
        # Sort by likelihood and confidence
        causes.sort(
            key=lambda x: (x.likelihood * x.confidence / 100),
            reverse=True
        )
        
        logger.info(f"✅ Identified {len(causes)} likely causes")
        return causes[:5]  # Return top 5
    
    def generate_diy_checklist(
        self,
        anomalies: List[PIDAnomaly],
        dtcs: List[str]
    ) -> List[DIYChecklistItem]:
        """
        Generate DIY checklist for user

        Args:
            anomalies: Detected anomalies
            dtcs: DTC codes

        Returns:
            List of DIY checklist items
        """
        checklist = []
        step = 1
        
        # Add general inspection steps
        checklist.append(DIYChecklistItem(
            step_number=step,
            action="افحص سائل التبريد وقم بإضافته إذا لزم الحال",
            tools_needed=["قمع", "سائل تبريد"],
            difficulty="EASY",
            estimated_time_minutes=10,
            safety_warning="لا تفتح غطاء المحرك وهو ساخن"
        ))
        step += 1
        
        # Add PID-specific steps - Use PID CODES, not names!
        for anomaly in anomalies[:3]:
            # ✅ Use PID codes (0x0C, 0x05, etc.) instead of names (RPM, COOLANT_TEMP)
            pid_code = anomaly.pid_code
            
            if pid_code == "0x0C":  # RPM
                checklist.append(DIYChecklistItem(
                    step_number=step,
                    action="افحص أسلاك الإشعال والشمعات",
                    tools_needed=["مفتاح ربط", "شمعات جديدة"],
                    difficulty="MEDIUM",
                    estimated_time_minutes=30
                ))
                step += 1
            
            elif pid_code == "0x05":  # COOLANT_TEMP
                checklist.append(DIYChecklistItem(
                    step_number=step,
                    action="تحقق من مروحة التبريد (هل تعمل عند ارتفاع الحرارة؟)",
                    tools_needed=["بدون أدوات"],
                    difficulty="EASY",
                    estimated_time_minutes=5
                ))
                step += 1
            
            elif pid_code == "0x42":  # BATTERY
                checklist.append(DIYChecklistItem(
                    step_number=step,
                    action="نظف أطراف البطارية من الصدأ",
                    tools_needed=["فرشاة معادن", "ماء"],
                    difficulty="EASY",
                    estimated_time_minutes=10
                ))
                step += 1
        
        # Add DTC-specific steps
        for dtc in dtcs[:2]:
            if dtc in self.dtc_kb:
                dtc_info = self.dtc_kb[dtc]
                diy_items = dtc_info.get("diy_checklist", [])
                
                for diy_item in diy_items[:2]:
                    if step <= 5:  # Limit to 5 steps
                        checklist.append(DIYChecklistItem(
                            step_number=step,
                            action=diy_item,
                            difficulty="MEDIUM",
                            estimated_time_minutes=20
                        ))
                        step += 1
        
        logger.info(f"✅ Generated {len(checklist)} DIY checklist items")
        return checklist
    
    def generate_maintenance_recommendation(
        self,
        severity: SeverityLevel,
        causes: List[LikelyCause]
    ) -> MaintenanceRecommendation:
        """Generate maintenance recommendation"""
        
        urgency_map = {
            SeverityLevel.CRITICAL: UrgencyLevel.URGENT,
            SeverityLevel.HIGH: UrgencyLevel.SOON,
            SeverityLevel.MEDIUM: UrgencyLevel.SOON,
            SeverityLevel.LOW: UrgencyLevel.MONITOR,
        }
        
        action_map = {
            SeverityLevel.CRITICAL: "توجه فوراً للورشة — السيارة تحتاج إصلاحاً فورياً",
            SeverityLevel.HIGH: "اطلب خدمة متخصصة في الأيام القادمة",
            SeverityLevel.MEDIUM: "خطط لزيارة الورشة قريباً",
            SeverityLevel.LOW: "راقب الوضع ولا تقلق الآن",
        }
        
        time_map = {
            SeverityLevel.CRITICAL: 0,  # Immediate
            SeverityLevel.HIGH: 1,
            SeverityLevel.MEDIUM: 2,
            SeverityLevel.LOW: 4,
        }
        
        return MaintenanceRecommendation(
            action=action_map.get(severity, "اطلب خدمة"),
            urgency=urgency_map.get(severity, UrgencyLevel.MONITOR),
            estimated_time_weeks=time_map.get(severity, 4),
            impact_if_ignored="قد يؤدي لتفاقم المشكلة",
            preventive_measures=[
                "قم بالصيانة الدورية",
                "تفقد السوائل بانتظام",
                "اتبع نصائح القيادة الآمنة"
            ]
        )
    
    def calculate_overall_severity(
        self,
        system_scores: Dict[str, float],
        dtcs: List[str],
        anomalies: Optional[List[PIDAnomaly]] = None,
    ) -> SeverityLevel:
        """Calculate overall severity level — DTC-ONLY.

        The overall severity is derived strictly from the stored DTC codes and
        their KB severities. PID anomalies and system scores do NOT affect this
        verdict. No DTCs → LOW.
        """

        if not dtcs:
            return SeverityLevel.LOW

        rank = {
            "CRITICAL": 4,
            "HIGH": 3,
            "MEDIUM": 2,
            "LOW": 1,
        }
        worst = 0
        for dtc_code in dtcs:
            dtc_code_upper = str(dtc_code).upper().strip()
            if dtc_code_upper in self.dtc_kb:
                sev = str(self.dtc_kb[dtc_code_upper].get("severity", "MEDIUM")).upper()
            else:
                sev = "MEDIUM"
            worst = max(worst, rank.get(sev, 2))

        if worst >= 4:
            return SeverityLevel.CRITICAL
        if worst >= 3:
            return SeverityLevel.HIGH
        if worst >= 2:
            return SeverityLevel.MEDIUM
        return SeverityLevel.LOW

    def _score_to_severity(self, score: float) -> SeverityLevel:
        """Convert numeric score to severity level"""
        if score >= 75:
            return SeverityLevel.CRITICAL
        elif score >= 50:
            return SeverityLevel.HIGH
        elif score >= 25:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW
    
    def _calculate_system_score(
        self,
        system: str,
        pids: Dict[str, float],
        anomalies: List[PIDAnomaly],
        dtcs: Optional[List[str]] = None
    ) -> float:
        """Calculate severity score for a system based on PIDs and DTCs"""
        
        if dtcs is None:
            dtcs = []
        
        # 🔧 FIXED: Complete system_pid_map from database
        # Previously was incomplete - missing EXHAUST, DRIVETRAIN and many PIDs
        system_pid_map = {
            "ENGINE": ["0x01", "0x02", "0x04", "0x0C", "0x0E", "0x11", "0x1F", "0x21", "0x30", "0x31", "0x41", "0x43", "0x45", "0x47", "0x48", "0x49", "0x4A", "0x4B", "0x4C", "0x4D", "0x4E", "0x5A", "0x5C", "0x61", "0x62", "0x63", "0x64", "0x6C", "0x7F", "0x81", "0x82", "0x85", "LTFT", "STFT"],
            "COOLING": ["0x05", "0x67", "0x77"],
            "ELECTRICAL": ["0x1E", "0x42", "0x5B", "0x65"],
            "FUEL": ["0x03", "0x06", "0x07", "0x08", "0x09", "0x0A", "0x22", "0x23", "0x2E", "0x2F", "0x32", "0x44", "0x51", "0x52", "0x53", "0x54", "0x59", "0x5D", "0x5E", "0x6D", "0x6E", "LTFT", "STFT"],
            "AIR": ["0x0B", "0x0F", "0x10", "0x33", "0x46", "0x66", "0x68", "0x6A", "0x6F", "0x70", "0x71", "0x72", "0x74", "0x75", "0x76"],
            "EXHAUST": ["0x12", "0x13", "0x14", "0x15", "0x16", "0x17", "0x18", "0x19", "0x1A", "0x1B", "0x1D", "0x24", "0x25", "0x26", "0x27", "0x28", "0x29", "0x2A", "0x2B", "0x2C", "0x2D", "0x2E", "0x34", "0x35", "0x36", "0x37", "0x38", "0x39", "0x3A", "0x3B", "0x3C", "0x3D", "0x3E", "0x3F", "0x5F", "0x69", "0x6B", "0x73", "0x78", "0x79", "0x7A", "0x7B", "0x7C", "0x7D", "0x7E", "0x83", "0x84", "0x86", "0x87"],
            "DRIVETRAIN": ["0x0D"],
        }
        
        # DTC to system mapping
        dtc_system_map = {
            "P0171": ["FUEL", "AIR"],  # System too lean
            "P0172": ["FUEL", "AIR"],  # System too rich
            "P0300": ["ENGINE"],        # Random misfire
            "P0301": ["ENGINE"],        # Cylinder 1 misfire
            "P0420": ["EXHAUST"],       # Catalyst below threshold
            "P0500": ["ENGINE"],        # Vehicle speed sensor malfunction
            "P0505": ["ENGINE"],        # Idle control system malfunction
            "P0562": ["ELECTRICAL"],    # System voltage low
            "P0217": ["COOLING"],       # Engine overtemperature condition
            "P0128": ["COOLING"],       # Coolant thermostat malfunction
        }
        
        score = 0.0
        
        # Check for anomalies in system PIDs
        system_pids = system_pid_map.get(system, [])
        system_anomalies = [
            a for a in anomalies if a.pid_code in system_pids
        ]
        
        if system_anomalies:
            avg_severity = sum(a.severity_score for a in system_anomalies) / len(system_anomalies)
            score = max(score, avg_severity)
        
        # Check for DTCs affecting this system
        for dtc_code in dtcs:
            if dtc_code in dtc_system_map:
                affected_systems = dtc_system_map[dtc_code]
                if system in affected_systems:
                    # DTC affects this system - set high severity
                    score = max(score, 75.0)  # 75% severity for DTC match
        
        return score
    
    def _calculate_confidence(self, dtc_code: str, pids: Dict[str, float]) -> float:
        """Calculate confidence in DTC diagnosis"""
        
        if dtc_code not in self.dtc_kb:
            return 50.0
        
        # Check if related PIDs are present
        related_dtcs = self._get_related_pids(dtc_code)
        if related_dtcs:
            present_count = sum(1 for p in related_dtcs if p in pids)
            confidence = (present_count / len(related_dtcs)) * 100
            return min(confidence, 95.0)
        
        return 60.0
    
    def _get_related_pids(self, dtc_code: str) -> List[str]:
        """Get PIDs related to a DTC"""
        
        if dtc_code not in self.dtc_kb:
            return []
        
        # Could be stored in knowledge base or derived
        dtc_pid_relations = {
            "P0300": ["0x0C", "0x04", "0x06"],
            "P0171": ["0x06", "0x07", "0x5E"],
            "P0172": ["0x06", "0x07"],
            "P0217": ["0x05"],
            "P0128": ["0x05"],
            "P0562": ["0x42"],
            "P0505": ["0x0C", "0x04"],
        }
        
        return dtc_pid_relations.get(dtc_code, [])
    
    def _find_evidence(
        self,
        dtc_code: str,
        pids: Dict[str, float],
        anomalies: Optional[List[PIDAnomaly]] = None
    ) -> Optional[str]:
        """Find evidence supporting a DTC"""
        
        related_pids = self._get_related_pids(dtc_code)
        present_pids = [p for p in related_pids if p in pids]
        
        if present_pids:
            values = [f"{p}={pids[p]}" for p in present_pids[:2]]
            return f"البيانات المقاسة: {', '.join(values)}"
        
        return None
