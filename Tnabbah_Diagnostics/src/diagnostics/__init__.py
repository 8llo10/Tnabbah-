"""
tnabbah (تَنَبَّه) — vehicle diagnostics: FastAPI surface, rule engine, and local knowledge bases.
"""

__version__ = "1.0.0"
__author__ = "tnabbah"

# Lazy imports - loaded when needed to avoid circular import issues

__all__ = [
    "AIReport", "ScanRequest", "ChatRequest", "ChatResponse",
    "SeverityLevel", "UrgencyLevel",
    "DataLoader",
    "RulesEngine",
]
