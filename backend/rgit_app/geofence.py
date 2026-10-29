import math
from typing import Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from rgit_app.config import RGIT_LATITUDE, RGIT_LONGITUDE, DEFAULT_GEOFENCE_RADIUS_METERS
from rgit_app.models import GeofenceSettings, SecurityAuditLog

EARTH_RADIUS_METERS = 6371000.0  # Earth's radius in meters

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth
    using the Haversine formula (returns distance in meters).
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = EARTH_RADIUS_METERS * c
    return round(distance, 2)


def get_current_geofence_settings(db: Session) -> GeofenceSettings:
    """Retrieve geofence settings from database, or initialize with RGIT defaults."""
    settings = db.query(GeofenceSettings).first()
    if not settings:
        settings = GeofenceSettings(
            name="Rajiv Gandhi Institute of Technology (RGIT, Bangalore)",
            latitude=RGIT_LATITUDE,
            longitude=RGIT_LONGITUDE,
            radius_meters=DEFAULT_GEOFENCE_RADIUS_METERS,
            enforce_geofence=True
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def verify_campus_presence(
    user_lat: float,
    user_lon: float,
    accuracy_meters: Optional[float] = None,
    is_mock: Optional[bool] = False,
    db: Session = None,
    username: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validates whether the user's GPS coordinates are within the RGIT campus boundary.
    Also detects mock locations and poor accuracy.
    """
    settings = get_current_geofence_settings(db) if db else None
    center_lat = settings.latitude if settings else RGIT_LATITUDE
    center_lon = settings.longitude if settings else RGIT_LONGITUDE
    allowed_radius = settings.radius_meters if settings else DEFAULT_GEOFENCE_RADIUS_METERS
    is_enforced = settings.enforce_geofence if settings else True

    # 1. Anti-Mock / Fake GPS Guard
    if is_mock:
        if db and username:
            db.add(SecurityAuditLog(
                event_type="MOCK_GPS_DETECTED",
                username=username,
                role="student",
                latitude=user_lat,
                longitude=user_lon,
                details=f"Mock location provider detected for student {username}"
            ))
            db.commit()
        return {
            "valid": False,
            "error_code": "MOCK_LOCATION_DETECTED",
            "message": "Proxy attendance alert: Simulated/Mock GPS detected! Turn off fake GPS applications.",
            "distance_meters": None,
            "allowed_radius": allowed_radius,
            "is_inside": False
        }

    # 2. GPS Accuracy Guard (e.g. if GPS drift or cellular tower triangulation is too inaccurate)
    if accuracy_meters and accuracy_meters > 65.0:
        return {
            "valid": False,
            "error_code": "POOR_GPS_ACCURACY",
            "message": f"GPS signal accuracy too weak (±{accuracy_meters:.1f}m). Please enable High Accuracy GPS and step near an open area.",
            "distance_meters": None,
            "allowed_radius": allowed_radius,
            "is_inside": False
        }

    # 3. Geodesic Distance Calculation
    distance = calculate_haversine_distance(user_lat, user_lon, center_lat, center_lon)
    is_inside = distance <= allowed_radius

    if not is_inside and is_enforced:
        if db and username:
            db.add(SecurityAuditLog(
                event_type="GEOFENCE_BREACH_ATTEMPT",
                username=username,
                role="student",
                latitude=user_lat,
                longitude=user_lon,
                details=f"Student {username} attempted check-in {distance:.1f}m away from RGIT (allowed: {allowed_radius:.1f}m)"
            ))
            db.commit()

        meters_outside = round(distance - allowed_radius, 1)
        return {
            "valid": False,
            "error_code": "OUTSIDE_CAMPUS_PERIMETER",
            "message": f"Outside RGIT Campus: You are {meters_outside}m beyond the college boundary ({distance:.1f}m from center). You must be on RGIT campus to mark attendance.",
            "distance_meters": distance,
            "allowed_radius": allowed_radius,
            "is_inside": False
        }

    return {
        "valid": True,
        "error_code": None,
        "message": f"RGIT Campus Location Verified! You are {distance:.1f}m from campus center.",
        "distance_meters": distance,
        "allowed_radius": allowed_radius,
        "is_inside": True
    }
