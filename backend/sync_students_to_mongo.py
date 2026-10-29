import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import cv2
import face_recognition
from rgit_app.database import SessionLocal
from rgit_app.models import StudentProfile, User
from rgit_app.config import DATASET_DIR
from rgit_app.mongodb import get_mongo_db, upsert_student_in_mongo, MONGO_URI, MONGO_DB_NAME

def sync_all_students_to_mongodb():
    print("=" * 65)
    print(f"  RGIT BANGALORE — SYNC REGISTERED STUDENTS TO MONGODB ATLAS")
    print(f"  Database Name: {MONGO_DB_NAME}")
    print("=" * 65)

    db_mongo = get_mongo_db()
    if db_mongo is None:
        print("\n[!] Could not establish connection to MongoDB Atlas.")
        print("    Please provide or export your MONGO_URI environment variable:")
        print("    e.g. set MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority")
        return False

    db_sql = SessionLocal()
    try:
        students = db_sql.query(StudentProfile).join(User).all()
        print(f"\nFound {len(students)} registered students in SQLite database. Syncing to MongoDB...\n")

        synced_count = 0
        for s in students:
            # Check for face image and extract 128-d vector embedding if enrolled
            face_embedding = None
            face_img_path = DATASET_DIR / f"{s.usn.upper()}.jpg"
            if face_img_path.exists():
                try:
                    img_bgr = cv2.imread(str(face_img_path))
                    if img_bgr is not None:
                        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
                        encs = face_recognition.face_encodings(img_rgb)
                        if encs:
                            face_embedding = encs[0].tolist()  # Convert numpy array to JSON serializable list
                except Exception as e:
                    print(f"  Note: Could not extract face vector for {s.usn}: {e}")

            student_data = {
                "usn": s.usn,
                "full_name": s.user.full_name,
                "email": s.user.email,
                "department": s.department,
                "semester": s.semester,
                "section": s.section,
                "face_registered": s.face_registered,
                "bound_device_uuid": s.bound_device_uuid,
                "face_embedding": face_embedding
            }

            ok = upsert_student_in_mongo(student_data)
            if ok:
                synced_count += 1
                status = "🟢 Face Enrolled" if s.face_registered else "⚪ Pending Face"
                print(f"  ✓ Synced {s.usn} ({s.user.full_name}) — Sec {s.section} — {status}")

        print(f"\n[DONE] Successfully synced {synced_count}/{len(students)} registered students to MongoDB Atlas!")
        return True
    finally:
        db_sql.close()

if __name__ == "__main__":
    sync_all_students_to_mongodb()
