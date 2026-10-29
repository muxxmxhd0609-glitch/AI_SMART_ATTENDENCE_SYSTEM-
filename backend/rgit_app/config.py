import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Security & Tokens
SECRET_KEY = os.getenv("SECRET_KEY", "rgit_ai_smart_attendance_super_secret_jwt_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days session for mobile usability

# Campus Geofencing (Rajiv Gandhi Institute of Technology, Bangalore)
RGIT_LATITUDE = 13.033089637756348
RGIT_LONGITUDE = 77.59778594970703
DEFAULT_GEOFENCE_RADIUS_METERS = 250.0  # 250m covers campus perimeter

# Face Recognition Settings
FACE_TOLERANCE = 0.55  # Balanced for webcams with varied lighting (0.50 - 0.58)
LIVENESS_EAR_THRESHOLD = 0.22  # Eye Aspect Ratio for blink detection
LIVENESS_CONSEC_FRAMES = 2

# Storage Directories
DATASET_DIR = BASE_DIR / "dataset"
ATTENDANCE_IMAGES_DIR = BASE_DIR / "attendance_images"
UNKNOWN_FACES_DIR = BASE_DIR / "unknown_faces"

for directory in [DATASET_DIR, ATTENDANCE_IMAGES_DIR, UNKNOWN_FACES_DIR]:
    directory.mkdir(parents=True, exist_ok=True)
