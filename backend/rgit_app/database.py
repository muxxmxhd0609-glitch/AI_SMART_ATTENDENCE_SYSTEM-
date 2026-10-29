import sqlite3
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from pathlib import Path
from rgit_app.config import BASE_DIR

# ==========================================================
# MULTI-TENANT DEPARTMENTAL DATABASE SYSTEM (RGIT BANGALORE)
# Master Database + 9 Separate Departmental Databases
# ==========================================================

# 1. Master System Database Path
DB_PATH = BASE_DIR / "attendance_system.db"

master_engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)

# Engine Alias for default imports
engine = master_engine

# Pragma listener for high concurrency WAL mode
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

event.listen(master_engine, "connect", _set_sqlite_pragma)

# Shared Declarative Base
Base = declarative_base()

# Master Session Factory
MasterSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=master_engine)
SessionLocal = MasterSessionLocal

# ==========================================================
# 2. SEPARATE DEPARTMENT DATABASES FOR ALL 9 RGIT B.E COURSES
# ==========================================================

DEPARTMENT_DB_REGISTRY = {
    "EE": {
        "name": "B.E in Electrical Engineering",
        "filename": "attendance_EE.db",
        "code": "EE"
    },
    "CSE": {
        "name": "B.E in Computer Science and Engineering",
        "filename": "attendance_CSE.db",
        "code": "CSE"
    },
    "ECE": {
        "name": "B.E in Electronics and Communication",
        "filename": "attendance_ECE.db",
        "code": "ECE"
    },
    "BME": {
        "name": "B.E in Bio-Medical Engineering",
        "filename": "attendance_BME.db",
        "code": "BME"
    },
    "ME": {
        "name": "B.E in Mechanical Engineering",
        "filename": "attendance_ME.db",
        "code": "ME"
    },
    "CSE_AI": {
        "name": "B.E in Computer Science & Engineering (Artificial Intelligence)",
        "filename": "attendance_CSE_AI.db",
        "code": "CSE-AI"
    },
    "CSE_IOT_CS_BT": {
        "name": "B.E in Computer Science & Engineering (Internet of things Cyber Security with Blockchain Technology)",
        "filename": "attendance_CSE_IOT_CS_BT.db",
        "code": "CSE-IoT/CS/BT"
    },
    "ISE": {
        "name": "B.E in Information Science & Engineering",
        "filename": "attendance_ISE.db",
        "code": "ISE"
    },
    "AIML": {
        "name": "B.E in Artificial Intelligence & Machine Learning",
        "filename": "attendance_AIML.db",
        "code": "AI & ML"
    }
}

# Create engines & sessionmakers for all 9 department databases
DEPARTMENT_ENGINES = {}
DEPARTMENT_SESSIONS = {}

for dept_key, info in DEPARTMENT_DB_REGISTRY.items():
    dept_db_path = BASE_DIR / info["filename"]
    dept_eng = create_engine(
        f"sqlite:///{dept_db_path}",
        connect_args={"check_same_thread": False},
    )
    event.listen(dept_eng, "connect", _set_sqlite_pragma)
    DEPARTMENT_ENGINES[dept_key] = dept_eng
    DEPARTMENT_SESSIONS[dept_key] = sessionmaker(autocommit=False, autoflush=False, bind=dept_eng)

def init_all_databases():
    """Initializes schemas across Master Database and all 9 Department Databases."""
    # 1. Master DB
    Base.metadata.create_all(bind=master_engine)
    # 2. All 9 Department DBs
    for dept_key, dept_eng in DEPARTMENT_ENGINES.items():
        Base.metadata.create_all(bind=dept_eng)

    # 3. Add department column to users table if missing (Safe SQLite column migration)
    from sqlalchemy import inspect, text
    all_engines = [master_engine] + list(DEPARTMENT_ENGINES.values())
    for eng in all_engines:
        try:
            with eng.connect() as conn:
                cols = [c["name"] for c in inspect(eng).get_columns("users")]
                if "department" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR(128)"))
                    conn.commit()
        except Exception:
            pass

def resolve_department_key(dept_identifier: str) -> str:
    """Normalizes department string/code to standard department key."""
    if not dept_identifier:
        return "CSE"
    clean = str(dept_identifier).upper().strip()
    
    # Check exact department code first
    if clean in ["EE", "EEE"]:
        return "EE"
    if clean in ["ECE", "EC"]:
        return "ECE"
    if clean in ["BME", "BM"]:
        return "BME"
    if clean in ["ME", "MECH"]:
        return "ME"
    if clean in ["AIML", "AI_ML", "AI & ML", "AI&ML"]:
        return "AIML"
    if clean in ["CSE_AI", "CSE-AI", "CS_AI"]:
        return "CSE_AI"
    if clean in ["CSE_IOT_CS_BT", "CSE_IOT", "CSE-IOT", "CS_IOT", "IOT"]:
        return "CSE_IOT_CS_BT"
    if clean in ["ISE", "IS"]:
        return "ISE"
    if clean in ["CSE", "CS"]:
        return "CSE"

    # Specific full names / distinct phrases
    if "ELECTRICAL" in clean:
        return "EE"
    if "ELECTRONICS" in clean or "COMMUNICATION" in clean:
        return "ECE"
    if "BIO-MEDICAL" in clean or "BIOMEDICAL" in clean or "BIO MEDICAL" in clean:
        return "BME"
    if "MECHANICAL" in clean:
        return "ME"
    if "ARTIFICIAL INTELLIGENCE & MACHINE" in clean or "MACHINE LEARNING" in clean or "AI & ML" in clean:
        return "AIML"
    if "ARTIFICIAL INTELLIGENCE" in clean:
        return "CSE_AI"
    if "CYBER" in clean or "BLOCKCHAIN" in clean or "INTERNET OF THINGS" in clean or "IOT" in clean:
        return "CSE_IOT_CS_BT"
    if "INFORMATION SCIENCE" in clean or "INFORMATION TECH" in clean:
        return "ISE"
    if "COMPUTER SCIENCE" in clean:
        return "CSE"

    return "CSE"

def get_department_engine(dept_name_or_code: str):
    """Returns SQLAlchemy Engine for specific department database."""
    key = resolve_department_key(dept_name_or_code)
    return DEPARTMENT_ENGINES.get(key, master_engine)

def get_department_session(dept_name_or_code: str):
    """Returns Session Maker for specific department database."""
    key = resolve_department_key(dept_name_or_code)
    session_factory = DEPARTMENT_SESSIONS.get(key, MasterSessionLocal)
    return session_factory()

# Export get_db_for_department alias for external scripts and callers
get_db_for_department = get_department_session

# --- FastAPI Dependency Injector ---
def get_db():
    """FastAPI default dependency: yields master database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Backward compatibility aliases ---
StudentBase = Base
FacultyBase = Base
AdminBase = Base

student_engine = master_engine
faculty_engine = master_engine
admin_engine = master_engine

StudentSessionLocal = SessionLocal
FacultySessionLocal = SessionLocal
AdminSessionLocal = SessionLocal

get_student_db = get_db
get_faculty_db = get_db
get_admin_db = get_db
