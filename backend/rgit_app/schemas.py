from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_id: Optional[int] = None
    section: Optional[str] = None
    semester: Optional[int] = None
    selected_semester: Optional[int] = None
    department: Optional[str] = None
    face_registered: Optional[bool] = False
    faculty_code: Optional[str] = None
    assigned_subject_codes: Optional[str] = None
    assigned_subjects: Optional[List[str]] = None

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: Optional[str] = None
    device_uuid: Optional[str] = None
    is_student: Optional[bool] = False
    is_admin: Optional[bool] = False
    department: Optional[str] = None
    semester: Optional[int] = None

class StudentRollLoginRequest(BaseModel):
    usn: Optional[str] = None
    roll_number: Optional[str] = None
    password: Optional[str] = None
    device_uuid: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = None

class UpdateFacultyProfileRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    designation: str

class UpdateStudentRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    semester: Optional[int] = None
    section: Optional[str] = None
    department: Optional[str] = None
    unbind_device: Optional[bool] = False
    password: Optional[str] = None
    photo_base64: Optional[str] = None

class StudentResetPasswordRequest(BaseModel):
    usn: str
    verification_credential: str
    new_password: str

class BindDeviceRequest(BaseModel):
    device_uuid: str
    usn: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # "admin", "faculty", "student"
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = "Computer Science & Engineering"
    semester: Optional[int] = 7
    section: Optional[str] = "A"
    faculty_code: Optional[str] = None
    designation: Optional[str] = None

class GeofenceStatus(BaseModel):
    campus_name: str
    target_latitude: float
    target_longitude: float
    radius_meters: float
    enforced: bool
    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None
    distance_meters: Optional[float] = None
    is_inside: bool
    message: str

class GeofenceUpdateRequest(BaseModel):
    radius_meters: float = Field(..., ge=50, le=5000)
    enforce_geofence: bool

class MarkAttendanceRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy_meters: Optional[float] = None
    is_mock_location: Optional[bool] = False
    device_uuid: Optional[str] = None
    image_base64: str  # Captured face image
    subject_code: Optional[str] = None
    session_code: Optional[str] = None
    blink_detected: Optional[bool] = True
    smile_detected: Optional[bool] = False

class AttendanceOut(BaseModel):
    id: int
    student_usn: str
    student_name: str
    section: str
    subject_code: str
    subject_name: str
    date: str
    time: str
    period_number: int
    status: str
    distance_meters: Optional[float]
    liveness_verified: bool
    confidence_score: Optional[float]
    snapshot_filename: Optional[str]
    marked_by: str
    override_reason: Optional[str]

    class Config:
        from_attributes = True

class ManualOverrideRequest(BaseModel):
    student_usn: str
    subject_code: str
    date: str
    period_number: int
    status: str = "MANUAL_OVERRIDE"  # "PRESENT", "LATE", "EXCUSED"
    reason: str

class StartSessionRequest(BaseModel):
    subject_code: str
    section: str
    period_number: int
    duration_minutes: int = 15

class RegisterFaceRequest(BaseModel):
    usn: str
    image_base64: str

class DefaulterStudent(BaseModel):
    usn: str
    full_name: str
    section: str
    total_classes: int
    attended_classes: int
    attendance_percentage: float
    is_defaulter: bool  # True if < 75%

class SecurityLogOut(BaseModel):
    id: int
    event_type: str
    username: Optional[str]
    role: Optional[str]
    client_ip: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    details: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True

class StudentRegistrationSubmit(BaseModel):
    usn: str
    full_name: str
    email: str
    phone: str
    department: Optional[str] = None
    semester: Optional[int] = 1
    section: Optional[str] = "A"
    password: Optional[str] = "student123"
    photo_base64: str
    campaign_code: Optional[str] = None

class StudentRegistrationOut(BaseModel):
    id: int
    usn: str
    full_name: str
    email: str
    phone: str
    department: str
    semester: int
    section: str
    status: str
    face_detected: bool
    photo_url: Optional[str] = None
    rejection_reason: Optional[str] = None
    campaign_code: Optional[str] = None
    verified_by: Optional[str] = None
    submitted_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VerificationActionRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    rejection_reason: Optional[str] = None

class CreateFacultyRequest(BaseModel):
    full_name: str
    faculty_code: str
    username: str
    password: Optional[str] = "faculty123"
    designation: Optional[str] = "Assistant Professor"
    department: Optional[str] = "Computer Science & Engineering"
    email: Optional[str] = None
    phone: Optional[str] = None
    subject_codes: List[str] = []

class UpdateFacultyCredentialsRequest(BaseModel):
    new_username: Optional[str] = None
    new_password: str


class UpdateFacultySubjectsRequest(BaseModel):
    subject_codes: List[str]


class CreateHODRequest(BaseModel):
    department: str
    full_name: str
    username: str
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None


class UpdateHODPasswordRequest(BaseModel):
    new_password: Optional[str] = None
    new_username: Optional[str] = None
    department: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


class TimetableEntryRequest(BaseModel):
    department: str
    semester: int
    section: str = "A"
    day_of_week: str = "Monday"
    period_number: int
    subject_code: str
    subject_name: Optional[str] = None
    faculty_name: Optional[str] = None
    faculty_id: Optional[int] = None
    room: Optional[str] = "LH-101"
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class TimetableMatrixSaveRequest(BaseModel):
    department: str
    semester: int
    section: str = "A"
    day_of_week: str = "Monday"
    entries: List[TimetableEntryRequest]
