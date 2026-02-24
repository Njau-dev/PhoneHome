def test_metrics_endpoint_exposes_prometheus_metrics(client):
    client.get("/health")

    response = client.get("/metrics")

    assert response.status_code == 200
    assert response.headers["Content-Type"].startswith("text/plain")

    body = response.get_data(as_text=True)
    assert "flask_http_request_total" in body
    assert "flask_http_request_duration_seconds" in body
    assert 'endpoint="/health"' in body
