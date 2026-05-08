from fastapi import FastAPI


def test_import_fastapi_app_smoke():
    from src.diagnostics.main import app

    assert isinstance(app, FastAPI)
