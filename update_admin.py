"""
Quick patch: Update admin credentials in the live DB.
Run from project root:  python update_admin.py
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from rgit_app.database import SessionLocal, engine, Base
from rgit_app.models import User
from rgit_app.auth import hash_password

NEW_USERNAME = "arudra"
NEW_PASSWORD = "arudra123"
NEW_FULL_NAME = "Dr. Arudra A"
NEW_EMAIL    = "arudra.a@rgit.ac.in"

Base.metadata.create_all(bind=engine)
db = SessionLocal()

try:
    # Find any existing admin account
    admin = db.query(User).filter(User.role == "admin").first()

    if admin:
        print(f"[FOUND] Existing admin: '{admin.username}' - updating credentials...")
        admin.username        = NEW_USERNAME
        admin.hashed_password = hash_password(NEW_PASSWORD)
        admin.full_name       = NEW_FULL_NAME
        admin.email           = NEW_EMAIL
        db.commit()
        print("[OK] Admin updated successfully!")
    else:
        print("[NEW] No existing admin found - creating one...")
        new_admin = User(
            username=NEW_USERNAME,
            hashed_password=hash_password(NEW_PASSWORD),
            role="admin",
            full_name=NEW_FULL_NAME,
            email=NEW_EMAIL,
            phone="+91 9845012345"
        )
        db.add(new_admin)
        db.commit()
        print("[OK] Admin account created!")

    print()
    print("=" * 40)
    print("  ADMIN LOGIN CREDENTIALS")
    print("=" * 40)
    print(f"  Username : {NEW_USERNAME}")
    print(f"  Password : {NEW_PASSWORD}")
    print("=" * 40)

except Exception as e:
    db.rollback()
    print(f"[ERROR] {e}")
    raise
finally:
    db.close()
