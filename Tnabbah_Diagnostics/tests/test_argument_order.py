from src.diagnostics.data_loader import DataLoader
from src.diagnostics.engine.rules_engine import RulesEngine


def test_rules_engine_accepts_keyword_arguments():
    loader = DataLoader()
    kb = loader.load_knowledge_bases()

    engine = RulesEngine(
        pid_kb=kb.pid_kb,
        dtc_kb=kb.dtc_kb,
    )

    assert engine.pid_kb is kb.pid_kb
    assert engine.dtc_kb is kb.dtc_kb


def test_analyze_pids_accepts_keyword_arguments():
    loader = DataLoader()
    kb = loader.load_knowledge_bases()
    engine = RulesEngine(pid_kb=kb.pid_kb, dtc_kb=kb.dtc_kb)

    result = engine.analyze_pids(
        pids={"0x0C": 800.0},
        dtcs=[],
        learning_state={},
        vehicle_info={"make": "Toyota"},
    )

    assert result is not None
    assert isinstance(result.system_scores, dict)
