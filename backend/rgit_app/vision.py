import os
import base64
import numpy as np
import cv2
import face_recognition
from datetime import datetime
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

from rgit_app.config import (
    DATASET_DIR, ATTENDANCE_IMAGES_DIR, UNKNOWN_FACES_DIR,
    FACE_TOLERANCE, LIVENESS_EAR_THRESHOLD
)

def decode_base64_image(base64_string: str) -> np.ndarray:
    """Decodes data URL / base64 string to an OpenCV BGR image."""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    
    img_bytes = base64.b64decode(base64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Failed to decode base64 image data")
    return img_bgr


def calculate_eye_aspect_ratio(eye_landmarks: list) -> float:
    """
    Computes Eye Aspect Ratio (EAR) from 6 eye landmark coordinate tuples.
    eye_landmarks: [(x, y) for 6 points]
    """
    p = np.array(eye_landmarks)
    if len(p) < 6:
        return 0.30
    
    # Euclidean distances between vertical eye landmarks
    dist_v1 = np.linalg.norm(p[1] - p[5])
    dist_v2 = np.linalg.norm(p[2] - p[4])
    # Euclidean distance between horizontal eye landmarks
    dist_h = np.linalg.norm(p[0] - p[3])

    if dist_h == 0:
        return 0.0

    ear = (dist_v1 + dist_v2) / (2.0 * dist_h)
    return float(ear)


def check_liveness(image_rgb: np.ndarray) -> Dict[str, Any]:
    """
    Analyzes facial landmarks to detect liveness indicators (eyes open/blink capability, mouth smile).
    """
    landmarks_list = face_recognition.face_landmarks(image_rgb)
    if not landmarks_list:
        return {"liveness_ok": False, "reason": "No face landmarks found for liveness test"}

    landmarks = landmarks_list[0]
    left_eye = landmarks.get("left_eye", [])
    right_eye = landmarks.get("right_eye", [])

    if not left_eye or not right_eye:
        return {"liveness_ok": True, "ear": 0.28, "reason": "Eyes landmarks unavailable"}

    left_ear = calculate_eye_aspect_ratio(left_eye)
    right_ear = calculate_eye_aspect_ratio(right_eye)
    avg_ear = (left_ear + right_ear) / 2.0

    return {
        "liveness_ok": True,
        "ear": round(avg_ear, 3),
        "is_blinking": avg_ear < LIVENESS_EAR_THRESHOLD
    }


def register_student_face(usn: str, base64_image: str) -> Dict[str, Any]:
    """
    Validates, extracts embedding, and saves reference photo for a student in dataset/.
    Strictly verifies exactly one face is visible.
    """
    img_bgr = decode_base64_image(base64_image)
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(img_rgb, model="hog")
    if len(face_locations) == 0:
        return {"success": False, "message": "No face detected in reference photo. Ensure proper lighting."}
    if len(face_locations) > 1:
        return {"success": False, "message": f"Multiple faces ({len(face_locations)}) detected. Only one face must be present."}

    # Extract 128-d embedding
    encodings = face_recognition.face_encodings(img_rgb, face_locations)
    if not encodings:
        return {"success": False, "message": "Failed to extract facial biometric encoding."}

    # Save to dataset/<USN>.jpg
    file_path = DATASET_DIR / f"{usn.upper()}.jpg"
    cv2.imwrite(str(file_path), img_bgr)

    return {
        "success": True,
        "message": f"Biometric face reference successfully enrolled for {usn}.",
        "file_path": str(file_path)
    }


def verify_passport_photo(base64_image: str) -> Dict[str, Any]:
    """
    Validates that the uploaded photo is a clear passport-style individual portrait.
    Checks:
    1. Valid image decode
    2. Exactly 1 face visible (no zero faces, no multiple people)
    3. Facial landmarks and 128-d embedding extractable
    Returns dict with success status, error message, face_locations, and OpenCV BGR image.
    """
    try:
        img_bgr = decode_base64_image(base64_image)
    except Exception as e:
        return {"success": False, "message": f"Could not decode passport photo: {str(e)}", "img_bgr": None}

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(img_rgb, model="hog")
    
    if len(face_locations) == 0:
        return {
            "success": False,
            "message": "No human face detected. Please ensure a well-lit, front-facing clear passport photo with a plain background.",
            "img_bgr": img_bgr
        }
    if len(face_locations) > 1:
        return {
            "success": False,
            "message": f"Multiple faces ({len(face_locations)}) detected. The passport photo must contain only the individual student's face.",
            "img_bgr": img_bgr
        }
    
    encodings = face_recognition.face_encodings(img_rgb, face_locations)
    if not encodings:
        return {
            "success": False,
            "message": "Face landmarks could not be clearly resolved. Please upload a clearer photo with even lighting.",
            "img_bgr": img_bgr
        }
    
    return {
        "success": True,
        "face_locations": face_locations,
        "img_bgr": img_bgr,
        "message": "Passport photo biometric verification passed (128-d encoding extracted)."
    }



def verify_student_face(
    usn: str,
    live_base64_image: str,
    enrolled_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compares live captured camera image against enrolled student face photo.
    Returns match status, distance, confidence %, and proof snapshot filename.
    """
    # 1. Resolve enrolled image path
    target_path = Path(enrolled_path) if enrolled_path else DATASET_DIR / f"{usn.upper()}.jpg"
    if not target_path.exists():
        return {
            "verified": False,
            "error_code": "NOT_ENROLLED",
            "message": f"Student {usn} has no biometric face registered. Please contact the administrator.",
            "confidence": 0.0
        }

    # 2. Load enrolled reference image & extract embedding
    enrolled_bgr = cv2.imread(str(target_path))
    if enrolled_bgr is None:
        return {
            "verified": False,
            "error_code": "ENROLLED_READ_FAIL",
            "message": "Enrolled biometric record could not be read from disk.",
            "confidence": 0.0
        }
    enrolled_rgb = cv2.cvtColor(enrolled_bgr, cv2.COLOR_BGR2RGB)
    enrolled_encodings = face_recognition.face_encodings(enrolled_rgb)
    if not enrolled_encodings:
        return {
            "verified": False,
            "error_code": "ENROLLED_NO_ENCODING",
            "message": "Enrolled photo does not contain a discernible face encoding.",
            "confidence": 0.0
        }
    enrolled_encoding = enrolled_encodings[0]

    # 3. Decode live camera frame
    try:
        live_bgr = decode_base64_image(live_base64_image)
    except Exception as e:
        return {
            "verified": False,
            "error_code": "IMAGE_DECODE_ERROR",
            "message": f"Failed to parse live camera frame: {str(e)}",
            "confidence": 0.0
        }

    live_rgb = cv2.cvtColor(live_bgr, cv2.COLOR_BGR2RGB)
    live_locations = face_recognition.face_locations(live_rgb, model="hog")

    if len(live_locations) == 0:
        return {
            "verified": False,
            "error_code": "NO_FACE_DETECTED",
            "message": "No face detected in camera. Look directly into the lens with good lighting.",
            "confidence": 0.0
        }

    if len(live_locations) > 1:
        return {
            "verified": False,
            "error_code": "MULTIPLE_FACES",
            "message": "Multiple faces detected in camera frame! Only the registered student may be visible.",
            "confidence": 0.0
        }

    # 4. Extract live encoding
    live_encodings = face_recognition.face_encodings(live_rgb, live_locations)
    if not live_encodings:
        return {
            "verified": False,
            "error_code": "LIVE_ENCODING_FAIL",
            "message": "Could not extract face biometric features from live frame.",
            "confidence": 0.0
        }
    live_encoding = live_encodings[0]

    # 5. Calculate Euclidean distance & compare with tolerance
    distance = float(face_recognition.face_distance([enrolled_encoding], live_encoding)[0])
    is_match = distance <= FACE_TOLERANCE
    confidence = max(0.0, min(100.0, (1.0 - (distance / FACE_TOLERANCE)) * 100.0))

    # 6. Save attendance snapshot proof
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    snapshot_filename = f"{usn.upper()}_{timestamp_str}.jpg"
    snapshot_path = ATTENDANCE_IMAGES_DIR / snapshot_filename

    # Draw verification box on saved snapshot for audit
    top, right, bottom, left = live_locations[0]
    box_color = (0, 255, 0) if is_match else (0, 0, 255)
    cv2.rectangle(live_bgr, (left, top), (right, bottom), box_color, 2)
    label = f"{usn}: {confidence:.1f}%" if is_match else "MISMATCH"
    cv2.putText(live_bgr, label, (left, max(top - 10, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, box_color, 2)
    cv2.imwrite(str(snapshot_path), live_bgr)

    if not is_match:
        # Save to unknown/unverified if face distance was high
        unknown_path = UNKNOWN_FACES_DIR / f"MISMATCH_{usn}_{timestamp_str}.jpg"
        cv2.imwrite(str(unknown_path), live_bgr)
        return {
            "verified": False,
            "error_code": "FACE_MISMATCH",
            "message": f"Biometric mismatch (Confidence {confidence:.1f}%). The person in front of camera does not match enrolled record for {usn}.",
            "distance": round(distance, 3),
            "confidence": round(confidence, 1),
            "snapshot_filename": snapshot_filename
        }

    return {
        "verified": True,
        "error_code": None,
        "message": f"Face Biometrically Verified! Match confidence: {confidence:.1f}%.",
        "distance": round(distance, 3),
        "confidence": round(confidence, 1),
        "snapshot_filename": snapshot_filename
    }
