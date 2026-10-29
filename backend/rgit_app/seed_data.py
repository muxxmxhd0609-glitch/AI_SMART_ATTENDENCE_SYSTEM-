"""
RGIT Bangalore AI Smart Attendance System - Comprehensive Multi-Tenant Seeder
Populates:
1. Master System DB (attendance_system.db) with MOHD / 0609 and full multi-department registry.
2. All 9 Department Databases:
   - attendance_EE.db (Electrical Engineering)
   - attendance_CSE.db (Computer Science and Engineering)
   - attendance_ECE.db (Electronics and Communication)
   - attendance_BME.db (Bio-Medical Engineering)
   - attendance_ME.db (Mechanical Engineering)
   - attendance_CSE_AI.db (CSE - Artificial Intelligence)
   - attendance_CSE_IOT_CS_BT.db (CSE - IoT, Cyber Security & Blockchain)
   - attendance_ISE.db (Information Science & Engineering)
   - attendance_AIML.db (Artificial Intelligence & Machine Learning)
"""
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import random

from rgit_app.database import (
    engine, Base, SessionLocal, init_all_databases,
    DEPARTMENT_SESSIONS, get_department_session, DEPARTMENT_DB_REGISTRY,
    resolve_department_key
)
from rgit_app.models import (
    User, StudentProfile, FacultyProfile, Subject,
    TimetableSchedule, GeofenceSettings, AttendanceRecord, SecurityAuditLog
)
from rgit_app.auth import hash_password
from rgit_app.config import RGIT_LATITUDE, RGIT_LONGITUDE, DEFAULT_GEOFENCE_RADIUS_METERS
from rgit_app.timetable import DEFAULT_SUBJECTS

# Multi-Department Comprehensive Dataset
DEPARTMENT_DATASETS = {
    "CSE": {
        "name": "B.E in Computer Science and Engineering",
        "hod": {"username": "hod_cse", "name": "Dr. Arudra A", "pass": "arudra123", "email": "arudra.a@rgit.ac.in"},
        "faculty": [
            {"u": "ramesh", "p": "faculty123", "name": "Dr. Ramesh B", "code": "FAC_PHY_01", "sem": 1, "sub": "Engineering Physics (BCS102)"},
            {"u": "kavitha", "p": "faculty123", "name": "Mrs. Kavitha S", "code": "FAC_MAT_01", "sem": 1, "sub": "Calculus & Linear Algebra (BCS101)"},
            {"u": "chethan", "p": "faculty123", "name": "Mr. Chethan K", "code": "FAC_CSE_12", "sem": 1, "sub": "C Programming (BCS103)"},
            {"u": "sureshb", "p": "faculty123", "name": "Dr. Suresh Babu", "code": "FAC_CHM_01", "sem": 2, "sub": "Applied Chemistry (BCS202)"},
            {"u": "deepa", "p": "faculty123", "name": "Mrs. Deepa Rao", "code": "FAC_CSE_07", "sem": 3, "sub": "Data Structures & Apps (BCS304)"},
            {"u": "harish", "p": "faculty123", "name": "Mr. Harish M", "code": "FAC_CSE_08", "sem": 3, "sub": "Digital Design & Org (BCS302)"},
            {"u": "nandakumar", "p": "faculty123", "name": "Mr. Nandakumar", "code": "FAC_CSE_03", "sem": 7, "sub": "Cryptography & Network Security (BCS703)"},
            {"u": "manjunath", "p": "faculty123", "name": "Dr. Manjunath G", "code": "FAC_CSE_09", "sem": 4, "sub": "Design & Analysis of Alg (BCS401)"},
            {"u": "priyasharma", "p": "faculty123", "name": "Mrs. Priya Sharma", "code": "FAC_CSE_10", "sem": 4, "sub": "Microcontrollers (BCS402)"},
            {"u": "roopa", "p": "faculty123", "name": "Dr. S. R. Patil", "code": "FAC_CSE_02", "sem": 7, "sub": "Internet of Things (BCS702)"},
            {"u": "soniya", "p": "faculty123", "name": "Mrs. Soniya Komal V", "code": "FAC_CSE_04", "sem": 7, "sub": "Big Data Analytics (BCS714D)"},
            {"u": "nagalakshmi", "p": "faculty123", "name": "Ms. S. Nagalakshmi", "code": "FAC_CSE_05", "sem": 7, "sub": "Non-Conventional Energy Resources (BME755D)"},
            {"u": "bhagyashri", "p": "faculty123", "name": "Mrs. Bhagyashri Vakde", "code": "FAC_CSE_06", "sem": 7, "sub": "Major Project Phase-II (BCS786)"},
            {"u": "faculty1", "p": "faculty123", "name": "Prof. Anitha M", "code": "FAC_CSE_01", "sem": 7, "sub": "Cloud Computing & Virtualization (BCS701)"}
        ],
        "students": [
            {"usn": "1RG24CS001", "name": "Aditya Kumar", "sem": 1, "sec": "A"},
            {"usn": "1RG24CS012", "name": "Bhavana N", "sem": 1, "sec": "A"},
            {"usn": "1RG24CS025", "name": "Chandan Gowda", "sem": 2, "sec": "B"},
            {"usn": "1RG24CS038", "name": "Deepika M", "sem": 2, "sec": "B"},
            {"usn": "1RG23CS005", "name": "Farhan Ali", "sem": 3, "sec": "A"},
            {"usn": "1RG23CS019", "name": "Gautham R", "sem": 3, "sec": "B"},
            {"usn": "1RG23CS033", "name": "Harshitha K", "sem": 4, "sec": "A"},
            {"usn": "1RG23CS048", "name": "Imran Khan", "sem": 4, "sec": "B"},
            {"usn": "1RG22CS010", "name": "Jeevan P", "sem": 5, "sec": "A"},
            {"usn": "1RG22CS028", "name": "Keerthi S", "sem": 5, "sec": "B"},
            {"usn": "1RG22CS045", "name": "Lokesh N", "sem": 6, "sec": "A"},
            {"usn": "1RG22CS062", "name": "Megha R", "sem": 6, "sec": "B"},
            {"usn": "1RG21CS001", "name": "Aakash Gowda", "sem": 7, "sec": "A"},
            {"usn": "1RG21CS042", "name": "Divya Ramesh", "sem": 7, "sec": "A"},
            {"usn": "1RG21CS085", "name": "Mohammed Farhan", "sem": 7, "sec": "B"},
            {"usn": "1RG21CS104", "name": "Sneha Reddy", "sem": 7, "sec": "B"},
            {"usn": "1RG24CS409", "name": "Muzammil", "sem": 7, "sec": "A"},
            {"usn": "1RG21CS002", "name": "Abhishek Verma", "sem": 8, "sec": "A"},
            {"usn": "1RG21CS050", "name": "Naveen Kumar", "sem": 8, "sec": "B"}
        ]
    },
    "ECE": {
        "name": "B.E in Electronics and Communication",
        "hod": {"username": "hod_ece", "name": "Dr. Sunitha K", "pass": "hod123", "email": "hod.ece@rgit.ac.in"},
        "faculty": [
            {"u": "rajeshv", "p": "faculty123", "name": "Prof. Rajesh V", "code": "FAC_ECE_01", "sem": 1, "sub": "Basic Electronics (BEC101)"},
            {"u": "sunithak", "p": "faculty123", "name": "Dr. Sunitha K", "code": "FAC_ECE_02", "sem": 3, "sub": "Network Analysis (BEC301)"},
            {"u": "vinaym", "p": "faculty123", "name": "Prof. Vinay M", "code": "FAC_ECE_03", "sem": 3, "sub": "Digital System Design (BEC302)"},
            {"u": "meenakshi", "p": "faculty123", "name": "Dr. Meenakshi S", "code": "FAC_ECE_04", "sem": 4, "sub": "Signals & Systems (BEC401)"},
            {"u": "archanap", "p": "faculty123", "name": "Mrs. Archana P", "code": "FAC_ECE_05", "sem": 5, "sub": "Electromagnetic Waves (BEC501)"},
            {"u": "kiranr", "p": "faculty123", "name": "Prof. Kiran R", "code": "FAC_ECE_06", "sem": 6, "sub": "VLSI Design (BEC601)"},
            {"u": "sunithak7", "p": "faculty123", "name": "Dr. Sunitha K", "code": "FAC_ECE_07", "sem": 7, "sub": "Wireless Communication (BEC701)"},
            {"u": "meenakshi7", "p": "faculty123", "name": "Dr. Meenakshi S", "code": "FAC_ECE_08", "sem": 7, "sub": "Embedded Systems & IoT (BEC702)"}
        ],
        "students": [
            {"usn": "1RG24EC001", "name": "Abhiram S", "sem": 1, "sec": "A"},
            {"usn": "1RG24EC015", "name": "Chaitra R", "sem": 1, "sec": "B"},
            {"usn": "1RG24EC022", "name": "Darshan M", "sem": 2, "sec": "A"},
            {"usn": "1RG23EC008", "name": "Hemanth Kumar", "sem": 3, "sec": "A"},
            {"usn": "1RG23EC021", "name": "Ishwarya K", "sem": 3, "sec": "B"},
            {"usn": "1RG23EC030", "name": "Kiran Rao", "sem": 4, "sec": "A"},
            {"usn": "1RG22EC012", "name": "Manoj Gowda", "sem": 5, "sec": "A"},
            {"usn": "1RG22EC027", "name": "Neha Sharma", "sem": 5, "sec": "B"},
            {"usn": "1RG22EC039", "name": "Pranav M", "sem": 6, "sec": "A"},
            {"usn": "1RG21EC001", "name": "Rahul Nair", "sem": 7, "sec": "A"},
            {"usn": "1RG21EC015", "name": "Ananya Hegde", "sem": 7, "sec": "A"},
            {"usn": "1RG21EC042", "name": "Sanjay Krishna", "sem": 7, "sec": "B"},
            {"usn": "1RG21EC060", "name": "Tanvi Murthy", "sem": 7, "sec": "B"},
            {"usn": "1RG21EC005", "name": "Vikas Reddy", "sem": 8, "sec": "A"}
        ]
    },
    "EE": {
        "name": "B.E in Electrical Engineering",
        "hod": {"username": "hod_ee", "name": "Dr. V. Suresh", "pass": "hod123", "email": "hod.ee@rgit.ac.in"},
        "faculty": [
            {"u": "vsuresh", "p": "faculty123", "name": "Dr. V. Suresh", "code": "FAC_EEE_01", "sem": 1, "sub": "Basic Electrical Engineering (BEE101)"},
            {"u": "ananthak", "p": "faculty123", "name": "Prof. Anantha Kumar", "code": "FAC_EEE_02", "sem": 3, "sub": "Electrical Machines-I (BEE301)"},
            {"u": "lakshmir", "p": "faculty123", "name": "Dr. Lakshmi R", "code": "FAC_EEE_03", "sem": 4, "sub": "Power Electronics (BEE401)"},
            {"u": "praveeng", "p": "faculty123", "name": "Prof. Praveen G", "code": "FAC_EEE_04", "sem": 5, "sub": "Control Systems (BEE501)"},
            {"u": "vsuresh7", "p": "faculty123", "name": "Dr. V. Suresh", "code": "FAC_EEE_05", "sem": 7, "sub": "Power System Protection (BEE701)"},
            {"u": "lakshmir7", "p": "faculty123", "name": "Dr. Lakshmi R", "code": "FAC_EEE_06", "sem": 7, "sub": "Renewable Energy Sources (BEE702)"}
        ],
        "students": [
            {"usn": "1RG24EE002", "name": "Arjun Prasad", "sem": 1, "sec": "A"},
            {"usn": "1RG24EE018", "name": "Bhavishya M", "sem": 1, "sec": "B"},
            {"usn": "1RG23EE010", "name": "Chetan Gowda", "sem": 3, "sec": "A"},
            {"usn": "1RG23EE025", "name": "Divyashree R", "sem": 3, "sec": "B"},
            {"usn": "1RG22EE007", "name": "Girish Babu", "sem": 5, "sec": "A"},
            {"usn": "1RG22EE021", "name": "Harini S", "sem": 5, "sec": "B"},
            {"usn": "1RG21EE001", "name": "Karthik Raja", "sem": 7, "sec": "A"},
            {"usn": "1RG21EE020", "name": "Pooja Rao", "sem": 7, "sec": "B"},
            {"usn": "1RG21EE035", "name": "Suresh Kumar", "sem": 7, "sec": "B"},
            {"usn": "1RG21EE009", "name": "Vinod Patil", "sem": 8, "sec": "A"}
        ]
    },
    "BME": {
        "name": "B.E in Bio-Medical Engineering",
        "hod": {"username": "hod_bme", "name": "Dr. Preethi M", "pass": "hod123", "email": "hod.bme@rgit.ac.in"},
        "faculty": [
            {"u": "preethim", "p": "faculty123", "name": "Dr. Preethi M", "code": "FAC_BME_01", "sem": 1, "sub": "Introduction to Biomedical (BBM101)"},
            {"u": "sudheerk", "p": "faculty123", "name": "Prof. Sudheer K", "code": "FAC_BME_02", "sem": 3, "sub": "Biomedical Transducers (BBM301)"},
            {"u": "geethan", "p": "faculty123", "name": "Dr. Geetha N", "code": "FAC_BME_03", "sem": 4, "sub": "Human Anatomy & Phys (BBM401)"},
            {"u": "preethim5", "p": "faculty123", "name": "Dr. Preethi M", "code": "FAC_BME_04", "sem": 5, "sub": "Biomedical Instrumentation (BBM501)"},
            {"u": "sudheerk7", "p": "faculty123", "name": "Prof. Sudheer K", "code": "FAC_BME_05", "sem": 7, "sub": "Medical Imaging Systems (BBM701)"},
            {"u": "geethan7", "p": "faculty123", "name": "Dr. Geetha N", "code": "FAC_BME_06", "sem": 7, "sub": "Biomaterials & Artificial Organs (BBM702)"}
        ],
        "students": [
            {"usn": "1RG24BM001", "name": "Anil Kumar", "sem": 1, "sec": "A"},
            {"usn": "1RG24BM012", "name": "Bindu S", "sem": 1, "sec": "B"},
            {"usn": "1RG23BM005", "name": "Deepak R", "sem": 3, "sec": "A"},
            {"usn": "1RG23BM018", "name": "Esha Gowda", "sem": 3, "sec": "B"},
            {"usn": "1RG22BM009", "name": "Gowtham K", "sem": 5, "sec": "A"},
            {"usn": "1RG22BM022", "name": "Kavya M", "sem": 5, "sec": "B"},
            {"usn": "1RG21BM001", "name": "Monisha P", "sem": 7, "sec": "A"},
            {"usn": "1RG21BM018", "name": "Nikhil Raj", "sem": 7, "sec": "A"},
            {"usn": "1RG21BM030", "name": "Pramod V", "sem": 7, "sec": "B"},
            {"usn": "1RG21BM004", "name": "Ranjitha K", "sem": 8, "sec": "A"}
        ]
    },
    "ME": {
        "name": "B.E in Mechanical Engineering",
        "hod": {"username": "hod_me", "name": "Dr. Ravishankar H", "pass": "hod123", "email": "hod.me@rgit.ac.in"},
        "faculty": [
            {"u": "ravishankar", "p": "faculty123", "name": "Dr. Ravishankar H", "code": "FAC_ME_01", "sem": 1, "sub": "Elements of Mechanical Engg (BME101)"},
            {"u": "siddarajum", "p": "faculty123", "name": "Prof. Siddaraju M", "code": "FAC_ME_02", "sem": 3, "sub": "Thermodynamics (BME301)"},
            {"u": "jagadeeshb", "p": "faculty123", "name": "Dr. Jagadeesh B", "code": "FAC_ME_03", "sem": 4, "sub": "Fluid Mechanics (BME401)"},
            {"u": "ravishankar5", "p": "faculty123", "name": "Dr. Ravishankar H", "code": "FAC_ME_04", "sem": 5, "sub": "Design of Machine Elements (BME501)"},
            {"u": "siddarajum7", "p": "faculty123", "name": "Prof. Siddaraju M", "code": "FAC_ME_05", "sem": 7, "sub": "Automobile Engineering (BME701)"},
            {"u": "jagadeeshb7", "p": "faculty123", "name": "Dr. Jagadeesh B", "code": "FAC_ME_06", "sem": 7, "sub": "Robotics & Automation (BME702)"}
        ],
        "students": [
            {"usn": "1RG24ME003", "name": "Adarsh Rao", "sem": 1, "sec": "A"},
            {"usn": "1RG24ME015", "name": "Bharath Kumar", "sem": 1, "sec": "B"},
            {"usn": "1RG23ME007", "name": "Channabasava", "sem": 3, "sec": "A"},
            {"usn": "1RG23ME020", "name": "Dhanush G", "sem": 3, "sec": "B"},
            {"usn": "1RG22ME011", "name": "Ganesh Naik", "sem": 5, "sec": "A"},
            {"usn": "1RG22ME025", "name": "Harish Babu", "sem": 5, "sec": "B"},
            {"usn": "1RG21ME001", "name": "Jayanth Gowda", "sem": 7, "sec": "A"},
            {"usn": "1RG21ME025", "name": "Manjunath S", "sem": 7, "sec": "A"},
            {"usn": "1RG21ME040", "name": "Pavan Kumar", "sem": 7, "sec": "B"},
            {"usn": "1RG21ME008", "name": "Rohit M", "sem": 8, "sec": "A"}
        ]
    },
    "CSE_AI": {
        "name": "B.E in Computer Science & Engineering (Artificial Intelligence)",
        "hod": {"username": "hod_cse_ai", "name": "Dr. Anusha P", "pass": "hod123", "email": "hod.cseai@rgit.ac.in"},
        "faculty": [
            {"u": "anushap", "p": "faculty123", "name": "Dr. Anusha P", "code": "FAC_CAI_01", "sem": 1, "sub": "Foundations of AI & Python (BAI101)"},
            {"u": "kiranbabu", "p": "faculty123", "name": "Prof. Kiran Babu", "code": "FAC_CAI_02", "sem": 3, "sub": "Discrete Math & Logic for AI (BAI301)"},
            {"u": "swethav", "p": "faculty123", "name": "Dr. Swetha V", "code": "FAC_CAI_03", "sem": 4, "sub": "Neural Networks & Fuzzy Logic (BAI401)"},
            {"u": "anushap5", "p": "faculty123", "name": "Dr. Anusha P", "code": "FAC_CAI_04", "sem": 5, "sub": "Natural Language Processing (BAI501)"},
            {"u": "kiranbabu7", "p": "faculty123", "name": "Prof. Kiran Babu", "code": "FAC_CAI_05", "sem": 7, "sub": "Generative AI & LLMs (BAI701)"},
            {"u": "swethav7", "p": "faculty123", "name": "Dr. Swetha V", "code": "FAC_CAI_06", "sem": 7, "sub": "Computer Vision & Robotics (BAI702)"}
        ],
        "students": [
            {"usn": "1RG24AI002", "name": "Akshata R", "sem": 1, "sec": "A"},
            {"usn": "1RG24AI016", "name": "Bhuvanesh", "sem": 1, "sec": "B"},
            {"usn": "1RG23AI008", "name": "Charan Deep", "sem": 3, "sec": "A"},
            {"usn": "1RG23AI022", "name": "Dimple P", "sem": 3, "sec": "B"},
            {"usn": "1RG22AI014", "name": "Faizan Ahmed", "sem": 5, "sec": "A"},
            {"usn": "1RG22AI030", "name": "Geetanjali", "sem": 5, "sec": "B"},
            {"usn": "1RG21AI001", "name": "Harsha Vardhan", "sem": 7, "sec": "A"},
            {"usn": "1RG21AI032", "name": "Kavya Shree", "sem": 7, "sec": "A"},
            {"usn": "1RG21AI045", "name": "Pradeep R", "sem": 7, "sec": "B"},
            {"usn": "1RG21AI010", "name": "Siddharth G", "sem": 8, "sec": "A"}
        ]
    },
    "CSE_IOT_CS_BT": {
        "name": "B.E in Computer Science & Engineering (Internet of things Cyber Security with Blockchain Technology)",
        "hod": {"username": "hod_cse_iot", "name": "Dr. Keshava Murthy", "pass": "hod123", "email": "hod.cseiot@rgit.ac.in"},
        "faculty": [
            {"u": "keshavam", "p": "faculty123", "name": "Dr. Keshava Murthy", "code": "FAC_IOT_01", "sem": 1, "sub": "Intro to IoT & C Programming (BIT101)"},
            {"u": "hariprasadt", "p": "faculty123", "name": "Prof. Hariprasad T", "code": "FAC_IOT_02", "sem": 3, "sub": "Cyber Security Fundamentals (BIT301)"},
            {"u": "shilpan", "p": "faculty123", "name": "Dr. Shilpa N", "code": "FAC_IOT_03", "sem": 4, "sub": "Cryptography & PKI (BIT401)"},
            {"u": "keshavam5", "p": "faculty123", "name": "Dr. Keshava Murthy", "code": "FAC_IOT_04", "sem": 5, "sub": "Wireless Sensor Networks (BIT501)"},
            {"u": "hariprasadt7", "p": "faculty123", "name": "Prof. Hariprasad T", "code": "FAC_IOT_05", "sem": 7, "sub": "Blockchain & Smart Contracts (BIT701)"},
            {"u": "shilpan7", "p": "faculty123", "name": "Dr. Shilpa N", "code": "FAC_IOT_06", "sem": 7, "sub": "Ethical Hacking & Network Defense (BIT702)"}
        ],
        "students": [
            {"usn": "1RG24CB001", "name": "Ajay Gowda", "sem": 1, "sec": "A"},
            {"usn": "1RG24CB014", "name": "Bindu Shree", "sem": 1, "sec": "B"},
            {"usn": "1RG23CB006", "name": "Chidananda", "sem": 3, "sec": "A"},
            {"usn": "1RG23CB019", "name": "Divya K", "sem": 3, "sec": "B"},
            {"usn": "1RG22CB011", "name": "Hemant Kumar", "sem": 5, "sec": "A"},
            {"usn": "1RG22CB025", "name": "Jahnavi R", "sem": 5, "sec": "B"},
            {"usn": "1RG21CB001", "name": "Manoj V", "sem": 7, "sec": "A"},
            {"usn": "1RG21CB024", "name": "Rakshitha N", "sem": 7, "sec": "A"},
            {"usn": "1RG21CB038", "name": "Suprith G", "sem": 7, "sec": "B"},
            {"usn": "1RG21CB007", "name": "Tejas M", "sem": 8, "sec": "A"}
        ]
    },
    "ISE": {
        "name": "B.E in Information Science & Engineering",
        "hod": {"username": "hod_ise", "name": "Dr. Sharada B", "pass": "hod123", "email": "hod.ise@rgit.ac.in"},
        "faculty": [
            {"u": "sharadab", "p": "faculty123", "name": "Dr. Sharada B", "code": "FAC_ISE_01", "sem": 1, "sub": "Information Systems & C (BIS101)"},
            {"u": "prasannak", "p": "faculty123", "name": "Prof. Prasanna K", "code": "FAC_ISE_02", "sem": 3, "sub": "Data Structures & File Systems (BIS301)"},
            {"u": "madhukars", "p": "faculty123", "name": "Dr. Madhukar S", "code": "FAC_ISE_03", "sem": 4, "sub": "Software Engineering & Testing (BIS401)"},
            {"u": "sharadab5", "p": "faculty123", "name": "Dr. Sharada B", "code": "FAC_ISE_04", "sem": 5, "sub": "Data Mining & Business Analytics (BIS501)"},
            {"u": "prasannak7", "p": "faculty123", "name": "Prof. Prasanna K", "code": "FAC_ISE_05", "sem": 7, "sub": "Cloud Computing & DevOps (BIS701)"},
            {"u": "madhukars7", "p": "faculty123", "name": "Dr. Madhukar S", "code": "FAC_ISE_06", "sem": 7, "sub": "Information Retrieval & NLP (BIS702)"}
        ],
        "students": [
            {"usn": "1RG24IS001", "name": "Ananya R", "sem": 1, "sec": "A"},
            {"usn": "1RG24IS018", "name": "Basavaraj", "sem": 1, "sec": "B"},
            {"usn": "1RG23IS007", "name": "Chaitanya", "sem": 3, "sec": "A"},
            {"usn": "1RG23IS021", "name": "Darshan K", "sem": 3, "sec": "B"},
            {"usn": "1RG22IS012", "name": "Eshwar Gowda", "sem": 5, "sec": "A"},
            {"usn": "1RG22IS028", "name": "Firdose B", "sem": 5, "sec": "B"},
            {"usn": "1RG21IS001", "name": "Giridhar S", "sem": 7, "sec": "A"},
            {"usn": "1RG21IS040", "name": "Kavitha P", "sem": 7, "sec": "A"},
            {"usn": "1RG21IS055", "name": "Manikanta R", "sem": 7, "sec": "B"},
            {"usn": "1RG21IS009", "name": "Nithya Shree", "sem": 8, "sec": "A"}
        ]
    },
    "AIML": {
        "name": "B.E in Artificial Intelligence & Machine Learning",
        "hod": {"username": "hod_aiml", "name": "Dr. Karthik S", "pass": "hod123", "email": "hod.aiml@rgit.ac.in"},
        "faculty": [
            {"u": "karthiks", "p": "faculty123", "name": "Dr. Karthik S", "code": "FAC_AML_01", "sem": 1, "sub": "Python & Intro to AI (BAM101)"},
            {"u": "rashmid", "p": "faculty123", "name": "Prof. Rashmi D", "code": "FAC_AML_02", "sem": 3, "sub": "Statistical Foundations of ML (BAM301)"},
            {"u": "sandeepm", "p": "faculty123", "name": "Dr. Sandeep M", "code": "FAC_AML_03", "sem": 4, "sub": "Supervised & Unsupervised ML (BAM401)"},
            {"u": "karthiks5", "p": "faculty123", "name": "Dr. Karthik S", "code": "FAC_AML_04", "sem": 5, "sub": "Deep Neural Networks (BAM501)"},
            {"u": "rashmid7", "p": "faculty123", "name": "Prof. Rashmi D", "code": "FAC_AML_05", "sem": 7, "sub": "Reinforcement Learning & LLMs (BAM701)"},
            {"u": "sandeepm7", "p": "faculty123", "name": "Dr. Sandeep M", "code": "FAC_AML_06", "sem": 7, "sub": "Autonomous Robotics (BAM702)"}
        ],
        "students": [
            {"usn": "1RG24AM001", "name": "Abhilash G", "sem": 1, "sec": "A"},
            {"usn": "1RG24AM015", "name": "Bhavana Gowda", "sem": 1, "sec": "B"},
            {"usn": "1RG23AM006", "name": "Chandan Rao", "sem": 3, "sec": "A"},
            {"usn": "1RG23AM020", "name": "Disha S", "sem": 3, "sec": "B"},
            {"usn": "1RG22AM010", "name": "Goutham R", "sem": 5, "sec": "A"},
            {"usn": "1RG22AM026", "name": "Harshitha M", "sem": 5, "sec": "B"},
            {"usn": "1RG21AM001", "name": "Kiran Kumar", "sem": 7, "sec": "A"},
            {"usn": "1RG21AM030", "name": "Pooja N", "sem": 7, "sec": "A"},
            {"usn": "1RG21AM042", "name": "Rohit Shetty", "sem": 7, "sec": "B"},
            {"usn": "1RG21AM008", "name": "Varun G", "sem": 8, "sec": "A"}
        ]
    }
}


def seed_single_database(db: Session, dept_key: str = None, is_master: bool = False):
    """
    Seeds a specific database session with appropriate HOD, teachers, and students.
    If is_master=True: seeds MOHD (0609) + all 9 departments into master DB.
    If dept_key is provided: seeds ONLY that department's HOD, teachers, and students.
    """
    # 1. Campus Geofence
    if not db.query(GeofenceSettings).first():
        rgit_geofence = GeofenceSettings(
            name="Rajiv Gandhi Institute of Technology (RGIT, Bangalore)",
            latitude=RGIT_LATITUDE,
            longitude=RGIT_LONGITUDE,
            radius_meters=DEFAULT_GEOFENCE_RADIUS_METERS,
            enforce_geofence=True
        )
        db.add(rgit_geofence)
        db.commit()

    # 2. Master Admin (Only in Master DB)
    if is_master:
        mohd = db.query(User).filter(func.upper(User.username) == "MOHD").first()
        if not mohd:
            mohd = User(
                username="MOHD",
                hashed_password=hash_password("0609"),
                role="admin",
                full_name="MOHD (Master System Administrator)",
                email="mohd.admin@rgit.ac.in",
                phone="+91 9845012345",
                department="Master System Administration",
                is_active=True
            )
            db.add(mohd)
            db.commit()
        else:
            mohd.hashed_password = hash_password("0609")
            mohd.role = "admin"
            mohd.department = "Master System Administration"
            db.commit()

        admin_acc = db.query(User).filter(func.upper(User.username) == "ADMIN").first()
        if not admin_acc:
            admin_acc = User(
                username="admin",
                hashed_password=hash_password("adminpassword"),
                role="admin",
                full_name="RGIT Master Super Admin",
                email="admin.master@rgit.ac.in",
                phone="+91 9845012345",
                department="Master System Administration",
                is_active=True
            )
            db.add(admin_acc)
            db.commit()

    # Determine which departments to seed into this DB
    target_departments = DEPARTMENT_DATASETS.items() if is_master else (
        [(dept_key, DEPARTMENT_DATASETS[dept_key])] if dept_key in DEPARTMENT_DATASETS else []
    )

    for d_key, d_data in target_departments:
        dept_full_name = d_data["name"]

        # --- A. Seed HOD ---
        hod_info = d_data["hod"]
        # Primary HOD account
        h_user = db.query(User).filter(func.upper(User.username) == hod_info["username"].upper()).first()
        if not h_user:
            h_user = User(
                username=hod_info["username"],
                hashed_password=hash_password(hod_info.get("pass", "hod123")),
                role="hod",
                full_name=f"{hod_info['name']} (HOD)",
                email=hod_info.get("email", f"{hod_info['username']}@rgit.ac.in"),
                phone="+91 9845012345",
                department=dept_full_name,
                is_active=True
            )
            db.add(h_user)
            db.commit()
        else:
            h_user.hashed_password = hash_password(hod_info.get("pass", "hod123"))
            h_user.department = dept_full_name
            h_user.phone = "+91 9845012345"
            db.commit()

        if d_key == "CSE":
            arudra_user = db.query(User).filter(func.upper(User.username) == "ARUDRA").first()
            if not arudra_user:
                arudra_user = User(
                    username="arudra",
                    hashed_password=hash_password("arudra123"),
                    role="admin",
                    full_name="Dr. Arudra A (HOD CSE)",
                    email="arudra.a@rgit.ac.in",
                    phone="+91 9845012345",
                    department=dept_full_name,
                    is_active=True
                )
                db.add(arudra_user)
                db.commit()
            else:
                arudra_user.hashed_password = hash_password("arudra123")
                arudra_user.role = "admin"
                db.commit()

        # --- Seed Curriculum Subjects for Department ---
        from rgit_app.timetable import DEPARTMENT_SUBJECT_CATALOG
        dept_subjects = DEPARTMENT_SUBJECT_CATALOG.get(d_key, [])
        for sub_info in dept_subjects:
            existing_sub = db.query(Subject).filter(
                Subject.code == sub_info["code"],
                Subject.department == d_key
            ).first()
            if not existing_sub:
                db.add(Subject(
                    code=sub_info["code"],
                    name=sub_info["name"],
                    semester=sub_info["semester"],
                    department=d_key
                ))
        db.commit()

        # --- B. Seed Faculty ---
        for f_data in d_data["faculty"]:
            fac_user = db.query(User).filter(func.upper(User.username) == f_data["u"].upper()).first()
            if not fac_user:
                fac_user = User(
                    username=f_data["u"],
                    hashed_password=hash_password(f_data.get("p", "faculty123")),
                    role="faculty",
                    full_name=f_data["name"],
                    email=f"{f_data['u']}@rgit.ac.in",
                    phone="+91 9845012345",
                    department=dept_full_name,
                    is_active=True
                )
                db.add(fac_user)
                db.commit()
                db.refresh(fac_user)
            else:
                fac_user.department = dept_full_name
                fac_user.full_name = f_data["name"]
                db.commit()

            fac_prof = db.query(FacultyProfile).filter(
                (FacultyProfile.user_id == fac_user.id) | (FacultyProfile.faculty_code == f_data["code"])
            ).first()

            subj_code = f_data["sub"].split("(")[-1].replace(")", "") if "(" in f_data["sub"] else f_data["code"]
            if not fac_prof:
                fac_prof = FacultyProfile(
                    user_id=fac_user.id,
                    faculty_code=f_data["code"],
                    department=dept_full_name,
                    designation="Assistant Professor",
                    assigned_subject_codes=subj_code
                )
                db.add(fac_prof)
                db.commit()
            else:
                fac_prof.user_id = fac_user.id
                fac_prof.faculty_code = f_data["code"]
                fac_prof.department = dept_full_name
                fac_prof.assigned_subject_codes = subj_code
                db.commit()

        # --- C. Seed Students ---
        for s_data in d_data["students"]:
            usn_val = s_data["usn"].upper()
            stud_user = db.query(User).filter(func.upper(User.username) == usn_val).first()
            if not stud_user:
                stud_user = User(
                    username=usn_val,
                    hashed_password=hash_password("student123"),
                    role="student",
                    full_name=s_data["name"],
                    email=f"{usn_val.lower()}@rgit.ac.in",
                    phone="+91 9845012345",
                    department=dept_full_name,
                    is_active=True
                )
                db.add(stud_user)
                db.commit()
                db.refresh(stud_user)
            else:
                stud_user.department = dept_full_name
                stud_user.full_name = s_data["name"]
                db.commit()

            stud_prof = db.query(StudentProfile).filter(
                (StudentProfile.user_id == stud_user.id) | (StudentProfile.usn == usn_val)
            ).first()

            if not stud_prof:
                stud_prof = StudentProfile(
                    user_id=stud_user.id,
                    usn=usn_val,
                    department=dept_full_name,
                    semester=s_data["sem"],
                    section=s_data["sec"],
                    face_registered=True if usn_val in ["1RG21CS001", "1RG21CS042"] else False
                )
                db.add(stud_prof)
                db.commit()
            else:
                stud_prof.user_id = stud_user.id
                stud_prof.usn = usn_val
                stud_prof.department = dept_full_name
                stud_prof.semester = s_data["sem"]
                stud_prof.section = s_data["sec"]
                db.commit()


def seed_database():
    """Initializes schemas and seeds Master DB + all 9 Department Databases."""
    print("=" * 60)
    print("  SEEDING RGIT MULTI-TENANT DEPARTMENTAL DATABASES")
    print("=" * 60)

    # 1. Initialize table structures across all databases
    init_all_databases()

    # 2. Seed Master System Database (attendance_system.db)
    master_db: Session = SessionLocal()
    try:
        print("[1/10] Seeding Master Control Database (attendance_system.db)...")
        seed_single_database(master_db, is_master=True)
        print("  [OK] Master Control Database successfully seeded (MOHD / 0609 + all branches).")
    finally:
        master_db.close()

    # 3. Seed Each of the 9 Separate Department Databases
    for idx, (dept_key, info) in enumerate(DEPARTMENT_DB_REGISTRY.items(), start=2):
        print(f"[{idx}/10] Seeding {info['name']} Database ({info['filename']})...")
        dept_db: Session = get_department_session(dept_key)
        try:
            seed_single_database(dept_db, dept_key=dept_key, is_master=False)
            print(f"  [OK] {info['filename']} successfully seeded with dedicated HOD, faculty, and students.")
        except Exception as e:
            dept_db.rollback()
            print(f"  [ERROR] Failed to seed {info['filename']}: {e}")
        finally:
            dept_db.close()

    print("=" * 60)
    print("  ALL 9 DEPARTMENTAL DATABASES SEEDED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    seed_database()
