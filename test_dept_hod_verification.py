import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fastapi.testclient import TestClient
from rgit_app.main import app
from rgit_app.database import get_db, SessionLocal
from rgit_app.models import User, StudentRegistrationRequest, StudentProfile

import base64
from pathlib import Path

def get_valid_face_b64():
    sample_img_path = Path(__file__).parent / "backend" / "dataset" / "1RG21CS001.jpg"
    with open(sample_img_path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")

client = TestClient(app)

def test_dept_hod_verification_flow():
    print("\n--- 1. Testing Registration of 1st Semester EC Student ---")
    ec_payload = {
        "usn": "1RG24EC777",
        "full_name": "Rohan Sharma",
        "email": "rohan.ec@rgit.ac.in",
        "phone": "9845999777",
        "department": "B.E in Electronics and Communication Engineering",
        "semester": 1,
        "section": "A",
        "password": "password123",
        "photo_base64": get_valid_face_b64()
    }
    
    # Clean up any existing test record
    db = SessionLocal()
    try:
        db.query(StudentRegistrationRequest).filter(StudentRegistrationRequest.usn == "1RG24EC777").delete()
        db.query(StudentProfile).filter(StudentProfile.usn == "1RG24EC777").delete()
        db.query(User).filter(User.username == "1RG24EC777").delete()
        db.query(User).filter(User.phone == "+91 9845999777").delete()
        db.commit()
    finally:
        db.close()

    reg_res = client.post("/api/register/submit-form", json=ec_payload)
    print("Submit status:", reg_res.status_code, reg_res.json())
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    req_id = reg_res.json()["request_id"]
    print(f"Registered EC student with request ID: {req_id}")

    print("\n--- 2. Student Attempts Login Before HOD Approval ---")
    login_res = client.post("/api/auth/login", json={"username": "1RG24EC777", "password": "password123"})
    print("Login before approval:", login_res.status_code, login_res.json())
    assert login_res.status_code in [401, 403], "Student should not be able to log in before approval"
    assert "HOD" in login_res.json().get("detail", ""), "Login error should mention HOD approval required"

    print("\n--- 3. Check Student Registration Status Endpoint ---")
    status_res = client.get("/api/register/check-status/1RG24EC777")
    print("Check status:", status_res.status_code, status_res.json())
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PENDING"
    assert "Dr. Sunitha K" in status_res.json().get("hod_name", "") or "ECE" in status_res.json().get("hod_name", "") or "Head of Department" in status_res.json().get("message", "")

    print("\n--- 4. Authenticate as CSE HOD (hod_cse) ---")
    cse_login = client.post("/api/auth/login", json={"username": "hod_cse", "password": "arudra123"})
    assert cse_login.status_code == 200, f"CSE HOD login failed: {cse_login.text}"
    cse_token = cse_login.json()["access_token"]
    cse_headers = {"Authorization": f"Bearer {cse_token}"}

    print("\n--- 5. CSE HOD attempts to view pending list (EC student should be excluded) ---")
    cse_pending = client.get("/api/register/pending-list", headers=cse_headers)
    assert cse_pending.status_code == 200
    cse_items = cse_pending.json()
    ec_in_cse = any(r["usn"] == "1RG24EC777" for r in cse_items)
    print(f"Is EC student visible to CSE HOD pending list? {ec_in_cse} (Expected: False)")
    assert not ec_in_cse, "CSE HOD must NOT see EC department applicants"

    print("\n--- 6. CSE HOD attempts to APPROVE EC student (Must return 403 Forbidden) ---")
    cse_action = client.post(f"/api/register/{req_id}/action", json={"action": "APPROVE"}, headers=cse_headers)
    print("CSE HOD approve attempt:", cse_action.status_code, cse_action.json())
    assert cse_action.status_code == 403, f"Expected 403 Forbidden for cross-department action, got {cse_action.status_code}"
    assert "Authority Violation" in cse_action.json().get("detail", "") or "Access Denied" in cse_action.json().get("detail", "")

    print("\n--- 7. Authenticate as ECE HOD (hod_ece) ---")
    ece_login = client.post("/api/auth/login", json={"username": "hod_ece", "password": "hod123"})
    assert ece_login.status_code == 200, f"ECE HOD login failed: {ece_login.text}"
    ece_token = ece_login.json()["access_token"]
    ece_headers = {"Authorization": f"Bearer {ece_token}"}

    print("\n--- 8. ECE HOD views pending list (EC student MUST be present) ---")
    ece_pending = client.get("/api/register/pending-list", headers=ece_headers)
    assert ece_pending.status_code == 200
    ece_items = ece_pending.json()
    ec_in_ece = any(r["usn"] == "1RG24EC777" for r in ece_items)
    print(f"Is EC student visible to ECE HOD pending list? {ec_in_ece} (Expected: True)")
    assert ec_in_ece, "ECE HOD must see EC department applicants"

    print("\n--- 9. ECE HOD APPROVES 1st Semester EC Student ---")
    ece_action = client.post(f"/api/register/{req_id}/action", json={"action": "APPROVE"}, headers=ece_headers)
    print("ECE HOD approve result:", ece_action.status_code, ece_action.json())
    assert ece_action.status_code == 200, f"ECE HOD approval failed: {ece_action.text}"
    assert ece_action.json()["status"] == "APPROVED"

    print("\n--- 10. Student Logs In After ECE HOD Approval ---")
    approved_login = client.post("/api/auth/login", json={"username": "1RG24EC777", "password": "password123"})
    print("Login after approval:", approved_login.status_code, approved_login.json())
    assert approved_login.status_code == 200, f"Student should be able to log in after approval: {approved_login.text}"
    assert "access_token" in approved_login.json()
    print("Successfully logged in as approved student! Token received.")

    print("\n--- 11. Testing Rejection Flow for EC Student ---")
    ec_reject_payload = {
        "usn": "1RG24EC888",
        "full_name": "Suresh Patel",
        "email": "suresh.ec@rgit.ac.in",
        "phone": "9876543211",
        "department": "B.E in Electronics and Communication Engineering",
        "semester": 1,
        "section": "B",
        "password": "password123",
        "photo_base64": get_valid_face_b64()
    }
    reg_rej_res = client.post("/api/register/submit-form", json=ec_reject_payload)
    assert reg_rej_res.status_code == 200
    rej_req_id = reg_rej_res.json()["request_id"]

    # ECE HOD rejects with specific reason
    reject_reason = "Passport photo resolution too low; please upload clear VTU admission photo."
    rej_action = client.post(
        f"/api/register/{rej_req_id}/action",
        json={"action": "REJECT", "rejection_reason": reject_reason},
        headers=ece_headers
    )
    assert rej_action.status_code == 200
    assert rej_action.json()["status"] == "REJECTED"

    # Student tries to log in -> blocked with rejection note
    rej_login = client.post("/api/auth/login", json={"username": "1RG24EC888", "password": "password123"})
    assert rej_login.status_code == 403
    assert "Passport photo resolution too low" in rej_login.json()["detail"]
    print("Rejected student login correctly displays HOD rejection note:", rej_login.json()["detail"])

    # Clean up both test students
    db = SessionLocal()
    try:
        db.query(StudentRegistrationRequest).filter(StudentRegistrationRequest.usn.in_(["1RG24EC777", "1RG24EC888"])).delete(synchronize_session=False)
        db.query(StudentProfile).filter(StudentProfile.usn.in_(["1RG24EC777", "1RG24EC888"])).delete(synchronize_session=False)
        db.query(User).filter(User.username.in_(["1RG24EC777", "1RG24EC888"])).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    print("\n>>> EC / ECE DEPARTMENT TESTS (APPROVAL & REJECTION FLOWS) PASSED! <<<")

def test_all_departments_isolation():
    print("\n=======================================================")
    print("Testing Department HOD Authority Isolation Across All Departments")
    print("=======================================================")
    
    test_depts = [
        ("EE", "1RG24EE901", "B.E in Electrical Engineering", "hod_ee", "hod123", "hod_ece", "hod123", "9876543221"),
        ("ME", "1RG24ME901", "B.E in Mechanical Engineering", "hod_me", "hod123", "hod_cse", "arudra123", "9876543222"),
        ("CSE", "1RG24CS901", "B.E in Computer Science and Engineering", "hod_cse", "arudra123", "hod_ece", "hod123", "9876543223"),
        ("ISE", "1RG24IS901", "B.E in Information Science & Engineering", "hod_ise", "hod123", "hod_cse", "arudra123", "9876543224"),
        ("BME", "1RG24BM901", "B.E in Bio-Medical Engineering", "hod_bme", "hod123", "hod_ece", "hod123", "9876543225"),
        ("AIML", "1RG24AI901", "B.E in Artificial Intelligence & Machine Learning", "hod_aiml", "hod123", "hod_cse", "arudra123", "9876543226"),
        ("CSE_AI", "1RG24CA901", "B.E in Computer Science & Engineering (Artificial Intelligence)", "hod_cse_ai", "hod123", "hod_ee", "hod123", "9876543227"),
        ("CSE_IOT", "1RG24CI901", "B.E in Computer Science & Engineering (Internet of things Cyber Security with Blockchain Technology)", "hod_cse_iot", "hod123", "hod_me", "hod123", "9876543228"),
    ]

    # Pre-clean any leftover
    usns = [item[1] for item in test_depts]
    db = SessionLocal()
    try:
        db.query(StudentRegistrationRequest).filter(StudentRegistrationRequest.usn.in_(usns)).delete(synchronize_session=False)
        db.query(StudentProfile).filter(StudentProfile.usn.in_(usns)).delete(synchronize_session=False)
        db.query(User).filter(User.username.in_(usns)).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    for code, usn, dept_name, target_hod, target_pwd, unauth_hod, unauth_pwd, phone in test_depts:
        # 1. Register student
        payload = {
            "usn": usn,
            "full_name": f"Student {code}",
            "email": f"{usn.lower()}@rgit.ac.in",
            "phone": phone,
            "department": dept_name,
            "semester": 1,
            "section": "A",
            "password": "password123",
            "photo_base64": get_valid_face_b64()
        }
        reg = client.post("/api/register/submit-form", json=payload)
        assert reg.status_code == 200, f"Submit failed for {code}: {reg.text}"
        req_id = reg.json()["request_id"]

        # 2. Unauthorized HOD attempts approval -> MUST be 403 Forbidden
        u_login = client.post("/api/auth/login", json={"username": unauth_hod, "password": unauth_pwd})
        assert u_login.status_code == 200, f"Login failed for {unauth_hod}"
        u_token = u_login.json()["access_token"]
        u_act = client.post(f"/api/register/{req_id}/action", json={"action": "APPROVE"}, headers={"Authorization": f"Bearer {u_token}"})
        assert u_act.status_code == 403, f"Expected 403 Forbidden for {unauth_hod} approving {code}, got {u_act.status_code}"

        # 3. Authorized HOD approves -> MUST be 200 OK
        a_login = client.post("/api/auth/login", json={"username": target_hod, "password": target_pwd})
        assert a_login.status_code == 200, f"Login failed for {target_hod}"
        a_token = a_login.json()["access_token"]
        a_act = client.post(f"/api/register/{req_id}/action", json={"action": "APPROVE"}, headers={"Authorization": f"Bearer {a_token}"})
        assert a_act.status_code == 200, f"Expected 200 OK for {target_hod} approving {code}, got {a_act.status_code}"

        print(f"  [PASS] {code} Department (1st Sem): Blocked for {unauth_hod} (403 Forbidden) - Exclusively Approved by {target_hod} (200 OK)")

    # Clean up all created test users and registration requests
    usns = [item[1] for item in test_depts]
    db = SessionLocal()
    try:
        db.query(StudentRegistrationRequest).filter(StudentRegistrationRequest.usn.in_(usns)).delete(synchronize_session=False)
        db.query(StudentProfile).filter(StudentProfile.usn.in_(usns)).delete(synchronize_session=False)
        db.query(User).filter(User.username.in_(usns)).delete(synchronize_session=False)
        db.commit()
    finally:
        db.close()

    print("\n>>> ALL 9 DEPARTMENTS STRICTLY ENFORCE EXCLUSIVE HOD VERIFICATION! <<<")

if __name__ == "__main__":
    test_dept_hod_verification_flow()
    test_all_departments_isolation()

