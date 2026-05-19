import asyncio

from httpx import ASGITransport, AsyncClient

import src.diagnostics.main as main
from src.diagnostics.data_loader import DataLoader
from src.diagnostics.engine.rules_engine import RulesEngine


def test_api_scan_returns_200_for_valid_payload():
    async def _run():
        # Initialize app globals for test runs where lifespan isn't auto-invoked.
        loader = DataLoader()
        kb = loader.load_knowledge_bases()
        main.data_loader = loader
        main.learning_state = loader.load_learning_state()
        main.rules_engine = RulesEngine(pid_kb=kb.pid_kb, dtc_kb=kb.dtc_kb)

        transport = ASGITransport(app=main.app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            payload = {
                "pids": {"0x0C": 800.0, "0x05": 90.0, "0x42": 13.2},
                "dtcs": [],
                "vehicle_info": {"make": "Toyota", "model": "Corolla"},
            }
            response = await client.post("/api/scan", json=payload)
            assert response.status_code == 200
            data = response.json()
            assert "report_id" in data
            ufr = data.get("user_friendly_report_ar")
            assert isinstance(ufr, dict)
            assert ufr.get("title")
            assert "disclaimer" in ufr
            assert ufr.get("issues") == []
            assert ufr.get("overall_health_percent") == 100
            assert "ممتازة" in (ufr.get("overall_health") or "")

    asyncio.run(_run())
