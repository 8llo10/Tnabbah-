"""
Pydantic models for tnabbah diagnostics API and reports.
Defines data structures for PIDs, DTCs, and reports
"""

from pydantic import BaseModel, ConfigDict, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


# ========================
# RANGE MODELS
# ========================

class RangeThreshold(BaseModel):
    """Range threshold with min and max values"""
    min: float = Field(..., description="Minimum value")
    max: float = Field(..., description="Maximum value")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "min": -15,
                "max": 15
            }
        }
    )


class PIDRange(BaseModel):
    """Complete PID ranges (normal, warning, critical)"""
    normal_range: Optional[RangeThreshold] = None
    warning_range: Optional[RangeThreshold] = None
    critical_range: Optional[RangeThreshold] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "normal_range": {"min": -15, "max": 15},
                "warning_range": {"min": -25, "max": 25},
                "critical_range": {"min": -50, "max": 50}
            }
        }
    )


# ========================
# ENUMS
# ========================

class SeverityLevel(str, Enum):
    """Diagnostic severity (English keys in KB; Arabic labels: خطر شديد، خطر، تحذير، تنبيه بسيط)."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class UrgencyLevel(str, Enum):
    """Urgency levels for maintenance"""
    MONITOR = "MONITOR"
    SOON = "SOON"
    URGENT = "URGENT"


class FailureMode(str, Enum):
    """Types of sensor/component failures"""
    NO_RESPONSE = "NO_RESPONSE"
    DEGRADED = "DEGRADED"
    INTERMITTENT = "INTERMITTENT"
    DELAYED = "DELAYED"
    STUCK_HIGH = "STUCK_HIGH"
    STUCK_LOW = "STUCK_LOW"
    DRIFT = "DRIFT"
    NOISE = "NOISE"
    OVERLOAD = "OVERLOAD"
    OVERHEAT = "OVERHEAT"
    UNDER_SUPPLY = "UNDER_SUPPLY"
    OVER_SUPPLY = "OVER_SUPPLY"


# ========================
# PID & DTC MODELS
# ========================

class PIDReading(BaseModel):
    """Single PID reading"""
    pid_code: str = Field(..., description="OBD-II PID code (e.g., 0x0C)")
    value: float = Field(..., description="Current value")
    unit: str = Field(..., description="Unit of measurement")
    name: str = Field(..., description="Human-readable name")
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pid_code": "0x0C",
                "value": 3200,
                "unit": "rpm",
                "name": "RPM",
                "timestamp": "2026-04-18T12:00:00"
            }
        }
    )


class PIDAnomaly(BaseModel):
    """Detected anomaly in a PID"""
    pid_code: str
    pid_name: str
    current_value: float
    normal_range: Optional[RangeThreshold] = None
    warning_range: Optional[RangeThreshold] = None
    critical_range: Optional[RangeThreshold] = None
    severity_score: float = Field(0, ge=0, le=100)
    failure_mode: Optional[FailureMode] = None
    reason: str = Field(..., description="Why this is anomalous")
    recommendation: str = Field(..., description="What to do about it")
    professional_explanation: Optional[str] = Field(default=None, description="Professional technical explanation in Arabic")
    severity_level: Optional[str] = Field(
        "MEDIUM",
        description="DTC-style: LOW | MEDIUM | HIGH | CRITICAL. PID analyzer WARNING → MEDIUM.",
    )
    analyzer_status: Optional[str] = Field(
        default=None,
        description=(
            "Analyzer band for this PID anomaly: NORMAL | WARNING | CRITICAL. "
            "Unset for synthetic DTC-only rows."
        ),
    )
    affected_systems: Optional[List[str]] = Field(default_factory=list, description="Vehicle systems affected")
    trend: Optional[str] = Field(default=None, description="STABLE, INCREASING, DECREASING, OSCILLATING")
    action_priority: Optional[str] = Field(default="SOON", description="MONITOR, SOON, URGENT, CRITICAL")
    related_dtcs: Optional[List[str]] = Field(default_factory=list, description="DTC codes related to this anomaly")


class DTCCode(BaseModel):
    """Diagnostic Trouble Code"""
    code: str = Field(..., description="DTC code (e.g., P0300)")
    name: str = Field(..., description="Code name")
    description: str = Field(..., description="Description in Arabic")
    severity: SeverityLevel
    category: str
    timestamp: datetime = Field(default_factory=datetime.now)


# ========================
# ANALYSIS MODELS
# ========================

class LikelyCause(BaseModel):
    """Probable cause of a problem"""
    cause: str = Field(..., description="Description of cause in Arabic")
    likelihood: float = Field(0, ge=0, le=100, description="Likelihood percentage")
    confidence: float = Field(0, ge=0, le=100, description="Confidence in diagnosis")
    related_pids: List[str] = Field(default_factory=list)
    related_dtcs: List[str] = Field(default_factory=list)
    evidence: Optional[str] = None


class DIYChecklistItem(BaseModel):
    """Item in DIY checklist"""
    step_number: int
    action: str = Field(..., description="Action in Arabic")
    tools_needed: List[str] = Field(default_factory=list)
    difficulty: str = Field(default="EASY", description="EASY, MEDIUM, HARD")
    estimated_time_minutes: int = Field(default=15)
    safety_warning: Optional[str] = None


class MaintenanceRecommendation(BaseModel):
    """Maintenance recommendation"""
    action: str = Field(..., description="Action in Arabic")
    urgency: UrgencyLevel
    estimated_time_weeks: int = Field(1)
    impact_if_ignored: Optional[str] = None
    preventive_measures: List[str] = Field(default_factory=list)


# ========================
# REQUEST MODELS
# ========================

class ScanRequest(BaseModel):
    """Request for vehicle scan"""
    pids: Dict[str, float] = Field(..., description="Dictionary of PID codes and values")
    dtcs: List[str] = Field(default_factory=list, description="List of DTC codes")
    vehicle_info: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.now)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "pids": {
                    "0x0C": 3200,
                    "0x05": 115,
                    "0x42": 12.2,
                    "0x51": 1,
                },
                "dtcs": ["P0420", "P0171"],
                "vehicle_info": {
                    "mileage_km": 150000,
                    "engine_type": "gasoline",
                    "calculation_interval": None,
                },
            }
        }
    )


class ChatRequest(BaseModel):
    """Request for chatbot"""
    report_id: str = Field(..., description="ID of the report to ask about")
    question: str = Field(..., description="Question in Arabic or English")
    chat_history: Optional[List[Dict[str, str]]] = None


# ========================
# RESPONSE MODELS
# ========================

class AIReport(BaseModel):
    """Complete diagnostic report"""
    report_id: str = Field(..., description="Unique report identifier")
    timestamp: datetime
    severity: SeverityLevel
    drive_advice: str = Field(..., description="Advice for driver in Arabic")
    
    # Analysis results
    detected_anomalies: List[PIDAnomaly] = Field(default_factory=list)
    detected_dtcs: List[DTCCode] = Field(default_factory=list)
    likely_causes: List[LikelyCause] = Field(default_factory=list)
    
    # All PIDs with their readings and status (including normal values)
    all_pid_readings: List[Dict[str, Any]] = Field(default_factory=list, description="All PIDs with values and status")
    
    # Recommendations
    diy_checklist: List[DIYChecklistItem] = Field(default_factory=list)
    maintenance_recommendation: MaintenanceRecommendation
    
    # Metadata
    chatbot_context: str = Field(default="")
    vehicle_info: Optional[Dict[str, Any]] = None
    analysis_metadata: Optional[Dict[str, Any]] = None
    user_friendly_report_ar: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Arabic UX report. May include pid_mechanical_interpretation when OPENAI_API_KEY is set.",
    )


class ChatResponse(BaseModel):
    """Response from chatbot"""
    report_id: str
    question: str
    answer: str = Field(..., description="Answer in Arabic or English")
    confidence: float = Field(0, ge=0, le=100)
    source: str = Field(default="AI", description="Source of answer: AI, KB, Fallback")
    timestamp: datetime = Field(default_factory=datetime.now)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(default="healthy")
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = Field(default="1.0.0")
    components: Dict[str, str] = Field(default_factory=dict)


# ========================
# INTERNAL MODELS
# ========================

class PIDAnalysisResult(BaseModel):
    """Internal result of PID analysis"""
    analyzed_pids: List[PIDReading]
    detected_anomalies: List[PIDAnomaly]
    system_scores: Dict[str, float]  # System name -> score (0-100)
    priority_issues: List[str]  # Ordered by severity
    overall_health: float = Field(0, ge=0, le=100)  # Overall health score
    dtc_diagnoses: Dict[str, Dict[str, str]] = Field(default_factory=dict)  # DTC code -> {name, description}


class KnowledgeBase(BaseModel):
    """Loaded knowledge base"""
    dtc_kb: Dict[str, Any]  # DTC knowledge base
    pid_kb: Dict[str, Any]  # PID knowledge base
    last_updated: datetime = Field(default_factory=datetime.now)


class LearningState(BaseModel):
    """State for adaptive learning"""
    pid_normal_ranges: Dict[str, Dict[str, float]]  # Updated ranges
    observed_dtc_patterns: Dict[str, int]  # DTC code -> count
    system_health_history: List[Dict[str, Any]]  # Historical scores (mix of timestamp str and numeric)
    last_updated: datetime = Field(default_factory=datetime.now)
    total_scans: int = Field(default=0)
    accuracy_score: float = Field(default=0, ge=0, le=100)
