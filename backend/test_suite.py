import sys
from pathlib import Path
from fastapi.testclient import TestClient

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from rgit_app.main import app
from rgit_app.config import RGIT_LATITUDE, RGIT_LONGITUDE
from rgit_app.database import get_db
from rgit_app.models import User, StudentRegistrationRequest

client = TestClient(app)

def test_all():
    print("=========================================================")
    print("   RUNNING RGIT AI SMART ATTENDANCE COMPREHENSIVE TESTS   ")
    print("=========================================================")

    # 1. Test Authentication
    print("\n[TEST 1] Testing Authentication...")
    
    # 1a. Admin login
    res = client.post("/api/auth/login", json={"username": "arudra", "password": "arudra123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    print("  ✓ Admin login successful")

    # 1b. Faculty login
    res = client.post("/api/auth/login", json={"username": "faculty1", "password": "faculty123"})
    assert res.status_code == 200, f"Faculty login failed: {res.text}"
    faculty_token = res.json()["access_token"]
    print("  ✓ Faculty login successful")

    # 1c. Student login with device UUID binding
    res = client.post("/api/auth/login", json={
        "username": "1RG21CS001",
        "password": "student123",
        "device_uuid": "TEST_DEVICE_PHONE_AAKASH"
    })
    assert res.status_code == 200, f"Student login failed: {res.text}"
    student_token = res.json()["access_token"]
    print("  ✓ Student login with device binding successful")

    # 1d. Invalid credentials
    res = client.post("/api/auth/login", json={"username": "arudra", "password": "wrongpassword"})
    assert res.status_code == 401, "Expected 401 for wrong password"
    print("  ✓ Invalid password rejected with 401")

    # 2. Test Geofence
    print("\n[TEST 2] Testing Geofence Engine...")
    
    # 2a. Inside RGIT campus
    res = client.get(f"/api/geofence/status?lat={RGIT_LATITUDE}&lon={RGIT_LONGITUDE}&accuracy=10")
    assert res.status_code == 200
    data = res.json()
    assert data["is_inside"] == True
    print(f"  ✓ Center coords verified: {data['distance_meters']}m from center (Inside: True)")

    # 2b. Outside RGIT campus
    res = client.get(f"/api/geofence/status?lat={RGIT_LATITUDE + 0.005}&lon={RGIT_LONGITUDE + 0.005}&accuracy=10")
    assert res.status_code == 200
    data = res.json()
    assert data["is_inside"] == False
    print(f"  ✓ Off-campus coords verified: {data['distance_meters']}m from center (Inside: False)")

    # 2c. Mock location rejection
    res = client.get(f"/api/geofence/status?lat={RGIT_LATITUDE}&lon={RGIT_LONGITUDE}&accuracy=10&is_mock=true")
    assert res.status_code == 200
    data = res.json()
    assert data["is_inside"] == False
    assert "mock" in data["message"].lower() or "fake" in data["message"].lower()
    print("  [PASS] Mock GPS signal successfully detected and rejected")

    # 3. Test Timetable & Faculty Sessions
    print("\n[TEST 3] Testing Academic Timetable & Active Class Sessions...")
    
    # 3a. Current timetable
    res = client.get("/api/timetable/current")
    assert res.status_code == 200
    tt_data = res.json()
    assert "period_info" in tt_data
    print(f"  ✓ Timetable info resolved: {tt_data['period_info']['label']}")

    # 3b. Faculty starts active session
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}
    res = client.post("/api/sessions/start", headers=faculty_headers, json={
        "subject_code": "BCS701",
        "section": "A",
        "period_number": 1,
        "duration_minutes": 15
    })
    assert res.status_code == 200, f"Start session failed: {res.text}"
    session_data = res.json()
    session_code = session_data["session_code"]
    print(f"  ✓ Faculty active session created: Code={session_code}, Subject={session_data['subject_name']}")

    # 3c. Query active session
    res = client.get("/api/sessions/active?section=A")
    assert res.status_code == 200
    active_res = res.json()
    assert active_res["active"] == True
    assert active_res["session"]["session_code"] == session_code
    print(f"  ✓ Active session found for Section A: Code={session_code}")

    # 4. Test Defaulters & Roster
    print("\n[TEST 4] Testing Attendance Defaulters & Student Roster...")
    
    # 4a. Defaulters calculation (<75%)
    res = client.get("/api/attendance/defaulters?section=A", headers=faculty_headers)
    assert res.status_code == 200
    defaulters = res.json()
    assert len(defaulters) > 0
    print(f"  ✓ Defaulters calculated for Section A: {len(defaulters)} students tracked")
    for d in defaulters:
        print(f"    - {d['usn']} ({d['full_name']}): {d['attendance_percentage']}% [Defaulter: {d['is_defaulter']}]")

    # 4b. Student roster
    res = client.get("/api/students/list?section=A", headers=faculty_headers)
    assert res.status_code == 200
    roster = res.json()
    assert len(roster) > 0
    print(f"  ✓ Student roster retrieved: {len(roster)} students in Section A")

    # 5. Test Admin Dashboard & Security Logs
    print("\n[TEST 5] Testing Admin Dashboard & Security Audit Logs...")
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.get("/api/dashboard/stats", headers=admin_headers)
    assert res.status_code == 200
    stats = res.json()
    print(f"  ✓ Stats: {stats['total_students']} Students, {stats['total_records']} Records, Radius={stats['geofence_radius_meters']}m")

    res = client.get("/api/audit-logs", headers=admin_headers)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    print(f"  ✓ Audit logs retrieved: {len(logs)} security event records logged")

    # 6. Test Geofence Protection on Mark Attendance
    print("\n[TEST 6] Testing Attendance Geofence & Device Security Guard...")
    
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    # Attempt attendance from outside campus
    res = client.post("/api/attendance/mark", headers=student_headers, json={
        "latitude": RGIT_LATITUDE + 0.05,
        "longitude": RGIT_LONGITUDE + 0.05,
        "accuracy_meters": 10.0,
        "is_mock_location": False,
        "device_uuid": "TEST_DEVICE_PHONE_AAKASH",
        "image_base64": "data:image/jpeg;base64,sample",
        "subject_code": "BCS701",
        "blink_detected": True
    })
    assert res.status_code == 403, f"Expected 403 for outside campus, got {res.status_code}"
    print("  ✓ Geofence boundary violation blocked with 403 Forbidden")

    # Attempt attendance from an unauthorized second device
    res = client.post("/api/attendance/mark", headers=student_headers, json={
        "latitude": RGIT_LATITUDE,
        "longitude": RGIT_LONGITUDE,
        "accuracy_meters": 10.0,
        "is_mock_location": False,
        "device_uuid": "DIFFERENT_UNAUTHORIZED_PHONE",
        "image_base64": "data:image/jpeg;base64,sample",
        "subject_code": "BCS701",
        "blink_detected": True
    })
    assert res.status_code == 403, f"Expected 403 for unauthorized device, got {res.status_code}"
    # 7. Test Teacher Session Code Security Enforcement
    print("\n[TEST 7] Testing Teacher-Launched Session Code Gate...")

    # Attempt attendance without session code
    res = client.post("/api/attendance/mark", headers=student_headers, json={
        "latitude": RGIT_LATITUDE,
        "longitude": RGIT_LONGITUDE,
        "accuracy_meters": 10.0,
        "is_mock_location": False,
        "device_uuid": "TEST_DEVICE_PHONE_AAKASH",
        "image_base64": "data:image/jpeg;base64,sample",
        "subject_code": "BCS701",
        "session_code": "",
        "blink_detected": True
    })
    assert res.status_code == 400, f"Expected 400 for empty session code, got {res.status_code}"
    assert "Faculty session code is required" in res.json()["detail"]
    print("  ✓ Missing teacher session code rejected with 400 Bad Request")

    # Attempt attendance with wrong session code
    res = client.post("/api/attendance/mark", headers=student_headers, json={
        "latitude": RGIT_LATITUDE,
        "longitude": RGIT_LONGITUDE,
        "accuracy_meters": 10.0,
        "is_mock_location": False,
        "device_uuid": "TEST_DEVICE_PHONE_AAKASH",
        "image_base64": "data:image/jpeg;base64,sample",
        "subject_code": "BCS701",
        "session_code": "000000",
        "blink_detected": True
    })
    assert res.status_code == 400, f"Expected 400 for invalid session code, got {res.status_code}"
    assert "Invalid session code" in res.json()["detail"]
    print("  ✓ Invalid session code mismatch rejected with 400 Bad Request")

    # Attempt attendance with active session code from faculty session launched earlier
    res = client.post("/api/attendance/mark", headers=student_headers, json={
        "latitude": RGIT_LATITUDE,
        "longitude": RGIT_LONGITUDE,
        "accuracy_meters": 10.0,
        "is_mock_location": False,
        "device_uuid": "TEST_DEVICE_PHONE_AAKASH",
        "image_base64": "data:image/jpeg;base64,sample",
        "subject_code": "BCS701",
        "session_code": session_code,
        "blink_detected": True
    })
    # This should pass step 3 (session code check); it may return 400 for duplicate or face check, but NOT session code rejection
    assert "Invalid session code" not in res.text and "Faculty session code is required" not in res.text
    print(f"  ✓ Valid session code '{session_code}' successfully accepted by gatekeeper")

    # ==========================================
    # TEST 8: Student Self-Registration & Teacher Verification Queue
    # ==========================================
    print("\n[TEST 8] Testing Self-Registration & Teacher Verification Queue...")

    import base64
    from pathlib import Path
    sample_img_path = Path(__file__).parent / "dataset" / "1RG21CS001.jpg"
    with open(sample_img_path, "rb") as f:
        valid_face_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode("utf-8")

    # 1. Attempt registering already registered student (1RG21CS001) -> duplicate blocked
    dup_res = client.post("/api/register/submit-form", json={
        "usn": "1RG21CS001",
        "full_name": "Aakash Gowda",
        "email": "aakash@rgit.ac.in",
        "phone": "+91 9888877771",
        "section": "A",
        "photo_base64": valid_face_b64
    })
    assert dup_res.status_code == 400
    assert "already registered" in dup_res.json()["detail"].lower()
    print("  ✓ Duplicate registration for existing student rejected with 400")

    # 2. Attempt registering with blank/invalid photo -> rejection
    blank_res = client.post("/api/register/submit-form", json={
        "usn": "1RG21CS099",
        "full_name": "New Candidate",
        "email": "candidate@rgit.ac.in",
        "phone": "+91 9999900001",
        "section": "A",
        "photo_base64": "data:image/jpeg;base64,invalidphoto"
    })
    assert blank_res.status_code == 400
    print("  ✓ Invalid/non-face photo rejected with 400")

    # Clean up test user if previously run
    db = next(get_db())
    db.query(StudentRegistrationRequest).filter(StudentRegistrationRequest.usn == "1RG21CS099").delete()
    user_test = db.query(User).filter(User.username == "1RG21CS099").first()
    if user_test:
        db.delete(user_test)
    db.commit()

    # 3. Valid self-registration submission
    reg_res = client.post("/api/register/submit-form", json={
        "usn": "1RG21CS099",
        "full_name": "New Candidate",
        "email": "candidate@rgit.ac.in",
        "phone": "+91 9999900001",
        "section": "A",
        "photo_base64": valid_face_b64,
        "password": "studentpass123"
    })
    assert reg_res.status_code == 200, f"Submit failed: {reg_res.text}"
    req_id = reg_res.json()["request_id"]
    print(f"  ✓ Valid student self-registration submitted (Request ID: {req_id}, Status: PENDING)")

    # 4. Immediate duplicate submission while pending -> rejected
    pending_dup = client.post("/api/register/submit-form", json={
        "usn": "1RG21CS099",
        "full_name": "New Candidate",
        "email": "candidate@rgit.ac.in",
        "phone": "+91 9999900001",
        "section": "A",
        "photo_base64": valid_face_b64
    })
    assert pending_dup.status_code == 400
    assert "awaiting teacher verification" in pending_dup.json()["detail"].lower()
    print("  ✓ Duplicate submission during pending verification rejected with 400")

    # 5. Teacher fetches pending verification list
    pending_list_res = client.get("/api/register/pending-list?section=A", headers=faculty_headers)
    assert pending_list_res.status_code == 200
    pending_items = pending_list_res.json()
    assert any(p["usn"] == "1RG21CS099" for p in pending_items)
    print(f"  ✓ Teacher retrieved pending registration queue ({len(pending_items)} pending)")

    # 6. Student status check endpoint
    status_res = client.get("/api/register/check-status/1RG21CS099")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "PENDING"
    print("  ✓ Public student registration status lookup confirmed: PENDING")

    # 7. Department HOD authority check: regular faculty is blocked with 403
    unauth_fac_res = client.post(f"/api/register/{req_id}/action", headers=faculty_headers, json={
        "action": "APPROVE"
    })
    assert unauth_fac_res.status_code == 403
    print("  ✓ Regular faculty approval blocked with 403 Forbidden (Only Department HOD authorized)")

    # 7b. Department HOD verifies and approves student
    approve_res = client.post(f"/api/register/{req_id}/action", headers=admin_headers, json={
        "action": "APPROVE"
    })
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
    print("  ✓ Department HOD / Admin approved student: account officially created and enrolled into biometric dataset")

    # 8. Verify approved student can log in
    student_login = client.post("/api/auth/login", json={
        "username": "1RG21CS099",
        "password": "studentpass123"
    })
    assert student_login.status_code == 200
    assert student_login.json()["face_registered"] == True
    print("  ✓ Newly approved student successfully authenticated into system with face_registered=True")

    # 9. Verify multiple registration blocked after approval
    after_app_res = client.post("/api/register/submit-form", json={
        "usn": "1RG21CS099",
        "full_name": "New Candidate",
        "email": "candidate@rgit.ac.in",
        "phone": "+91 9999900001",
        "section": "A",
        "photo_base64": valid_face_b64
    })
    assert after_app_res.status_code == 400
    print("  ✓ Multiple registration for approved student blocked with 400")

    # 9. Test Admin-Only Faculty Onboarding & Subject Assignment
    print("\n[TEST 9] Testing Admin-Only Faculty Onboarding & Subject Assignment...")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 9a. Verify subjects catalog is accessible
    subjects_res = client.get("/api/subjects/list")
    assert subjects_res.status_code == 200
    catalog = subjects_res.json()
    assert len(catalog) >= 4
    subject_codes_catalog = [s["code"] for s in catalog]
    print(f"  ✓ Academic subjects catalog loaded: {subject_codes_catalog}")

    # 9b. Non-admin (Student) blocked from adding faculty
    student_add_res = client.post("/api/faculty/create", headers=student_headers, json={
        "full_name": "Unauthorized Prof",
        "faculty_code": "FAC999",
        "username": "unauthorized_prof",
        "password": "pass123",
        "designation": "Assistant Professor",
        "department": "CSE",
        "email": "unauth@rgit.ac.in",
        "subject_codes": ["BCS701"]
    })
    assert student_add_res.status_code == 403, f"Expected 403 for student adding faculty, got {student_add_res.status_code}"
    print("  ✓ Student attempt to add teacher strictly blocked with 403 Forbidden")

    # 9c. Faculty member blocked from adding another faculty
    faculty_add_res = client.post("/api/faculty/create", headers=faculty_headers, json={
        "full_name": "Faculty Attempting Add",
        "faculty_code": "FAC998",
        "username": "faculty_prof_add",
        "password": "pass123",
        "designation": "Assistant Professor",
        "department": "CSE",
        "email": "fac_add@rgit.ac.in",
        "subject_codes": ["BCS701"]
    })
    assert faculty_add_res.status_code == 403, f"Expected 403 for faculty adding faculty, got {faculty_add_res.status_code}"
    print("  ✓ Faculty attempt to add teacher strictly blocked with 403 Forbidden")

    # 9d. Clean up previous test faculty if exists
    existing_facs = client.get("/api/faculty/list", headers=admin_headers).json()
    for fac in existing_facs:
        if fac.get("faculty_code") in ["TEST_FAC_101", "FAC999", "FAC998"]:
            client.delete(f"/api/faculty/{fac['id']}", headers=admin_headers)

    # 9e. Admin successfully onboards teacher assigned to specific subjects
    add_payload = {
        "full_name": "Dr. Ramesh Sharma",
        "faculty_code": "TEST_FAC_101",
        "username": "ramesh_sharma",
        "password": "rameshpass123",
        "designation": "Associate Professor",
        "department": "Computer Science & Engineering",
        "email": "ramesh.sharma@rgit.ac.in",
        "phone": "+91 9876543210",
        "subject_codes": ["BCS701", "BCS702"]
    }
    create_res = client.post("/api/faculty/create", headers=admin_headers, json=add_payload)
    assert create_res.status_code == 200, f"Admin faculty create failed: {create_res.text}"
    created_fac = create_res.json()
    new_faculty_id = created_fac["faculty_id"]
    assigned_codes = [s.split(" - ")[0] for s in created_fac["assigned_subjects"]]
    assert "BCS701" in assigned_codes and "BCS702" in assigned_codes
    print(f"  ✓ Admin successfully onboarded teacher (code={created_fac['faculty_code']}) assigned to: {assigned_codes}")

    # 9f. Verify newly created teacher can authenticate
    new_teacher_login = client.post("/api/auth/login", json={
        "username": "ramesh_sharma",
        "password": "rameshpass123"
    })
    assert new_teacher_login.status_code == 200
    new_teacher_token = new_teacher_login.json()["access_token"]
    assert new_teacher_login.json()["role"] == "faculty"
    print("  ✓ Newly created teacher successfully logged in and authenticated as 'faculty'")

    # 9g. Admin updates teacher's assigned subjects
    update_subj_res = client.put(f"/api/faculty/{new_faculty_id}/subjects", headers=admin_headers, json={
        "subject_codes": ["BCS703", "BCS714D"]
    })
    assert update_subj_res.status_code == 200
    new_codes = [s.split(" - ")[0] for s in update_subj_res.json()["assigned_subjects"]]
    assert "BCS703" in new_codes and "BCS714D" in new_codes
    assert "BCS701" not in new_codes
    print(f"  ✓ Admin successfully updated teacher's subjects to: {new_codes}")

    # 9h. Admin deletes the test teacher
    del_res = client.delete(f"/api/faculty/{new_faculty_id}", headers=admin_headers)
    assert del_res.status_code == 200
    # Confirm deletion from list
    post_del_facs = client.get("/api/faculty/list", headers=admin_headers).json()
    assert not any(f["id"] == new_faculty_id for f in post_del_facs)
    print(f"  ✓ Admin successfully removed test teacher (id={new_faculty_id}) from system")

    # 10. Test Student Roll Number Direct Login & Database USN Enforcement
    print("\n[TEST 10] Testing Student Roll Number Login & Strict Database USN Enforcement...")

    # 10a. Unregistered student USN blocked with 403 Forbidden
    unreg_res = client.post("/api/auth/student-login", json={"usn": "1RG21CS999"})
    assert unreg_res.status_code == 403, f"Expected 403 for unregistered USN, got {unreg_res.status_code}"
    assert "not registered in the rgit institutional database" in unreg_res.json()["detail"].lower()
    print("  ✓ Unregistered student USN '1RG21CS999' strictly blocked with 403 Forbidden")

    # 10b. Unregistered student via standard login endpoint also blocked with 403
    unreg_std_res = client.post("/api/auth/login", json={"username": "1RG21CS999", "is_student": True})
    assert unreg_std_res.status_code == 403
    print("  ✓ Unregistered USN via /api/auth/login also strictly blocked with 403 Forbidden")

    # 10c. Enrolled student logs in directly by Roll Number (no password needed)
    roll_login_res = client.post("/api/auth/student-login", json={
        "usn": "1RG21CS001",
        "device_uuid": "TEST_ROLL_PHONE_01"
    })
    assert roll_login_res.status_code == 200, f"Roll login failed: {roll_login_res.text}"
    roll_data = roll_login_res.json()
    assert roll_data["role"] == "student"
    assert roll_data["username"] == "1RG21CS001"
    assert roll_data["full_name"] == "Aakash Gowda"
    assert roll_data["section"] == "A"
    print("  ✓ Enrolled student '1RG21CS001' logged in directly by Roll Number with no password required")

    # 10d. Case-insensitive roll number lookup (e.g. lowercase '1rg21cs042')
    case_res = client.post("/api/auth/student-login", json={"usn": "1rg21cs042"})
    assert case_res.status_code == 200
    assert case_res.json()["full_name"] == "Divya Ramesh"
    print("  ✓ Case-insensitive roll number lookup verified for '1rg21cs042' (Divya Ramesh)")

    # 10e. Student login with valid password
    pwd_login_res = client.post("/api/auth/student-login", json={
        "usn": "1RG21CS001",
        "password": "student123"
    })
    assert pwd_login_res.status_code == 200
    print("  ✓ Enrolled student login with verified student password succeeded")

    # 10f. Student login with wrong password rejected
    wrong_pwd_res = client.post("/api/auth/student-login", json={
        "usn": "1RG21CS001",
        "password": "wrong_custom_password"
    })
    assert wrong_pwd_res.status_code == 401
    print("  ✓ Incorrect custom password for enrolled student rejected with 401")

    # 10g. Staff and Admin still strictly require passwords
    staff_no_pwd = client.post("/api/auth/login", json={"username": "faculty1"})
    assert staff_no_pwd.status_code == 401
    admin_no_pwd = client.post("/api/auth/login", json={"username": "arudra"})
    assert admin_no_pwd.status_code == 401
    print("  ✓ Faculty and Admin still strictly require valid passwords (no bypass)")

    # 11. Test Teacher Login with Name and Password Set by Admin
    print("\n[TEST 11] Testing Teacher Login with Name & Password Configured by Admin...")

    # 11a. Admin onboards teacher with custom login name and custom password
    teacher_payload = {
        "full_name": "Dr. Raghavendra Rao",
        "faculty_code": "FAC_RAG_77",
        "username": "dr_raghav",
        "password": "AdminSetPassword@2026",
        "designation": "Associate Professor",
        "department": "Computer Science & Engineering",
        "email": "raghavendra.rao@rgit.ac.in",
        "phone": "+91 9845077777",
        "subject_codes": ["BCS701", "BCS714D"]
    }
    create_teacher_res = client.post("/api/faculty/create", headers=admin_headers, json=teacher_payload)
    assert create_teacher_res.status_code == 200, f"Create teacher failed: {create_teacher_res.text}"
    teacher_id = create_teacher_res.json()["faculty_id"]
    print("  ✓ Admin successfully onboarded teacher with Login Name 'dr_raghav' and custom password")

    # 11b. Teacher logs in using exact login name and password set by Admin
    teacher_login_res = client.post("/api/auth/login", json={
        "username": "dr_raghav",
        "password": "AdminSetPassword@2026"
    })
    assert teacher_login_res.status_code == 200, f"Teacher login failed: {teacher_login_res.text}"
    assert teacher_login_res.json()["role"] == "faculty"
    assert teacher_login_res.json()["full_name"] == "Dr. Raghavendra Rao"
    print("  ✓ Teacher successfully logged in using Login Name and Password set by Admin")

    # 11c. Teacher can also log in by their assigned Faculty Code with Admin-set password
    code_login_res = client.post("/api/auth/login", json={
        "username": "FAC_RAG_77",
        "password": "AdminSetPassword@2026"
    })
    assert code_login_res.status_code == 200
    print("  ✓ Teacher also successfully logged in using Faculty Code 'FAC_RAG_77' with Admin-set password")

    # 11d. Student or unauthenticated user blocked from updating teacher credentials (403)
    unauth_cred_res = client.put(f"/api/faculty/{teacher_id}/credentials", headers=student_headers, json={
        "new_password": "HackerPassword"
    })
    assert unauth_cred_res.status_code == 403
    print("  ✓ Unauthorized attempt to modify teacher credentials blocked with 403 Forbidden")

    # 11e. Admin resets/updates teacher credentials (new password & login name)
    admin_cred_res = client.put(f"/api/faculty/{teacher_id}/credentials", headers=admin_headers, json={
        "new_username": "dr_raghav_updated",
        "new_password": "NewAdminPassphrase#2026"
    })
    assert admin_cred_res.status_code == 200
    print("  ✓ Admin successfully reset teacher's login name to 'dr_raghav_updated' and set new password")

    # 11f. Old password no longer works
    old_pwd_res = client.post("/api/auth/login", json={
        "username": "dr_raghav_updated",
        "password": "AdminSetPassword@2026"
    })
    assert old_pwd_res.status_code == 401
    print("  ✓ Teacher's previous password successfully invalidated (returns 401)")

    # 11g. Teacher logs in with new credentials set by Admin
    new_login_res = client.post("/api/auth/login", json={
        "username": "dr_raghav_updated",
        "password": "NewAdminPassphrase#2026"
    })
    assert new_login_res.status_code == 200
    print("  ✓ Teacher successfully logged in with updated Login Name and Password set by Admin")

    # 11h. Clean up test teacher
    del_teacher_res = client.delete(f"/api/faculty/{teacher_id}", headers=admin_headers)
    assert del_teacher_res.status_code == 200
    print(f"  ✓ Cleaned up test teacher (id={teacher_id})")

    # 12. Test Strict Admin-Only Login Protection (No One Else Can Login As Admin)
    print("\n[TEST 12] Testing Strict Admin-Only Login Protection (No One Else Can Login as Admin)...")

    # 12a. Student attempt to log in through Admin Portal blocked with 403 Forbidden
    student_admin_attempt = client.post("/api/auth/admin-login", json={
        "username": "1RG21CS001",
        "password": "student123"
    })
    assert student_admin_attempt.status_code == 403, f"Expected 403 for student accessing admin portal, got {student_admin_attempt.status_code}"
    assert "only authorized rgit" in student_admin_attempt.json()["detail"].lower()
    print("  ✓ Student attempt to log into Admin Portal strictly blocked with 403 Forbidden")

    # 12b. Teacher attempt to log in through Admin Portal blocked with 403 Forbidden
    teacher_admin_attempt = client.post("/api/auth/admin-login", json={
        "username": "faculty1",
        "password": "faculty123"
    })
    assert teacher_admin_attempt.status_code == 403, f"Expected 403 for teacher accessing admin portal, got {teacher_admin_attempt.status_code}"
    assert "only authorized rgit" in teacher_admin_attempt.json()["detail"].lower()
    print("  ✓ Teacher attempt to log into Admin Portal strictly blocked with 403 Forbidden")

    # 12c. Random unauthorized account blocked from Admin Portal with 403 Forbidden
    unauthorized_admin_attempt = client.post("/api/auth/admin-login", json={
        "username": "unauthorized_user",
        "password": "some_password"
    })
    assert unauthorized_admin_attempt.status_code == 403
    print("  ✓ Unregistered user attempt on Admin Portal strictly blocked with 403 Forbidden")

    # 12d. Admin attempt with incorrect password rejected with 401 Unauthorized
    admin_wrong_pass = client.post("/api/auth/admin-login", json={
        "username": "arudra",
        "password": "incorrect_admin_pass"
    })
    assert admin_wrong_pass.status_code == 401
    print("  ✓ Admin attempt with wrong password strictly rejected with 401 Unauthorized")

    # 12e. Only authentic Administrator with verified credentials can log in
    genuine_admin_login = client.post("/api/auth/admin-login", json={
        "username": "arudra",
        "password": "arudra123"
    })
    assert genuine_admin_login.status_code == 200, f"Genuine admin login failed: {genuine_admin_login.text}"
    admin_payload = genuine_admin_login.json()
    assert admin_payload["role"] == "admin"
    assert admin_payload["username"] == "arudra"
    assert "access_token" in admin_payload
    print("  ✓ Only genuine Administrator with valid credentials successfully authenticated as 'admin'")

    # 13. Test Subject Teacher CSV Attendance Export
    print("\n[TEST 13] Testing Subject Teacher Attendance CSV Export Feature...")
    
    # 13a. Export CSV format
    csv_resp = client.get(
        "/api/faculty/attendance-export?department=B.E%20in%20Computer%20Science%20and%20Engineering&subject_code=BCS701&section=A&semester=7&download_format=csv",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert csv_resp.status_code == 200, f"CSV Export failed: {csv_resp.text}"
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "RAJIV GANDHI INSTITUTE OF TECHNOLOGY" in csv_resp.text
    assert "USN,Student Name,Department" in csv_resp.text
    print("  ✓ Teacher successfully downloaded Attendance CSV with department, subject & section filters")

    # 13b. Export JSON format
    json_resp = client.get(
        "/api/faculty/attendance-export?department=ALL&subject_code=ALL&section=ALL&download_format=json",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert json_resp.status_code == 200, f"JSON Export failed: {json_resp.text}"
    json_data = json_resp.json()
    assert json_data["success"] is True
    assert "records" in json_data
    print("  ✓ Teacher successfully fetched live attendance report preview for all students")

    print("\n=========================================================")
    print("   ALL TESTS PASSED! RGIT SYSTEM VERIFIED FULLY HEALTHY  ")
    print("=========================================================")

if __name__ == "__main__":
    test_all()

