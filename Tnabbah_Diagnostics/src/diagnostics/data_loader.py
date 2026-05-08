"""
Data Loader for tnabbah diagnostics (knowledge bases and paths).
Loads knowledge bases from ``data/``.

The on-disk JSON files use the v2 clean schema (i18n blocks, canonical
service IDs, structured insights). To avoid touching the rest of the
engine / UI, this loader projects the legacy field aliases
(``description_ar``, ``repair_options``, ``insights`` as a dict, ...)
back onto each in-memory entry. New code should prefer the v2 fields
directly (``i18n.ar.title``, ``service_refs``, ``insights[]`` list).
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from .models import KnowledgeBase, LearningState

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_DISCLAIMER_AR = (
    "هذا تحليل عام بناءً على بيانات OBD-II. قد يختلف التشخيص حسب نوع السيارة وحالتها. "
    "استشر ميكانيكياً متخصصاً."
)


# ════════════════════════════════════════════════════════════════════════
# Legacy-shape projection helpers
# ────────────────────────────────────────────────────────────────────────
# These mutate each KB entry in place so the rest of the codebase
# (which still reads ``description_ar``, ``repair_options``,
# ``insights`` as a dict, etc.) keeps working against the v2 schema.
# ════════════════════════════════════════════════════════════════════════

def _project_dtc_legacy_fields(entry: Dict[str, Any]) -> None:
    """
    Add legacy aliases to a v2 DTC entry so the existing engine and UI
    code can read it without changes.

    Rebuilds (in-memory only):
      - description_ar / description_en / description / name
      - drive_safety_ar / drive_safety
      - maintenance_recommendation_ar / maintenance_recommendation
      - possible_causes_ar (list of Arabic strings)
      - symptoms_ar (list of Arabic strings)
      - common_causes (legacy [{cause, likelihood}, ...])
      - repair_options (from service_refs; numeric fields kept for legacy shape)
      - diagnostic_steps (list of Arabic strings, no order objects)
      - related_systems / diy_checklist (empty defaults)
      - disclaimer_ar
    """
    if not isinstance(entry, dict):
        return

    i18n = entry.get("i18n") or {}
    ar   = (i18n.get("ar") or {}) if isinstance(i18n, dict) else {}
    en   = (i18n.get("en") or {}) if isinstance(i18n, dict) else {}

    entry.setdefault("description_ar", ar.get("description") or ar.get("title") or "")
    entry.setdefault("description_en", en.get("description") or en.get("title") or "")
    entry.setdefault("description",    entry["description_ar"])
    entry.setdefault("name",           en.get("title") or entry.get("code") or "")
    entry.setdefault("drive_safety_ar", ar.get("drive_safety") or "")
    entry.setdefault("drive_safety",    entry["drive_safety_ar"])
    entry.setdefault("maintenance_recommendation_ar",
                     ar.get("maintenance_recommendation") or "")
    entry.setdefault("maintenance_recommendation",
                     entry["maintenance_recommendation_ar"])
    entry.setdefault("disclaimer_ar",
                     ar.get("disclaimer") or DEFAULT_DISCLAIMER_AR)

    # Causes — both legacy shapes
    causes_v2 = entry.get("common_causes") or []
    if causes_v2 and isinstance(causes_v2[0], dict) and "ar" in causes_v2[0]:
        # v2 shape -> rebuild legacy mirrors
        entry["possible_causes_ar"] = [c.get("ar", "") for c in causes_v2 if c.get("ar")]
        # Engine still reads common_causes[*]['cause'] — patch in place
        # (we keep the v2 fields too: id, en remain on the dict)
        for c in causes_v2:
            c.setdefault("cause", c.get("ar", ""))
    else:
        entry.setdefault("possible_causes_ar", [])

    # Symptoms
    symptoms_v2 = entry.get("symptoms") or []
    if symptoms_v2 and isinstance(symptoms_v2[0], dict) and "ar" in symptoms_v2[0]:
        entry["symptoms_ar"] = [s.get("ar", "") for s in symptoms_v2 if s.get("ar")]
    else:
        entry.setdefault("symptoms_ar", [])

    # Diagnostic steps -> legacy list of Arabic strings
    steps_v2 = entry.get("diagnostic_steps") or []
    if steps_v2 and isinstance(steps_v2[0], dict):
        entry["diagnostic_steps"] = [
            s.get("ar", "") for s in steps_v2 if isinstance(s, dict) and s.get("ar")
        ]

    # Repair options from service_refs (legacy dict shape retained).
    refs = entry.get("service_refs") or []
    repair_options = []
    if isinstance(refs, list):
        for sid in refs:
            if isinstance(sid, dict):
                sid_val = sid.get("id") or sid.get("service_id") or ""
            else:
                sid_val = sid
            sid_str = str(sid_val).strip()
            if not sid_str:
                continue
            repair_options.append({
                "service": sid_str,
                "labor": 0,
                "parts_min": 0,
                "parts_max": 0,
                "duration_hours": 0,
            })
    entry["repair_options"] = repair_options

    # Empty defaults still expected by some legacy consumers
    entry.setdefault("related_systems", [])
    entry.setdefault("diy_checklist",  [])


def _project_pid_legacy_fields(entry: Dict[str, Any]) -> None:
    """
    Add legacy aliases to a v2 PID entry so the existing engine and UI
    code can read it without changes.

    Rebuilds (in-memory only):
      - description / professional_explanation (Arabic)
      - normal_range / warning_range / critical_range (flat dicts)
      - insights as a {key: message} dict (engine + UI both read this)
    """
    if not isinstance(entry, dict):
        return

    i18n = entry.get("i18n") or {}
    ar   = (i18n.get("ar") or {}) if isinstance(i18n, dict) else {}

    entry.setdefault("description",              ar.get("description") or "")
    entry.setdefault("professional_explanation", ar.get("professional_explanation") or "")

    # Numeric thresholds -> flat *_range fields (engine reads these directly)
    thresholds = entry.get("thresholds") or {}
    default    = (thresholds.get("default") or {}) if isinstance(thresholds, dict) else {}
    if "normal_range"   not in entry: entry["normal_range"]   = default.get("normal")   or {}
    if "warning_range"  not in entry: entry["warning_range"]  = default.get("warning")  or {}
    if "critical_range" not in entry: entry["critical_range"] = default.get("critical") or {}

    # Insights — engine + UI consume a {key: text} dict. The v2 schema
    # uses an ordered list so we can have typed rules, but we still
    # surface the Arabic message keyed by the legacy id.
    insights_v2 = entry.get("insights")
    if isinstance(insights_v2, list):
        legacy_dict: Dict[str, str] = {}
        for ins in insights_v2:
            if not isinstance(ins, dict):
                continue
            key = ins.get("id") or ""
            txt = ins.get("ar") or ins.get("en") or ""
            if key and txt:
                legacy_dict[key] = txt
        # Stash the structured list under a non-clashing key so future
        # rule-engine code can use it.
        entry["insights_v2"] = insights_v2
        entry["insights"]    = legacy_dict
    elif insights_v2 is None:
        entry["insights"] = {}


def _project_legacy_aliases(dtc_kb: Dict[str, Any], pid_kb: Dict[str, Any]) -> None:
    """Walk every entry once and add legacy aliases in place."""
    if isinstance(dtc_kb, dict):
        for entry in dtc_kb.values():
            _project_dtc_legacy_fields(entry)
    if isinstance(pid_kb, dict):
        for entry in pid_kb.values():
            _project_pid_legacy_fields(entry)


class DataLoader:
    """Loads knowledge bases from JSON under ``data/``."""
    
    def __init__(self, base_path: str = None):
        """
        Initialize DataLoader
        
        Args:
            base_path: Path to data directory (defaults to project_root/data,
                      or TNABBAH_DATA_PATH / legacy AI_ENGINE_DATA_PATH env)
        """
        if base_path is None:
            env_data_path = (
                os.getenv("TNABBAH_DATA_PATH", "").strip()
                or os.getenv("AI_ENGINE_DATA_PATH", "").strip()
            )
            if env_data_path:
                base_path = Path(env_data_path)
            else:
                # src/diagnostics/data_loader.py -> project_root/data
                base_path = Path(__file__).resolve().parents[2] / "data"
        
        self.base_path = Path(base_path).resolve()
        self.dtc_kb = None
        self.pid_kb = None
        self.learning_state = None
        
        logger.info(f"DataLoader initialized with base path: {self.base_path}")
    
    # ========================
    # FILE LOADING METHODS
    # ========================
    
    def load_json_file(self, filename: str) -> Dict[str, Any]:
        """Load JSON file from data directory"""
        filepath = self.base_path / filename
        
        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            return {}
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            logger.info(f"✅ Loaded {filename}")
            return data
        except Exception as e:
            logger.error(f"❌ Error loading {filename}: {e}")
            return {}
    
    def load_knowledge_bases(self) -> KnowledgeBase:
        """Load all knowledge bases (v2 schema) and project legacy aliases."""
        self.dtc_kb = self.load_json_file("dtc_knowledge_base.json")
        self.pid_kb = self.load_json_file("pid_knowledge_base.json")

        # The on-disk JSON is the v2 clean schema. The rest of the engine
        # and UI still read legacy field names (description_ar,
        # repair_options, insights as a dict, ...). Project those aliases
        # in memory so nothing else has to change.
        _project_legacy_aliases(self.dtc_kb, self.pid_kb)

        kb = KnowledgeBase(
            dtc_kb=self.dtc_kb,
            pid_kb=self.pid_kb,
        )

        logger.info("📚 Knowledge Bases Loaded (schema v2):")
        logger.info(f"   - DTCs: {len(self.dtc_kb)} codes")
        logger.info(f"   - PIDs: {len(self.pid_kb)} parameters")

        return kb
    
    # ========================
    # LEARNING STATE
    # ========================
    
    def load_learning_state(self) -> LearningState:
        """Load adaptive learning state"""
        # Initialize with PID ranges from knowledge base
        pid_normal_ranges = {}
        
        if self.pid_kb:
            for pid_code, pid_info in self.pid_kb.items():
                normal_range = pid_info.get("normal_range", {})
                if normal_range:
                    pid_normal_ranges[pid_code] = {
                        "min": normal_range.get("min", 0),
                        "max": normal_range.get("max", 100)
                    }
        
        self.learning_state = LearningState(
            pid_normal_ranges=pid_normal_ranges,
            observed_dtc_patterns={},
            system_health_history=[]
        )
        
        logger.info(f"📚 Learning state initialized with {len(pid_normal_ranges)} PIDs")
        return self.learning_state
    
    def update_learning_state(self, pids: Dict[str, float], severity_score: float):
        """Update learning state based on new scan"""
        if not self.learning_state:
            return
        
        # Update total scans
        self.learning_state.total_scans += 1
        
        # Update health history
        self.learning_state.system_health_history.append({
            "timestamp": datetime.now().isoformat(),
            "health_score": 100 - severity_score
        })
        
        # Update PID ranges based on observed values
        for pid_code, value in pids.items():
            if pid_code in self.learning_state.pid_normal_ranges:
                current_range = self.learning_state.pid_normal_ranges[pid_code]
                
                # Slightly expand range if value is outside but reasonable
                if value < current_range["min"] * 0.8:
                    current_range["min"] = min(current_range["min"], value * 0.95)
                elif value > current_range["max"] * 1.2:
                    current_range["max"] = max(current_range["max"], value * 1.05)
        
        logger.debug(f"✅ Learning state updated (scan #{self.learning_state.total_scans})")
    
    # ========================
    # UTILITY METHODS
    # ========================
    
    def get_pid_info(self, pid_code: str) -> Optional[Dict]:
        """Get information about a specific PID"""
        if not self.pid_kb:
            self.load_knowledge_bases()
        
        return self.pid_kb.get(pid_code)
    
    def get_dtc_info(self, dtc_code: str) -> Optional[Dict]:
        """Get information about a specific DTC"""
        if not self.dtc_kb:
            self.load_knowledge_bases()
        
        return self.dtc_kb.get(dtc_code)
