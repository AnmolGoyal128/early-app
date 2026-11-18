"""
Test suite for GET /health endpoint (Feature F16).
"""


def test_health_check_status_code(client):
    """Asserts GET /health returns HTTP 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_check_payload_structure(client):
    """Asserts GET /health returns required fields and active parsers."""
    response = client.get("/health")
    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "early-ocr-service"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data

    # Verify all 5 panels are listed as active
    active = data["activeParsers"]
    for panel in ["CBC", "LIPID", "METABOLIC", "HBA1C", "THYROID", "VITALS"]:
        assert panel in active


def test_health_check_method_not_allowed(client):
    """Asserts POST /health returns 405 Method Not Allowed."""
    response = client.post("/health", json={})
    assert response.status_code == 405
