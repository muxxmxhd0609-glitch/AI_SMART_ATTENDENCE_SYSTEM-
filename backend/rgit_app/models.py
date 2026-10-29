import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from rgit_app.database import Base
from rgit_app.config import RGIT_LATITUDE, RGIT_LONGITUDE, DEFAULT_GEOFENCE_RADIUS_METERS


# ==========================================================
#  UNIFIED USER MODEL (all roles: admin, faculty, student)
# ==========================================================

class User(Base):
    """Unified user account for all roles (admin, faculty, student)."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), nullable=False, default="student")
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=True)
    phone = Column(String(32), nullable=True)
    device_uuid = Column(String(128), nullable=True)
    department = Column(String(128), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


# ==========================================================
#  STUDENT MODELS
# ==========================================================

class StudentProfile(Base):
    """Student academic profile with biometric and device binding data."""
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    usn = Column(String(32), unique=True, index=True, nullable=False)
    department = Column(String(64), default="Computer Science & Engineering")
    semester = Column(Integer, default=7)
    section = Column(String(8), default="A")
    face_registered = Column(Boolean, default=False)
    face_image_path = Column(String(256), nullable=True)
    bound_device_uuid = Column(String(128), nullable=True)

    user = relationship("User", back_populates="student_profile")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    """Individual attendance mark for a student in a subject period."""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    date = Column(String(16), index=True, nullable=False)
    time = Column(String(16), nullable=False)
    period_number = Column(Integer, nullable=False)
    status = Column(String(32), default="PRESENT")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)
    liveness_verified = Column(Boolean, default=True)
    confidence_score = Column(Float, nullable=True)
    snapshot_filename = Column(String(256), nullable=True)
    marked_by = Column(String(64), default="SELF_BIOMETRIC")
    override_reason = Column(Text, nullable=True)
    session_code = Column(String(16), nullable=True)
    faculty_code = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("StudentProfile", back_populates="attendance_records")
    subject = relationship("Subject")


class StudentRegistrationRequest(Base):
    """Self-registration queue: students submit, teachers verify."""
    __tablename__ = "student_registration_requests"

    id = Column(Integer, primary_key=True, index=True)
    usn = Column(String(32), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    email = Column(String(128), nullable=False)
    phone = Column(String(32), nullable=False)
    department = Column(String(64), default="Computer Science & Engineering")
    semester = Column(Integer, default=7)
    section = Column(String(8), default="A")
    hashed_password = Column(String(256), nullable=False)
    photo_filename = Column(String(256), nullable=True)
    face_detected = Column(Boolean, default=False)
    status = Column(String(32), default="PENDING")
    rejection_reason = Column(String(256), nullable=True)
    campaign_code = Column(String(64), nullable=True)
    verified_by = Column(String(64), nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)


# ==========================================================
#  FACULTY MODELS
# ==========================================================

class FacultyProfile(Base):
    """Faculty academic profile with department & subject assignments."""
    __tablename__ = "faculty_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    faculty_code = Column(String(32), unique=True, index=True, nullable=False)
    department = Column(String(64), default="Computer Science & Engineering")
    designation = Column(String(64), default="Assistant Professor")
    assigned_subject_codes = Column(String(256), nullable=True)

    user = relationship("User", back_populates="faculty_profile")
    active_sessions = relationship("ActiveClassSession", back_populates="faculty")


class ActiveClassSession(Base):
    """Live lecture window started by a faculty member."""
    __tablename__ = "active_class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    section = Column(String(8), nullable=False)
    period_number = Column(Integer, nullable=False)
    session_code = Column(String(16), nullable=False)
    is_active = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    faculty = relationship("FacultyProfile", back_populates="active_sessions")
    subject = relationship("Subject")


class TimetableSchedule(Base):
    """Weekly timetable entry mapping period slots to subjects and faculty."""
    __tablename__ = "timetable_schedules"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(16), nullable=False)
    period_number = Column(Integer, nullable=False)
    start_time = Column(String(8), nullable=False)
    end_time = Column(String(8), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    section = Column(String(8), nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty_profiles.id"), nullable=True)
    faculty_name = Column(String(128), nullable=True)
    department = Column(String(128), nullable=True)
    semester = Column(Integer, default=7)
    room = Column(String(32), default="LH-101")

    faculty = relationship("FacultyProfile")
    subject = relationship("Subject")


# ==========================================================
#  ADMIN / SYSTEM MODELS
# ==========================================================

class Subject(Base):
    """Academic subject/course registered in the institution."""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), index=True, nullable=False)
    name = Column(String(128), nullable=False)
    semester = Column(Integer, default=7)
    department = Column(String(128), default="Computer Science & Engineering")


class GeofenceSettings(Base):
    """Campus geofence perimeter configuration."""
    __tablename__ = "geofence_settings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(64), default="Rajiv Gandhi Institute of Technology (RGIT)")
    latitude = Column(Float, default=RGIT_LATITUDE)
    longitude = Column(Float, default=RGIT_LONGITUDE)
    radius_meters = Column(Float, default=DEFAULT_GEOFENCE_RADIUS_METERS)
    enforce_geofence = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class SecurityAuditLog(Base):
    """Security event log for monitoring and compliance."""
    __tablename__ = "security_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), index=True, nullable=False)
    username = Column(String(64), nullable=True)
    role = Column(String(32), nullable=True)
    client_ip = Column(String(64), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================================
#  BACKWARD COMPATIBILITY ALIASES
#  Old code that imported StudentUser, FacultyUser, AdminUser
#  will still work — they all point to the unified User model.
# ==========================================================

StudentUser = User
FacultyUser = User
AdminUser = User
