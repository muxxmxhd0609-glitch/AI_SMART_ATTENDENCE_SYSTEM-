# 🎓 AI SMART ATTENDANCE SYSTEM — COMPREHENSIVE FEATURES GUIDE

The **AI Smart Attendance System** is an enterprise-grade biometric attendance and classroom management platform combining Computer Vision, WebRTC live video streaming, academic scheduling algorithms, role-based security, and analytics.

---

## 📋 Table of Contents
1. [Core Biometrics & Computer Vision Engine](#1-core-biometrics--computer-vision-engine)
2. [Academic Timetable & Schedule Enforcement](#2-academic-timetable--schedule-enforcement)
3. [Authentication & Role-Based Access Control (RBAC)](#3-authentication--role-based-access-control-rbac)
4. [Student Record & Registry Management (CRUD)](#4-student-record--registry-management-crud)
5. [Attendance Verification & Proof-of-Presence](#5-attendance-verification--proof-of-presence)
6. [Security, Audit Logging & Anti-Spoofing](#6-security-audit-logging--anti-spoofing)
7. [Reporting, Visual Analytics & Data Export](#7-reporting-visual-analytics--data-export)
8. [Mobile QR & GPS Geofencing Subsystem](#8-mobile-qr--gps-geofencing-subsystem)
9. [Database Architecture & Data Integrity](#9-database-architecture--data-integrity)
10. [System Architecture & Technology Stack](#10-system-architecture--technology-stack)

---

## 1. Core Biometrics & Computer Vision Engine

* **128-Dimensional Facial Embeddings**: Uses deep metric learning (dlib ResNet backbone) to extract robust 128-d face vector representations for enrolled students.
* **Euclidean Distance Matching**: Compares live camera faces with registered dataset embeddings using a fine-tuned threshold (`FACE_TOLERANCE = 0.50`) to minimize False Acceptance Rates (FAR).
* **Multi-Frame Confirmation Window**:
  * Prevents false triggers or accidental walks past the camera.
  * Requires **5 consecutive confirmed frames** within an **8-second sliding window** before marking attendance.
* **Low-Latency WebRTC Video Pipeline**:
  * Built using `streamlit-webrtc` and `PyAV` for smooth, native browser webcam streaming.
  * Real-time OpenCV overlay displaying bounding boxes, student names, roll numbers, confirmation countdowns, and live timestamps.
* **Automated Unknown Face Capture**:
  * If an unrecognized face persists in front of the camera for more than 5 seconds, the system automatically crops the face and archives it into `unknown/` with an audit event.

---

## 2. Academic Timetable & Schedule Enforcement

* **Weekly Timetable Matrix**: Pre-configured schedule for Department of CSE 7th Semester covering Sections A & B from Monday through Saturday.
* **Subject Coverage**:
  * *Internet of Things (IOT)*
  * *Parallel Computing*
  * *Cryptography and Network Security*
  * *Big Data Analytics*
  * *Non-Conventional Energy Resources*
  * *Major Project Phase-II*
* **Real-Time Clock & Period Synchronization**:
  * Period 1: 08:30 AM – 09:30 AM
  * Period 2: 09:30 AM – 10:30 AM
  * Period 3: 10:45 AM – 11:45 AM
  * Period 4: 11:45 AM – 12:45 PM
  * Period 5: 01:30 PM – 02:30 PM
  * Period 6: 02:30 PM – 03:30 PM
  * Period 7: 03:30 PM – 04:30 PM
* **Break Period Restrictions**:
  * `SHORT BREAK` (10:30 AM – 10:45 AM): Attendance locked.
  * `LUNCH BREAK` (12:45 PM – 01:30 PM): Attendance locked for standard subjects.
* **Major Project Phase-II Override**:
  * Intelligent exception handling: Allows attendance for Major Project Phase-II without time restrictions to facilitate flexible lab and project work.
* **Server-Side Verification**: Attendance submission independently validates server time to prevent client-side timetable manipulation.

---

## 3. Authentication & Role-Based Access Control (RBAC)

* **Dual-Portal Access**:
  * **👨‍💼 Administrator Portal** (`admin` / `admin123`): Complete access to student records, live cameras, analytics, image galleries, and security logs.
  * **👨‍🎓 Student Portal** (`student` / `student123`): Sandboxed access restricted strictly to taking attendance via webcam.
* **Role Mismatch & Unauthorized Access Shield**: Rejects cross-role login attempts and logs suspicious activities.
* **Session Persistence**: Streamlit session state management with clean logout workflows.

---

## 4. Student Record & Registry Management (CRUD)

* **Student Registration**:
  * Input Name, Roll Number, and Section (`A` or `B`).
  * Upload face photo with automated validation checking for **strictly one face**.
  * Saves reference face image to `dataset/<ROLL>.jpg` and writes record to SQLite.
* **Student Profile Editor**:
  * Edit student name, roll number, section, or update face photo.
  * Automatic file renaming and cascading database updates across attendance logs.
* **Student Record Retrieval**:
  * Quick lookup by Roll Number to view complete student profile, reference image, and cumulative attendance count.
* **Student Deletion**:
  * One-click deletion with automatic cleanup of enrolled dataset photos.

---

## 5. Attendance Verification & Proof-of-Presence

* **Photographic Evidence Capture**: Every time attendance is marked, a camera snapshot is captured and stored in `attendance_images/` with format `<ROLL>_<SECTION>_<DATE>_<TIMESTAMP>.jpg`.
* **Duplicate Prevention**:
  * SQLite query validation prevents marking duplicate attendance for the same student on the same date, subject, and period.
* **Admin Direct Camera & Student Camera**: Dual interfaces for taking attendance either via administrative supervision or self-service kiosk mode.

---

## 6. Security, Audit Logging & Anti-Spoofing

* **Real-Time Security Event Logging**:
  * Every critical event is captured in `security_logs` with timestamp, event type, roll number, section, client IP, and details.
  * Logged events include: `ADMIN LOGIN`, `STUDENT LOGIN`, `FAILED LOGIN`, `STUDENT REGISTERED`, `STUDENT UPDATED`, `STUDENT DELETED`, `ATTENDANCE MARKED`, `DUPLICATE ATTENDANCE`, `UNKNOWN FACE`, `TIMETABLE MISMATCH`, `PERIOD MISMATCH`.
* **Admin Biometric Registration**:
  * Dedicated module to register and store administrator biometric face reference photos.
* **Client IP Tracking**: Extracts real client IP addresses from HTTP headers (`X-Forwarded-For`, `X-Real-IP`).

---

## 7. Reporting, Visual Analytics & Data Export

* **Executive Dashboard**:
  * Live status cards: Class Strength, Students Present Today, Total Attendance Records, and Daily Attendance Percentage.
  * Visual Student Grid: Photo cards of all enrolled students in the selected section.
* **Multidimensional Attendance Filtering**:
  * Filter records by **Section**, **Subject**, **Date**, or live text search by **Name/Roll Number**.
* **1-Click CSV Export**:
  * Export filtered attendance records (`attendance_report.csv`).
  * Export complete security audit logs (`security_logs.csv`).
* **Visual Trend Analytics**:
  * Matplotlib daily attendance trend line graphs plotted across dates for any chosen subject and section.
* **Inspection Galleries**:
  * **🖼️ Attendance Images Gallery**: Visual grid of all captured attendance proof snapshots.
  * **❓ Unknown Faces Gallery**: Visual grid of unrecognized faces detected by the camera.

---

## 8. Mobile QR & GPS Geofencing Subsystem (`production_mobile_attendance.py`)

* **FastAPI Backend**: Lightweight mobile attendance service.
* **QR Code Check-in**: Dynamic PNG QR code streaming (`/qr`) for classroom display.
* **GPS Campus Geofencing**:
  * Validates student device coordinates against campus GPS boundaries (`ALLOWED_LAT`, `ALLOWED_LON`, `ALLOWED_RADIUS`).
  * Prevents remote proxy attendance.
* **Time-Window Enforced Mobile Check-in**: Enforces valid mobile check-in hours (`START_TIME` to `END_TIME`).

---

## 9. Database Architecture & Data Integrity

* **High-Concurrency SQLite Configuration**:
  * `PRAGMA journal_mode=WAL` (Write-Ahead Logging) for non-blocking concurrent reads and writes from WebRTC threads.
  * `PRAGMA busy_timeout=30000` to prevent database locks.
  * `PRAGMA synchronous=NORMAL` for optimal write performance.
* **Automated Migrations & Text Normalization**:
  * Automatic schema checking and dynamic column additions (`class_name`, `section`, `subject`, `period`).
  * Automatic data normalization converting all names, roll numbers, sections, and subjects to clean, uppercase strings.

---

## 10. System Architecture & Technology Stack

```
[ Client Layer ]  ──>  Streamlit Web UI / WebRTC Camera / Mobile Browser
[ Vision Layer ]  ──>  OpenCV (cv2) + dlib + face_recognition + PyAV
[ Logic Layer  ]  ──>  Timetable Engine + Multi-Frame Validator + RBAC Auth
[ Storage Layer]  ──>  SQLite3 (WAL Mode) + Filesystem (dataset/, attendance_images/, unknown/)
```

| Component | Technology |
| :--- | :--- |
| **Frontend & UI** | Streamlit, HTML5, CSS Glassmorphism |
| **Camera Streaming** | Streamlit-WebRTC, PyAV, WebSockets |
| **Computer Vision** | OpenCV (`cv2`), dlib, `face-recognition` |
| **Database** | SQLite 3 (WAL mode), SQLAlchemy (Mobile extension) |
| **Data & Plotting** | Pandas, NumPy, Matplotlib, Pillow |
| **Mobile Service** | FastAPI, Uvicorn, QR Code Generator, HTML5 Geolocation |
| **Environment** | Python 3.11, `uv` Package Manager |
