"""
FastAPI app for tnabbah (تَنَبَّه) — vehicle diagnostics (OBD-II, knowledge bases).
"""

import os
import logging
import traceback
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uuid
from collections import OrderedDict

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from pathlib import Path
from .models import (
    AIReport, ScanRequest, HealthResponse,
    SeverityLevel, UrgencyLevel, MaintenanceRecommendation,
    DTCCode,
)
from .data_loader import DataLoader
from .engine.rules_engine import RulesEngine
from .obd_converter import OBDDataConverter
from .report_formatter import (
    format_user_report_ar,
    build_all_pid_readings_payload,
    pid_readings_for_mechanical_llm,
)
from .model_service import interpret_pid_mechanical_snapshot, interpret_dtc_snapshot
from .ai_service import recommend_action as ai_recommend_action

# Load environment variables from config folder
config_path = Path(__file__).parent.parent.parent / "config" / ".env"
load_dotenv(config_path)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========================
# GLOBAL STATE
# ========================

data_loader: Optional[DataLoader] = None
rules_engine: Optional[RulesEngine] = None
reports_storage: "OrderedDict[str, AIReport]" = OrderedDict()
learning_state: Optional[Dict] = None
DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "").strip()
REPORTS_MAX_SIZE = 100
REPORTS_TTL = timedelta(hours=1)

_allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = [o.strip() for o in _allowed_origins_raw.split(",") if o.strip()] if _allowed_origins_raw else []
ALLOW_ALL_ORIGINS = "*" in ALLOWED_ORIGINS

def _prune_reports_storage(now: Optional[datetime] = None) -> None:
    """Remove expired reports and enforce max storage size."""
    current_time = now or datetime.now()

    # Remove expired entries first.
    expired_ids = [
        report_id
        for report_id, report in reports_storage.items()
        if (current_time - report.timestamp) > REPORTS_TTL
    ]
    for report_id in expired_ids:
        reports_storage.pop(report_id, None)

    # Enforce max size by evicting oldest items first.
    while len(reports_storage) > REPORTS_MAX_SIZE:
        reports_storage.popitem(last=False)

# ========================
# LIFESPAN EVENTS
# ========================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan (startup and shutdown)"""
    global data_loader, rules_engine, learning_state
    
    # Startup
    logger.info("="*60)
    logger.info("تَنَبَّه diagnostics — Startup")
    logger.info("="*60)
    
    try:
        # Load data
        data_loader = DataLoader()
        kb = data_loader.load_knowledge_bases()
        learning_state = data_loader.load_learning_state()
        
        # Initialize rules engine
        rules_engine = RulesEngine(
            pid_kb=kb.pid_kb,
            dtc_kb=kb.dtc_kb,
        )
        
        logger.info("✅ All systems initialized successfully")
        logger.info("   - DataLoader: ✅")
        logger.info("   - RulesEngine: ✅")
        logger.info("   - LearningState: ✅")
        logger.info("="*60)
        
    except Exception as e:
        logger.error(f"❌ Startup error: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("تَنَبَّه diagnostics — Shutdown")

# ========================
# INITIALIZATION
# ========================

app = FastAPI(
    title="تَنَبَّه (tnabbah) — Diagnostics",
    description=(
        "OBD-II vehicle diagnostics: deterministic rules engine and local knowledge bases; "
        "optional OpenAI-enhanced narration when configured."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ========================
# HEALTH CHECK
# ========================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        components={
            "data_loader": "ready" if data_loader else "error",
            "rules_engine": "ready" if rules_engine else "error",
            "storage": "ready"
        }
    )


@app.get("/api/health", response_model=HealthResponse)
async def api_health_check():
    """Health check endpoint (API version)"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        components={
            "data_loader": "ready" if data_loader else "error",
            "rules_engine": "ready" if rules_engine else "error",
            "storage": "ready"
        }
    )


# ========================
# MAIN DIAGNOSTIC ENDPOINT
# ========================

@app.post("/api/scan", response_model=AIReport)
async def scan_vehicle(request: ScanRequest) -> AIReport:
    """
    Analyze vehicle data and generate diagnostic report
    
    Takes PIDs and DTCs as input, returns comprehensive diagnostic report
    """
    if not rules_engine or not data_loader:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        # Generate report ID
        report_id = str(uuid.uuid4())[:8]
        
        logger.info(f"📊 Starting scan analysis (ID: {report_id})")
        logger.info(f"   PIDs: {len(request.pids)}")
        logger.info(f"   DTCs: {len(request.dtcs)}")
        
        # Analyze PIDs with professional interpretation
        pid_analysis = rules_engine.analyze_pids(
            pids=request.pids,
            dtcs=request.dtcs if request.dtcs else [],
            learning_state=learning_state,
            vehicle_info=request.vehicle_info
        )
        
        # Suggest likely causes
        likely_causes = rules_engine.suggest_likely_causes(
            request.pids,
            request.dtcs,
            pid_analysis.detected_anomalies
        )
        
        # Generate DIY checklist
        diy_checklist = rules_engine.generate_diy_checklist(
            pid_analysis.detected_anomalies,
            request.dtcs
        )
        
        # Calculate overall severity
        severity = rules_engine.calculate_overall_severity(
            pid_analysis.system_scores,
            request.dtcs,
            pid_analysis.detected_anomalies,
        )
        
        # Generate maintenance recommendation
        maintenance_rec = rules_engine.generate_maintenance_recommendation(
            severity, likely_causes
        )
        
        # Generate drive advice
        drive_advice_map = {
            SeverityLevel.CRITICAL: "❌ خطر شديد — لا تقد السيارة؛ توقف فوراً وتوجه للورشة",
            SeverityLevel.HIGH: "⚠️  خطر — تجنب الطرق السريعة والقيادة الشديدة",
            SeverityLevel.MEDIUM: "ℹ️  تحذير — اطلب خدمة قريباً",
            SeverityLevel.LOW: "📋 تنبيه بسيط — راقب الوضع",
        }
        
        # Check if vehicle is healthy (no anomalies)
        is_vehicle_healthy = len(pid_analysis.detected_anomalies) == 0 and len(request.dtcs) == 0
        
        if is_vehicle_healthy:
            drive_advice = "✅ سيارتك سليمة ما فيها أعطال"
            # Clear DIY checklist for healthy vehicle
            diy_checklist = []
        else:
            drive_advice = drive_advice_map.get(severity, "اطلب خدمة")
        
        # Build list of all PID readings (including normal ones)
        all_pid_readings = build_all_pid_readings_payload(
            dict(request.pids),
            data_loader.pid_kb,
            pid_analysis.detected_anomalies,
        )
        
        def _category_display(dtc_key: str) -> str:
            raw_cat = data_loader.dtc_kb.get(dtc_key, {}).get("category")
            if isinstance(raw_cat, str) and raw_cat.strip():
                return raw_cat.strip().title()
            return "Other"

        user_friendly_report_ar = format_user_report_ar(
            list(request.dtcs),
            dict(request.pids),
            {
                "overall_severity": severity.value,
                "overall_health": float(pid_analysis.overall_health),
                "is_vehicle_healthy": is_vehicle_healthy,
                "anomaly_count": len(pid_analysis.detected_anomalies),
                "drive_advice": drive_advice,
                "dtc_kb": data_loader.dtc_kb,
                "detected_anomalies": pid_analysis.detected_anomalies,
            },
        )

        try:
            llm_readings = pid_readings_for_mechanical_llm(
                all_pid_readings, data_loader.pid_kb
            )
            mech = interpret_pid_mechanical_snapshot(
                llm_readings,
                list(request.dtcs),
                request.vehicle_info,
                dict(request.pids),
            )
            if mech:
                user_friendly_report_ar["pid_mechanical_interpretation"] = mech
        except Exception:
            logger.debug("تخطّي تفسير المستشعرات بالذكاء الاصطناعي", exc_info=True)

        # ── DTC AI interpretation (independent of the PID block above) ──
        # When DTCs are present we always explain them in the same friendly
        # Arabic style; the PID readings are passed in for correlation hints.
        try:
            if request.dtcs:
                dtc_payload: list = []
                for code in request.dtcs:
                    code_s = str(code or "").strip().upper()
                    if not code_s:
                        continue
                    entry = (data_loader.dtc_kb or {}).get(code_s) or {}
                    i18n_ar = (entry.get("i18n") or {}).get("ar") or {}
                    dtc_payload.append({
                        "code": code_s,
                        "name_ar": (
                            i18n_ar.get("title")
                            or entry.get("name_ar")
                            or entry.get("name")
                            or code_s
                        ),
                        "description_ar": (
                            i18n_ar.get("description")
                            or entry.get("description_ar")
                            or entry.get("description")
                            or ""
                        ),
                        "category": entry.get("category") or "",
                        "severity": entry.get("severity") or "",
                    })
                if dtc_payload:
                    dtc_mech = interpret_dtc_snapshot(
                        dtc_payload,
                        request.vehicle_info,
                        llm_readings,
                    )
                    if dtc_mech:
                        user_friendly_report_ar["dtc_mechanical_interpretation"] = dtc_mech
        except Exception:
            logger.debug("تخطّي تفسير الأكواد بالذكاء الاصطناعي", exc_info=True)

        # ── Holistic AI recommendation (PIDs + DTCs together) ──
        # Generates a single Arabic "التوصية: ..." sentence and a
        # `needs_mechanic` flag for the UI to surface a "see a mechanic" hint.
        try:
            rec_dtc_payload: list = []
            for code in (request.dtcs or []):
                code_s = str(code or "").strip().upper()
                if not code_s:
                    continue
                entry = (data_loader.dtc_kb or {}).get(code_s) or {}
                i18n_ar = (entry.get("i18n") or {}).get("ar") or {}
                rec_dtc_payload.append({
                    "code": code_s,
                    "name_ar": (
                        i18n_ar.get("title")
                        or entry.get("name_ar")
                        or entry.get("name")
                        or code_s
                    ),
                })
            ai_rec = ai_recommend_action(
                llm_readings,
                rec_dtc_payload,
                request.vehicle_info,
            )
            if ai_rec:
                user_friendly_report_ar["final_recommendation"] = ai_rec
        except Exception:
            logger.debug("تخطّي التوصية النهائية بالذكاء الاصطناعي", exc_info=True)

        # Create report
        report = AIReport(
            report_id=report_id,
            timestamp=datetime.now(),
            severity=severity,
            drive_advice=drive_advice,
            detected_anomalies=pid_analysis.detected_anomalies,
            all_pid_readings=all_pid_readings,
            detected_dtcs=[
                DTCCode(
                    code=dtc,
                    name=data_loader.dtc_kb.get(dtc, {}).get("name", dtc),
                    description=data_loader.dtc_kb.get(dtc, {}).get("description", ""),
                    severity=SeverityLevel[data_loader.dtc_kb.get(dtc, {}).get("severity", "MEDIUM")],
                    category=_category_display(dtc),
                )
                for dtc in request.dtcs
            ],
            likely_causes=likely_causes if not is_vehicle_healthy else [],
            diy_checklist=diy_checklist if not is_vehicle_healthy else [],
            maintenance_recommendation=maintenance_rec if not is_vehicle_healthy else MaintenanceRecommendation(
                action="استمر في الصيانة الدورية المنتظمة",
                urgency=UrgencyLevel.MONITOR,
                estimated_time_weeks=26,
                impact_if_ignored=None,
                preventive_measures=[
                    "غيّر زيت المحرك كل 10,000 كم",
                    "افحص فلتر الهواء كل 15,000 كم",
                    "افحص سائل التبريد كل شهر",
                    "افحص ضغط الإطارات كل أسبوعين"
                ]
            ),
            vehicle_info=request.vehicle_info,
            analysis_metadata={
                "system_scores": pid_analysis.system_scores,
                "overall_health": pid_analysis.overall_health,
                "is_vehicle_healthy": is_vehicle_healthy
            },
            user_friendly_report_ar=user_friendly_report_ar,
        )
        
        # Store report
        _prune_reports_storage()
        reports_storage[report_id] = report
        reports_storage.move_to_end(report_id, last=True)
        _prune_reports_storage()
        
        # Update learning state
        if learning_state is not None:
            severity_score = max(pid_analysis.system_scores.values()) if pid_analysis.system_scores else 0
            data_loader.update_learning_state(request.pids, severity_score)
        
        logger.info("✅ Scan completed successfully")
        logger.info(f"   Severity: {severity}")
        logger.info(f"   Anomalies: {len(pid_analysis.detected_anomalies)}")
        logger.info(f"   Causes: {len(likely_causes)}")
        
        return report
    
    except Exception:
        logger.error("❌ Scan error")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


# ========================
# REPORT RETRIEVAL
# ========================

@app.get("/api/reports/{report_id}", response_model=AIReport)
async def get_report(report_id: str) -> AIReport:
    """Retrieve a previously generated report"""
    _prune_reports_storage()
    if report_id not in reports_storage:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return reports_storage[report_id]


@app.get("/api/reports")
async def list_reports(limit: int = 10, offset: int = 0):
    """List all reports with pagination"""
    _prune_reports_storage()
    all_reports = list(reports_storage.items())
    all_reports.sort(key=lambda x: x[1].timestamp, reverse=True)
    
    return {
        "total": len(all_reports),
        "limit": limit,
        "offset": offset,
        "reports": [
            {
                "report_id": rid,
                "severity": report.severity,
                "timestamp": report.timestamp.isoformat()
            }
            for rid, report in all_reports[offset:offset+limit]
        ]
    }


# ========================
# OBD-II JSON ENDPOINT
# ========================

@app.post("/api/scan-obd-json", response_model=AIReport)
async def scan_obd_json(obd_data: Dict[str, Any]) -> AIReport:
    """
    Scan vehicle using raw OBD-II JSON data

    Accepts exported or recorded OBD-II JSON (mode01, dtcs, mode09, etc.)
    and converts it to the same analysis path as ``/api/scan``.
    
    Example input structure:
    {
        "mode01": {"values": [...]},
        "dtcs": {"stored": {...}, "pending": {...}, "permanent": {...}},
        "mode09": {...}
    }
    """
    if not rules_engine or not data_loader:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    try:
        logger.info("📊 Starting OBD-II JSON scan")
        
        # Convert OBD JSON to ScanRequest
        try:
            scan_request = OBDDataConverter.convert_obd_scan_to_request(obd_data)
        except Exception:
            logger.error("❌ OBD conversion error")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=400, detail="Invalid OBD data")
        
        # Sanitize PIDs
        if scan_request.pids:
            scan_request.pids = OBDDataConverter.sanitize_pids(
                scan_request.pids,
                data_loader.pid_kb
            )
        
        # Check for missing critical PIDs
        missing = OBDDataConverter.handle_missing_critical_pids(scan_request.pids)
        if missing:
            logger.warning(f"⚠️ Missing critical PIDs: {missing}")
        
        logger.info("✅ Converted to ScanRequest:")
        logger.info(f"   PIDs: {len(scan_request.pids)}")
        logger.info(f"   DTCs: {len(scan_request.dtcs)}")
        
        # Analyze using same endpoint
        return await scan_vehicle(scan_request)
    
    except HTTPException:
        raise
    except Exception:
        logger.error("❌ OBD scan error")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


# ========================
# INFORMATION ENDPOINTS
# ========================

@app.get("/api/dtc/{dtc_code}")
async def get_dtc_info(dtc_code: str):
    """Get information about a specific DTC"""
    if not data_loader:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    info = data_loader.get_dtc_info(dtc_code)
    if not info:
        raise HTTPException(status_code=404, detail="DTC not found")
    
    return {
        "code": dtc_code,
        "info": info
    }


@app.get("/api/pid/{pid_code}")
async def get_pid_info(pid_code: str):
    """Get information about a specific PID"""
    if not data_loader:
        raise HTTPException(status_code=503, detail="Service not ready")
    
    info = data_loader.get_pid_info(pid_code)
    if not info:
        raise HTTPException(status_code=404, detail="PID not found")
    
    return {
        "code": pid_code,
        "info": info
    }


# ========================
# UTILITY ENDPOINTS
# ========================

if DEBUG_MODE and ADMIN_TOKEN:
    @app.post("/api/debug/clear")
    async def debug_clear(x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token")):
        """Clear all stored reports (debug only, token protected)."""
        if x_admin_token != ADMIN_TOKEN:
            raise HTTPException(status_code=403, detail="Forbidden")
        reports_storage.clear()
        logger.info("🗑️  All reports cleared")
        return {"message": "All reports cleared"}
elif DEBUG_MODE and not ADMIN_TOKEN:
    logger.warning("⚠️ DEBUG_MODE=true but ADMIN_TOKEN is missing; /api/debug/clear is disabled.")


@app.get("/api/debug/stats")
async def debug_stats(
    x_admin_token: Optional[str] = Header(default=None, alias="X-Admin-Token"),
):
    """Get system statistics (admin token required to avoid info leakage)."""
    if not ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Admin endpoint disabled")
    if x_admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")
    if not learning_state:
        raise HTTPException(status_code=503, detail="Service not ready")

    # learning_state is a Pydantic LearningState model — use attribute access.
    pid_normal_ranges = getattr(learning_state, "pid_normal_ranges", {}) or {}
    severity_weights = {
        SeverityLevel.LOW: 10,
        SeverityLevel.MEDIUM: 40,
        SeverityLevel.HIGH: 70,
        SeverityLevel.CRITICAL: 100,
    }
    if reports_storage:
        worst_weight = max(
            severity_weights.get(r.severity, 0) for r in reports_storage.values()
        )
        system_health = 100 - worst_weight
    else:
        system_health = 100

    return {
        "total_scans": getattr(learning_state, "total_scans", 0),
        "total_reports": len(reports_storage),
        "learning_accuracy": getattr(learning_state, "accuracy_score", 0),
        "pid_count": len(pid_normal_ranges),
        "system_health": system_health,
    }


# ========================
# ERROR HANDLING
# ========================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )


# ========================
# ROOT ENDPOINT
# ========================

@app.get("/api/info")
async def api_info():
    """Machine-readable service info (was the old GET /)."""
    return {
        "name": "تَنَبَّه (tnabbah) diagnostics",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
        "endpoints": {
            "health": "/health",
            "scan": "/api/scan",
            "reports": "/api/reports",
            "docs": "/api/docs",
        },
    }


# ========================
# WEB UI (static SPA)
# ========================
# Serves the single-page HTML/JS frontend at "/" plus its assets at "/static/*".
# The web folder lives at the project root (../../../web from this file).

_WEB_DIR = Path(__file__).resolve().parents[2] / "web"

if _WEB_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=_WEB_DIR), name="static")

    @app.get("/", include_in_schema=False)
    async def root():
        """Serve the SPA shell."""
        index = _WEB_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(status_code=404, detail="UI not built")
else:
    logger.warning("⚠️  Web UI directory not found at %s — serving JSON root only.", _WEB_DIR)

    @app.get("/", include_in_schema=False)
    async def root():
        return await api_info()


# ========================
# REPORT MANAGEMENT (Supabase)
# ========================

from .supabase_client import get_supabase_manager

class SaveReportRequest(BaseModel):
    report_id: str = Field(..., description="Report ID from scan")
    user_id: str = Field(..., description="User UUID")
    is_permanent: bool = Field(default=False, description="Mark as permanently saved")
    expires_in_hours: int = Field(default=24, ge=1, le=720)


class RejectReportRequest(BaseModel):
    report_id: str = Field(..., description="Report ID")
    user_id: str = Field(..., description="User UUID")


class DeleteReportRequest(BaseModel):
    report_id: str = Field(..., description="Report ID")
    user_id: str = Field(..., description="User UUID")


@app.post("/api/save-report")
async def save_report_to_db(request: SaveReportRequest):
    """
    Save diagnostic report to Supabase database
    
    Called after user reviews report and clicks 'Save'
    """
    try:
        # Get report from in-memory storage
        if request.report_id not in reports_storage:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report = reports_storage[request.report_id]
        
        # Get Supabase manager
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            raise HTTPException(status_code=503, detail="Database not available")
        
        # Convert report to JSON-serializable format
        report_dict = report.model_dump(mode='json')
        
        # Save to database
        saved_id = await supabase.save_report(
            user_id=request.user_id,
            report_content=report_dict,
            is_permanently_saved=request.is_permanent,
            expires_in_hours=request.expires_in_hours
        )
        
        if not saved_id:
            raise HTTPException(status_code=500, detail="Failed to save report")
        
        logger.info(f"📊 Report saved to DB: {saved_id}")
        
        return {
            "success": True,
            "database_id": saved_id,
            "report_id": request.report_id,
            "status": "saved" if request.is_permanent else "pending"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/reject-report")
async def reject_report(request: RejectReportRequest):
    """Temporarily reject report (status: temp_rejected)"""
    try:
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            raise HTTPException(status_code=503, detail="Database not available")
        
        success = await supabase.reject_report(request.report_id, request.user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to reject report")
        
        logger.info(f"❌ Report rejected: {request.report_id}")
        
        return {
            "success": True,
            "report_id": request.report_id,
            "status": "temp_rejected"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error rejecting report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/delete-report")
async def delete_report_permanently(request: DeleteReportRequest):
    """Permanently delete report (status: deleted)"""
    try:
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            raise HTTPException(status_code=503, detail="Database not available")
        
        success = await supabase.permanently_delete(request.report_id, request.user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete report")
        
        logger.info(f"🗑️ Report permanently deleted: {request.report_id}")
        
        return {
            "success": True,
            "report_id": request.report_id,
            "status": "deleted"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting report: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/reports/saved/{user_id}")
async def get_saved_reports(user_id: str, limit: int = 50):
    """Get permanently saved reports for user"""
    try:
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            return {"reports": [], "message": "Database not available"}
        
        reports = await supabase.get_saved_reports(user_id, limit=limit)
        return {
            "reports": reports,
            "count": len(reports),
            "status": "saved"
        }
    except Exception as e:
        logger.error(f"❌ Error fetching saved reports: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/reports/pending/{user_id}")
async def get_pending_reports(user_id: str):
    """Get pending reports (temp storage, expires in 24h)"""
    try:
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            return {"reports": [], "message": "Database not available"}
        
        reports = await supabase.get_pending_reports(user_id)
        
        # Calculate expiry time for each
        now = datetime.now()
        for report in reports:
            created_at = datetime.fromisoformat(report.get("created_at"))
            expiry_at = datetime.fromisoformat(report.get("expiry_at"))
            time_left = (expiry_at - now).total_seconds() / 3600
            report["hours_until_expiry"] = max(0, time_left)
        
        return {
            "reports": reports,
            "count": len(reports),
            "status": "pending"
        }
    except Exception as e:
        logger.error(f"❌ Error fetching pending reports: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/reports/all/{user_id}")
async def get_all_user_reports(user_id: str):
    """Get all reports (saved, pending, rejected)"""
    try:
        supabase = get_supabase_manager()
        if not supabase or not supabase.is_ready():
            return {"reports": [], "message": "Database not available"}
        
        all_reports = await supabase.get_user_reports(user_id, limit=200)
        
        # Group by status
        saved = [r for r in all_reports if r.get("status") == "saved"]
        pending = [r for r in all_reports if r.get("status") == "pending"]
        rejected = [r for r in all_reports if r.get("status") == "temp_rejected"]
        
        return {
            "total": len(all_reports),
            "saved": {
                "count": len(saved),
                "reports": saved
            },
            "pending": {
                "count": len(pending),
                "reports": pending
            },
            "rejected": {
                "count": len(rejected),
                "reports": rejected
            }
        }
    except Exception as e:
        logger.error(f"❌ Error fetching all reports: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# ========================
# RUN
# ========================

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("FASTAPI_HOST", "0.0.0.0")
    # استخدم 8001 كالمنفذ الافتراضي
    port = int(os.getenv("FASTAPI_PORT", "8001"))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info("\n🚀 Starting FastAPI Server")
    logger.info(f"   Host: {host}")
    logger.info(f"   Port: {port}")
    logger.info(f"   Debug: {debug}\n")
    
    # تأكد من استخدام المنفذ الصحيح
    if port == 8000:
        logger.warning("⚠️  تم اكتشاف المنفذ 8000 - سيتم تغييره إلى 8001")
        port = 8001
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
