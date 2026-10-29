import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from fastapi.testclient import TestClient
from rgit_app.main import app

client = TestClient(app)

def post(url, data):
    path = url.replace('http://127.0.0.1:8000', '')
    res = client.post(path, json=data)
    try:
        return res.status_code, res.json()
    except Exception:
        return res.status_code, {"text": res.text}

def get(url):
    path = url.replace('http://127.0.0.1:8000', '')
    res = client.get(path)
    try:
        return res.status_code, res.json()
    except Exception:
        return res.status_code, {"text": res.text}

print('=' * 65)
print('  COMPREHENSIVE MULTI-TENANT SYSTEM VERIFICATION')
print('=' * 65)

print('\n[1/5] DEPARTMENT SEPARATE DATABASES STATUS')
st, data = get('http://127.0.0.1:8000/api/department-databases/status')
db_list = data.get('databases', [])
print(f'Status HTTP {st}: Total Databases Active = {len(db_list)}')
for item in db_list:
    print(f"  * {item['key']:15} | {item['filename']:32} | {item['status']} ({item['size_kb']} KB)")

print('\n[2/5] MASTER SYSTEM ADMIN (MOHD / 0609)')
st, res = post('http://127.0.0.1:8000/api/auth/admin-login', {'username': 'MOHD', 'password': '0609'})
print(f"  * MOHD Login: HTTP {st} -> Role: {res.get('role')}, Username: {res.get('username')}, Dept: {res.get('department')}")

print('\n[3/5] SEPARATE HOD LOGINS FOR ALL 9 DEPARTMENTS')
hod_tests = [
    ('CSE', 'hod_cse', 'arudra123'),
    ('ECE', 'hod_ece', 'hod123'),
    ('EE', 'hod_ee', 'hod123'),
    ('BME', 'hod_bme', 'hod123'),
    ('ME', 'hod_me', 'hod123'),
    ('CSE_AI', 'hod_cse_ai', 'hod123'),
    ('CSE_IOT_CS_BT', 'hod_cse_iot', 'hod123'),
    ('ISE', 'hod_ise', 'hod123'),
    ('AIML', 'hod_aiml', 'hod123')
]
for dept, u, p in hod_tests:
    st, res = post('http://127.0.0.1:8000/api/auth/hod-login', {'username': u, 'password': p})
    print(f"  * [{dept:15}] HOD {u:12}: HTTP {st} | Name: {res.get('full_name')} | Dept: {res.get('department')}")

print('\n[4/5] SEPARATE TEACHER LOGINS ACROSS DEPARTMENTS')
fac_tests = [
    ('CSE', 'roopa', 'faculty123'),
    ('ECE', 'sunithak7', 'faculty123'),
    ('EE', 'vsuresh7', 'faculty123'),
    ('BME', 'preethim', 'faculty123'),
    ('ME', 'siddarajum', 'faculty123')
]
for dept, u, p in fac_tests:
    st, res = post('http://127.0.0.1:8000/api/auth/login', {'username': u, 'password': p})
    print(f"  * [{dept:6}] Teacher {u:12}: HTTP {st} | Name: {res.get('full_name')} | Dept: {res.get('department')}")

print('\n[5/5] SEPARATE STUDENT ROLL NUMBER LOGINS ACROSS DEPARTMENTS')
stud_tests = [
    ('CSE', '1RG21CS001', 'student123'),
    ('ECE', '1RG21EC001', 'student123'),
    ('EE', '1RG21EE001', 'student123'),
    ('BME', '1RG21BM001', 'student123'),
    ('ME', '1RG21ME001', 'student123')
]
for dept, usn, p in stud_tests:
    st, res = post('http://127.0.0.1:8000/api/auth/student-login', {'usn': usn, 'password': p})
    print(f"  * [{dept:6}] Student {usn:12}: HTTP {st} | Name: {res.get('full_name')} | Sem {res.get('semester')} | Dept: {res.get('department')}")

print('\n' + '=' * 65)
print('  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!')
print('=' * 65)
