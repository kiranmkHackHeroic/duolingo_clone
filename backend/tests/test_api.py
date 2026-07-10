from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "message": "Duolingo API is healthy"}

def test_unauthenticated_access():
    # Attempting to fetch path without token should return 401
    res = client.get("/api/path")
    assert res.status_code == 401

import uuid

def test_auth_flow_and_protected_access():
    username = f"tester_{uuid.uuid4().hex[:8]}"
    
    # Try registration
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "display_name": "API Tester",
            "password": "mypassword123"
        }
    )
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    assert reg_data["username"] == username

    # Try login with valid credentials
    login_res = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": "mypassword123"
        }
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # Verify invalid passwords are rejected
    bad_login_res = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": "wrongpassword"
        }
    )
    assert bad_login_res.status_code == 401

    # Fetch learning path using our JWT authorization header
    headers = {"Authorization": f"Bearer {token}"}
    path_res = client.get("/api/path", headers=headers)
    assert path_res.status_code == 200
    path_data = path_res.json()
    assert path_data["name"] == "Spanish"
    assert len(path_data["units"]) > 0

    # Verify answer evaluation endpoint
    res = client.post(
        "/api/exercises/1/answer",
        json={"answer": {"index": 0}},
        headers=headers
    )
    assert res.status_code == 200
    assert res.json()["correct"] is True

def test_courses_selection():
    import uuid
    username = f"course_tester_{uuid.uuid4().hex[:8]}"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "display_name": "Course Tester",
            "password": "mypassword123"
        }
    )
    assert reg_res.status_code == 200
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve lists of languages we support
    courses_res = client.get("/api/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) >= 3 # Spanish, French, German
    
    # Try selecting French as active language
    select_res = client.post(
        "/api/courses/select",
        json={"course_id": 2},
        headers=headers
    )
    assert select_res.status_code == 200
    progress = select_res.json()
    assert progress["active_course_id"] == 2

