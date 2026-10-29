import os
from typing import Optional, Dict, Any, List
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError

# MongoDB Atlas connection string from environment or config
# Example: mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://admin:password@cluster0.mongodb.net/?retryWrites=true&w=majority"
)
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "rgit_smart_attendance")

_client: Optional[MongoClient] = None
_client_attempted: bool = False

def get_mongo_client() -> Optional[MongoClient]:
    """Initializes or returns singleton MongoDB client."""
    global _client, _client_attempted
    if _client_attempted:
        return _client
    
    uri = os.getenv("MONGO_URI", MONGO_URI)
    # If using unconfigured placeholder URI, gracefully skip without network timeout
    if not uri or "admin:password@cluster0.mongodb.net" in uri or "<password>" in uri:
        _client_attempted = True
        return None

    try:
        _client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        _client.admin.command('ping')
        print(f"[OK] Successfully connected to MongoDB Atlas database: {MONGO_DB_NAME}")
    except Exception as e:
        print(f"[INFO] MongoDB Atlas optional sync disabled ({e}). Running seamlessly on SQLite local multi-tenant databases.")
        _client = None
    finally:
        _client_attempted = True
    return _client


def get_mongo_db():
    """Returns the MongoDB database instance, or None if not connected."""
    client = get_mongo_client()
    if client:
        return client[MONGO_DB_NAME]
    return None


def upsert_student_in_mongo(student_data: Dict[str, Any]) -> bool:
    """
    Saves or updates a registered student document in MongoDB 'students' collection.
    Schema includes:
    - usn (unique index)
    - full_name
    - email
    - department
    - semester
    - section
    - face_registered
    - bound_device_uuid
    - face_embedding (128-d vector if available)
    - updated_at
    """
    db = get_mongo_db()
    if db is None:
        return False

    try:
        collection = db["students"]
        # Ensure unique index on USN
        collection.create_index("usn", unique=True)

        student_doc = {
            "usn": student_data.get("usn"),
            "full_name": student_data.get("full_name"),
            "email": student_data.get("email"),
            "department": student_data.get("department", "Computer Science & Engineering"),
            "semester": student_data.get("semester", 7),
            "section": student_data.get("section", "A"),
            "face_registered": bool(student_data.get("face_registered", False)),
            "bound_device_uuid": student_data.get("bound_device_uuid"),
            "face_embedding": student_data.get("face_embedding"),
            "updated_at": datetime.utcnow()
        }

        if "created_at" in student_data:
            student_doc["created_at"] = student_data["created_at"]
        else:
            student_doc.setdefault("created_at", datetime.utcnow())

        collection.update_one(
            {"usn": student_data["usn"]},
            {"$set": student_doc},
            upsert=True
        )
        print(f"[MongoDB] Upserted registered student document: {student_data['usn']}")
        return True
    except Exception as e:
        print(f"[MongoDB] Error saving student to MongoDB: {e}")
        return False


def delete_student_in_mongo(usn: str) -> bool:
    """Deletes a student document from MongoDB Atlas."""
    db = get_mongo_db()
    if db is None:
        return False
    try:
        db["students"].delete_one({"usn": usn})
        print(f"[MongoDB] Deleted student document: {usn}")
        return True
    except Exception as e:
        print(f"[MongoDB] Error deleting student from MongoDB: {e}")
        return False


def get_all_registered_students_mongo(section: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieves all registered students from MongoDB collection."""
    db = get_mongo_db()
    if db is None:
        return []

    try:
        collection = db["students"]
        query = {}
        if section:
            query["section"] = section.upper()

        cursor = collection.find(query, {"_id": 0}).sort("usn", 1)
        return list(cursor)
    except Exception as e:
        print(f"[MongoDB] Error reading students: {e}")
        return []


def log_attendance_in_mongo(attendance_data: Dict[str, Any]) -> bool:
    """Logs an attendance record into MongoDB 'attendance_records' collection."""
    db = get_mongo_db()
    if db is None:
        return False

    try:
        collection = db["attendance_records"]
        doc = {
            **attendance_data,
            "recorded_at": datetime.utcnow()
        }
        collection.insert_one(doc)
        print(f"[MongoDB] Logged attendance for {attendance_data.get('student_usn')}")
        return True
    except Exception as e:
        print(f"[MongoDB] Error logging attendance to MongoDB: {e}")
        return False
