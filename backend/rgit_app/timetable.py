from datetime import datetime, time
from typing import Optional, Dict, Any, List

PERIOD_SLOTS = [
    {"period": 1, "start": time(8, 30), "end": time(9, 30), "label": "08:30 AM - 09:30 AM", "time_str": "08:30 - 09:30"},
    {"period": 2, "start": time(9, 30), "end": time(10, 30), "label": "09:30 AM - 10:30 AM", "time_str": "09:30 - 10:30"},
    {"period": "SHORT_BREAK", "start": time(10, 30), "end": time(10, 45), "label": "10:30 AM - 10:45 AM (Short Break)", "time_str": "10:30 - 10:45"},
    {"period": 3, "start": time(10, 45), "end": time(11, 45), "label": "10:45 AM - 11:45 AM", "time_str": "10:45 - 11:45"},
    {"period": 4, "start": time(11, 45), "end": time(12, 45), "label": "11:45 AM - 12:45 PM", "time_str": "11:45 - 12:45"},
    {"period": "LUNCH_BREAK", "start": time(12, 45), "end": time(13, 30), "label": "12:45 PM - 01:30 PM (Lunch Break)", "time_str": "12:45 - 01:30"},
    {"period": 5, "start": time(13, 30), "end": time(14, 30), "label": "01:30 PM - 02:30 PM", "time_str": "01:30 - 02:30"},
    {"period": 6, "start": time(14, 30), "end": time(15, 30), "label": "02:30 PM - 03:30 PM", "time_str": "02:30 - 03:30"},
    {"period": 7, "start": time(15, 30), "end": time(16, 30), "label": "03:30 PM - 04:30 PM", "time_str": "03:30 - 04:30"},
]

# Department Code Mapping (ordered: compound/specific branches first)
DEPT_ALIASES = {
    "CSE_AI": ["CSE_AI", "CSE-AI", "CS_AI", "ARTIFICIAL INTELLIGENCE & MACHINE LEARNING", "B.E IN COMPUTER SCIENCE & ENGINEERING (ARTIFICIAL INTELLIGENCE)"],
    "CSE_IOT_CS_BT": ["CSE_IOT_CS_BT", "CSE_IOT", "CSE-IOT", "CS_IOT", "IOT", "CYBER SECURITY", "BLOCKCHAIN", "INTERNET OF THINGS", "B.E IN COMPUTER SCIENCE & ENGINEERING (INTERNET OF THINGS CYBER SECURITY WITH BLOCKCHAIN TECHNOLOGY)"],
    "AIML": ["AIML", "AI & ML", "AI_ML", "AI&ML", "MACHINE LEARNING", "B.E IN ARTIFICIAL INTELLIGENCE & MACHINE LEARNING"],
    "ECE": ["ECE", "ELECTRONICS", "ELECTRONICS AND COMMUNICATION", "ELECTRONICS & COMMUNICATION", "B.E IN ELECTRONICS AND COMMUNICATION"],
    "EE":  ["EE", "EEE", "ELECTRICAL", "ELECTRICAL ENGINEERING", "B.E IN ELECTRICAL ENGINEERING"],
    "ME":  ["ME", "MECHANICAL", "MECHANICAL ENGINEERING", "B.E IN MECHANICAL ENGINEERING"],
    "BME": ["BME", "BIOMEDICAL", "BIO-MEDICAL", "BIO MEDICAL", "BIO-MEDICAL ENGINEERING", "B.E IN BIO-MEDICAL ENGINEERING"],
    "ISE": ["ISE", "INFORMATION SCIENCE", "INFORMATION SCIENCE & ENGINEERING", "B.E IN INFORMATION SCIENCE & ENGINEERING"],
    "CSE": ["CSE", "COMPUTER SCIENCE", "COMPUTER SCIENCE AND ENGINEERING", "B.E IN COMPUTER SCIENCE AND ENGINEERING"],
}

def normalize_dept(dept: Optional[str]) -> str:
    if not dept:
        return "CSE"
    s = dept.upper().strip()
    
    # Exact code check first
    if s in ["EE", "EEE"]: return "EE"
    if s in ["ECE", "EC"]: return "ECE"
    if s in ["BME", "BM"]: return "BME"
    if s in ["ME", "MECH"]: return "ME"
    if s in ["AIML", "AI_ML", "AI & ML", "AI&ML"]: return "AIML"
    if s in ["CSE_AI", "CSE-AI", "CS_AI"]: return "CSE_AI"
    if s in ["CSE_IOT_CS_BT", "CSE_IOT", "CSE-IOT", "CS_IOT", "IOT"]: return "CSE_IOT_CS_BT"
    if s in ["ISE", "IS"]: return "ISE"
    if s in ["CSE", "CS"]: return "CSE"

    # Specific phrase checks (most specific first)
    if "BLOCKCHAIN" in s or "INTERNET OF THINGS" in s or "CYBER" in s:
        return "CSE_IOT_CS_BT"
    if "ARTIFICIAL INTELLIGENCE & MACHINE" in s or "MACHINE LEARNING" in s:
        return "AIML"
    if "ARTIFICIAL INTELLIGENCE" in s:
        return "CSE_AI"
    if "INFORMATION SCIENCE" in s:
        return "ISE"
    if "BIO-MEDICAL" in s or "BIOMEDICAL" in s or "BIO MEDICAL" in s:
        return "BME"
    if "ELECTRONICS" in s or "COMMUNICATION" in s:
        return "ECE"
    if "ELECTRICAL" in s:
        return "EE"
    if "MECHANICAL" in s:
        return "ME"
    if "COMPUTER SCIENCE" in s:
        return "CSE"
    
    for code, aliases in DEPT_ALIASES.items():
        for alias in aliases:
            if alias in s:
                return code
    return "CSE"

# Comprehensive Curricula for all 9 RGIT B.E Departments
DEPARTMENT_SUBJECT_CATALOG: Dict[str, List[Dict[str, Any]]] = {
    # 1. Computer Science & Engineering
    "CSE": [
        {"code": "BCS101", "name": "Calculus & Linear Algebra",          "semester": 1},
        {"code": "BCS102", "name": "Engineering Physics",               "semester": 1},
        {"code": "BCS103", "name": "Principles of C Programming",        "semester": 1},
        {"code": "BCS201", "name": "Advanced Calculus & Diff Eqns",      "semester": 2},
        {"code": "BCS202", "name": "Applied Chemistry for Computing",    "semester": 2},
        {"code": "BCS203", "name": "Problem Solving with Python",        "semester": 2},
        {"code": "BCS301", "name": "Discrete Mathematics & Transforms",  "semester": 3},
        {"code": "BCS302", "name": "Digital Design & Computer Org",      "semester": 3},
        {"code": "BCS303", "name": "Operating Systems",                  "semester": 3},
        {"code": "BCS304", "name": "Data Structures & Applications",     "semester": 3},
        {"code": "BCS401", "name": "Design & Analysis of Algorithms",    "semester": 4},
        {"code": "BCS402", "name": "Microcontrollers & Embedded Sys",    "semester": 4},
        {"code": "BCS403", "name": "Database Management Systems",        "semester": 4},
        {"code": "BCS501", "name": "Software Engineering & Agile",       "semester": 5},
        {"code": "BCS502", "name": "Computer Networks",                  "semester": 5},
        {"code": "BCS503", "name": "Theory of Computation & Automata",   "semester": 5},
        {"code": "BCS601", "name": "Full Stack Web Development",         "semester": 6},
        {"code": "BCS602", "name": "Information & Network Security",     "semester": 6},
        {"code": "BCS603", "name": "Big Data Analytics & Cloud",         "semester": 6},
        {"code": "BCS701", "name": "Parallel Computing",                "semester": 7},
        {"code": "BCS702", "name": "Internet of Things (IoT)",          "semester": 7},
        {"code": "BCS703", "name": "Cryptography & Network Security",   "semester": 7},
        {"code": "BCS714D","name": "Big Data Analytics",                "semester": 7},
        {"code": "BCS786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BCS801", "name": "Deep Learning & Neural Networks",    "semester": 8},
        {"code": "BCS802", "name": "Technical Seminar & Capstone",       "semester": 8},
    ],

    # 2. Electronics & Communication Engineering
    "ECE": [
        {"code": "BEC101", "name": "Basic Electronics & Circuit Theory", "semester": 1},
        {"code": "BEC102", "name": "Engineering Physics & Optics",       "semester": 1},
        {"code": "BEC201", "name": "Transforms & Circuit Analysis",      "semester": 2},
        {"code": "BEC202", "name": "C++ Programming & Data Structures",  "semester": 2},
        {"code": "BEC301", "name": "Network Analysis & Transmission",    "semester": 3},
        {"code": "BEC302", "name": "Digital System Design with Verilog", "semester": 3},
        {"code": "BEC303", "name": "Electronic Devices & Analog Circuits","semester": 3},
        {"code": "BEC401", "name": "Signals & Systems",                  "semester": 4},
        {"code": "BEC402", "name": "Linear Integrated Circuits",         "semester": 4},
        {"code": "BEC403", "name": "Microprocessor & Interfacing",       "semester": 4},
        {"code": "BEC501", "name": "Electromagnetic Waves & Antennas",   "semester": 5},
        {"code": "BEC502", "name": "Digital Signal Processing",          "semester": 5},
        {"code": "BEC503", "name": "Control Systems Engineering",        "semester": 5},
        {"code": "BEC601", "name": "VLSI Design & CMOS Tech",            "semester": 6},
        {"code": "BEC602", "name": "Microwave & Radar Engineering",      "semester": 6},
        {"code": "BEC603", "name": "Information Theory & Coding",        "semester": 6},
        {"code": "BEC701", "name": "Wireless Communication & 5G",        "semester": 7},
        {"code": "BEC702", "name": "Embedded Systems & IoT Devices",     "semester": 7},
        {"code": "BEC703", "name": "Optical Fiber Communications",       "semester": 7},
        {"code": "BEC704", "name": "Digital Image & Video Processing",   "semester": 7},
        {"code": "BEC786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BEC801", "name": "Satellite Communication Systems",    "semester": 8},
        {"code": "BEC802", "name": "Advanced Embedded System Design",    "semester": 8},
    ],

    # 3. Electrical Engineering
    "EE": [
        {"code": "BEE101", "name": "Basic Electrical Engineering",       "semester": 1},
        {"code": "BEE102", "name": "Engineering Mathematics-I",          "semester": 1},
        {"code": "BEE201", "name": "Electric Circuit Analysis",          "semester": 2},
        {"code": "BEE202", "name": "Analog Electronic Circuits",         "semester": 2},
        {"code": "BEE301", "name": "Electrical Machines-I (Transformers)","semester": 3},
        {"code": "BEE302", "name": "Electromagnetic Field Theory",       "semester": 3},
        {"code": "BEE303", "name": "Digital Electronics & Logic",        "semester": 3},
        {"code": "BEE401", "name": "Power Electronics & Drives",         "semester": 4},
        {"code": "BEE402", "name": "Electrical Machines-II (Induction)", "semester": 4},
        {"code": "BEE403", "name": "Linear Control Systems",             "semester": 4},
        {"code": "BEE501", "name": "Control Systems & Automation",       "semester": 5},
        {"code": "BEE502", "name": "Power System Analysis & Grid",       "semester": 5},
        {"code": "BEE503", "name": "Signals & DSP Applications",         "semester": 5},
        {"code": "BEE601", "name": "High Voltage Engineering",           "semester": 6},
        {"code": "BEE602", "name": "Electric Vehicles & Energy Storage", "semester": 6},
        {"code": "BEE603", "name": "Microcontrollers for Power Systems", "semester": 6},
        {"code": "BEE701", "name": "Power System Protection & Switchgear","semester": 7},
        {"code": "BEE702", "name": "Renewable Energy Sources & Microgrid","semester": 7},
        {"code": "BEE703", "name": "Smart Grid Technologies",            "semester": 7},
        {"code": "BEE704", "name": "Industrial Automation & PLC",        "semester": 7},
        {"code": "BEE786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BEE801", "name": "Electrical Energy Conservation",     "semester": 8},
        {"code": "BEE802", "name": "Power Quality & FACTs Devices",      "semester": 8},
    ],

    # 4. Mechanical Engineering
    "ME": [
        {"code": "BME101", "name": "Elements of Mechanical Engineering", "semester": 1},
        {"code": "BME102", "name": "Computer Aided Engineering Drawing",  "semester": 1},
        {"code": "BME201", "name": "Engineering Mechanics & Statics",    "semester": 2},
        {"code": "BME202", "name": "Materials Science & Metallurgy",     "semester": 2},
        {"code": "BME301", "name": "Basic Thermodynamics",               "semester": 3},
        {"code": "BME302", "name": "Mechanics of Materials",             "semester": 3},
        {"code": "BME303", "name": "Manufacturing Process-I (Casting)",  "semester": 3},
        {"code": "BME401", "name": "Applied Thermodynamics & Turbines",   "semester": 4},
        {"code": "BME402", "name": "Fluid Mechanics & Machinery",        "semester": 4},
        {"code": "BME403", "name": "Kinematics of Machines",             "semester": 4},
        {"code": "BME501", "name": "Design of Machine Elements-I",       "semester": 5},
        {"code": "BME502", "name": "Heat & Mass Transfer",               "semester": 5},
        {"code": "BME503", "name": "Dynamics of Machinery",              "semester": 5},
        {"code": "BME601", "name": "Design of Machine Elements-II",      "semester": 6},
        {"code": "BME602", "name": "Finite Element Analysis (FEA)",      "semester": 6},
        {"code": "BME603", "name": "Turbo Machines & Aerodynamics",      "semester": 6},
        {"code": "BME701", "name": "Control Engineering & Robotics",     "semester": 7},
        {"code": "BME702", "name": "Total Quality Management (TQM)",     "semester": 7},
        {"code": "BME703", "name": "Automotive Engineering & EV Tech",   "semester": 7},
        {"code": "BME704", "name": "Mechatronics & MEMS Systems",        "semester": 7},
        {"code": "BME786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BME801", "name": "Operations Research & Production",   "semester": 8},
        {"code": "BME802", "name": "Tribology & Surface Engineering",    "semester": 8},
    ],

    # 5. Bio-Medical Engineering
    "BME": [
        {"code": "BBM101", "name": "Introduction to Biomedical Engg",    "semester": 1},
        {"code": "BBM102", "name": "Biochemistry & Cellular Dynamics",   "semester": 1},
        {"code": "BBM201", "name": "Biomedical Circuits & Analysis",     "semester": 2},
        {"code": "BBM202", "name": "Medical Physics & Radiation",        "semester": 2},
        {"code": "BBM301", "name": "Biomedical Transducers & Sensors",   "semester": 3},
        {"code": "BBM302", "name": "Bio-Electric Potential & Amplifiers","semester": 3},
        {"code": "BBM303", "name": "Medical Electronics",                "semester": 3},
        {"code": "BBM401", "name": "Human Anatomy & Physiology",         "semester": 4},
        {"code": "BBM402", "name": "Biosignal Conditioning & Processing","semester": 4},
        {"code": "BBM403", "name": "Pathology & Microbiology for Engrs", "semester": 4},
        {"code": "BBM501", "name": "Biomedical Instrumentation",         "semester": 5},
        {"code": "BBM502", "name": "Biomedical Signal Processing (DSP)", "semester": 5},
        {"code": "BBM503", "name": "Biomechanics & Orthotics",           "semester": 5},
        {"code": "BBM601", "name": "Therapeutic Equipment & Dialysis",   "semester": 6},
        {"code": "BBM602", "name": "Clinical Engineering & Safety",      "semester": 6},
        {"code": "BBM603", "name": "Diagnostic Imaging (X-Ray/CT/MRI)",  "semester": 6},
        {"code": "BBM701", "name": "Medical Imaging Systems & PACS",     "semester": 7},
        {"code": "BBM702", "name": "Biomaterials & Artificial Organs",   "semester": 7},
        {"code": "BBM703", "name": "Rehabilitation Engineering",         "semester": 7},
        {"code": "BBM704", "name": "Hospital Safety & Patient Monitoring","semester": 7},
        {"code": "BBM786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BBM801", "name": "Neural Engineering & Brain-Machine", "semester": 8},
        {"code": "BBM802", "name": "Telemedicine & IoT Healthcare",      "semester": 8},
    ],

    # 6. Information Science & Engineering
    "ISE": [
        {"code": "BIS101", "name": "Mathematics for Information Science","semester": 1},
        {"code": "BIS102", "name": "Fundamentals of Information Tech",   "semester": 1},
        {"code": "BIS201", "name": "Linear Algebra for Data Science",    "semester": 2},
        {"code": "BIS202", "name": "Data Structures with C++",           "semester": 2},
        {"code": "BIS301", "name": "Data Structures & File Structures",  "semester": 3},
        {"code": "BIS302", "name": "Unix System Programming",            "semester": 3},
        {"code": "BIS303", "name": "Computer Architecture & Logic",      "semester": 3},
        {"code": "BIS401", "name": "Analysis & Design of Algorithms",    "semester": 4},
        {"code": "BIS402", "name": "Operating System Kernels",           "semester": 4},
        {"code": "BIS403", "name": "Relational Database Management",     "semester": 4},
        {"code": "BIS501", "name": "Automata & Compiler Design",         "semester": 5},
        {"code": "BIS502", "name": "Computer Networks & Protocols",      "semester": 5},
        {"code": "BIS503", "name": "Software Architecture & Testing",    "semester": 5},
        {"code": "BIS601", "name": "Mobile Application Development",     "semester": 6},
        {"code": "BIS602", "name": "Cloud Computing Infrastructure",     "semester": 6},
        {"code": "BIS603", "name": "Data Mining & Business Intelligence","semester": 6},
        {"code": "BIS701", "name": "Cloud Computing & Virtualization",   "semester": 7},
        {"code": "BIS702", "name": "Information Security & Cryptography","semester": 7},
        {"code": "BIS703", "name": "Distributed Storage & NoSQL Systems","semester": 7},
        {"code": "BIS704", "name": "Software Testing & QA Automation",   "semester": 7},
        {"code": "BIS786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BIS801", "name": "Cyber Forensics & Incident Response","semester": 8},
        {"code": "BIS802", "name": "DevOps Engineering & CI/CD",         "semester": 8},
    ],

    # 7. Artificial Intelligence & Machine Learning
    "AIML": [
        {"code": "BAI101", "name": "Calculus & Linear Algebra for AI",   "semester": 1},
        {"code": "BAI102", "name": "Python for Data Scientists",         "semester": 1},
        {"code": "BAI201", "name": "Probability & Statistics for ML",    "semester": 2},
        {"code": "BAI202", "name": "Object-Oriented Programming for AI", "semester": 2},
        {"code": "BAI301", "name": "Mathematical Foundations of AI",     "semester": 3},
        {"code": "BAI302", "name": "Data Structures & ML Workflows",     "semester": 3},
        {"code": "BAI303", "name": "Database Systems for Big Data",      "semester": 3},
        {"code": "BAI401", "name": "Supervised Learning Algorithms",     "semester": 4},
        {"code": "BAI402", "name": "Unsupervised & Clustering Methods",  "semester": 4},
        {"code": "BAI403", "name": "Optimization Techniques in ML",      "semester": 4},
        {"code": "BAI501", "name": "Deep Learning Fundamentals",         "semester": 5},
        {"code": "BAI502", "name": "Statistical Machine Learning",       "semester": 5},
        {"code": "BAI503", "name": "AI Knowledge Representation",        "semester": 5},
        {"code": "BAI601", "name": "Natural Language Processing (NLP)",   "semester": 6},
        {"code": "BAI602", "name": "Computer Vision & CNN Architectures","semester": 6},
        {"code": "BAI603", "name": "Generative AI & Large Language Models","semester": 6},
        {"code": "BAI701", "name": "Deep Learning Architectures",        "semester": 7},
        {"code": "BAI702", "name": "Natural Language Processing Systems", "semester": 7},
        {"code": "BAI703", "name": "Computer Vision & Visual AI",        "semester": 7},
        {"code": "BAI704", "name": "Reinforcement Learning & Agents",    "semester": 7},
        {"code": "BAI786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BAI801", "name": "AI Ethics, Bias & Governance",       "semester": 8},
        {"code": "BAI802", "name": "Autonomous Systems & Robotics AI",   "semester": 8},
    ],

    # 8. CSE - Artificial Intelligence
    "CSE_AI": [
        {"code": "BCA101", "name": "Engineering Mathematics-I",          "semester": 1},
        {"code": "BCA102", "name": "Computational Thinking with Python", "semester": 1},
        {"code": "BCA201", "name": "Discrete Structures & Logic",        "semester": 2},
        {"code": "BCA202", "name": "Data Structures & Algorithms",       "semester": 2},
        {"code": "BCA301", "name": "Foundations of Artificial Intel",    "semester": 3},
        {"code": "BCA302", "name": "Object-Oriented Programming (Java)", "semester": 3},
        {"code": "BCA303", "name": "Computer Organization & AI Chips",   "semester": 3},
        {"code": "BCA401", "name": "Design of Efficient Algorithms",     "semester": 4},
        {"code": "BCA402", "name": "Applied Machine Learning Models",     "semester": 4},
        {"code": "BCA403", "name": "Operating Systems & Virtualization", "semester": 4},
        {"code": "BCA501", "name": "Deep Neural Networks & PyTorch",     "semester": 5},
        {"code": "BCA502", "name": "Intelligent Agents & Heuristics",    "semester": 5},
        {"code": "BCA503", "name": "Database Engines & Vector Stores",   "semester": 5},
        {"code": "BCA601", "name": "Robotics & Intelligent Systems",     "semester": 6},
        {"code": "BCA602", "name": "Speech Processing & Audio AI",       "semester": 6},
        {"code": "BCA603", "name": "Cloud AI Pipelines & MLOps",         "semester": 6},
        {"code": "BCA701", "name": "Neural Networks & Fuzzy Logic",      "semester": 7},
        {"code": "BCA702", "name": "Robotics & Intelligent Automation",  "semester": 7},
        {"code": "BCA703", "name": "Big Data Engineering for AI",        "semester": 7},
        {"code": "BCA704", "name": "Edge AI & Embedded Intelligence",    "semester": 7},
        {"code": "BCA786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BCA801", "name": "Cognitive Computing & Multimodal AI","semester": 8},
        {"code": "BCA802", "name": "Quantum Machine Learning",           "semester": 8},
    ],

    # 9. CSE - IoT, Cyber Security & Blockchain
    "CSE_IOT_CS_BT": [
        {"code": "BCI101", "name": "Engineering Mathematics-I",          "semester": 1},
        {"code": "BCI102", "name": "Principles of Sensor Networks",      "semester": 1},
        {"code": "BCI201", "name": "Digital Systems & Cryptography Basics","semester": 2},
        {"code": "BCI202", "name": "Programming with C & Embedded C",    "semester": 2},
        {"code": "BCI301", "name": "Data Structures & Cryptographic Prims","semester": 3},
        {"code": "BCI302", "name": "Microcontrollers & IoT Sensors",     "semester": 3},
        {"code": "BCI303", "name": "Computer Architecture & Security",   "semester": 3},
        {"code": "BCI401", "name": "Network Protocols & Cyber Defense",  "semester": 4},
        {"code": "BCI402", "name": "Operating System Security",          "semester": 4},
        {"code": "BCI403", "name": "Database Security & Cryptography",   "semester": 4},
        {"code": "BCI501", "name": "Wireless Sensor Networks & Zigbee",  "semester": 5},
        {"code": "BCI502", "name": "Ethical Hacking & Penetration Test", "semester": 5},
        {"code": "BCI503", "name": "Blockchain Architecture & Smart Cont","semester": 5},
        {"code": "BCI601", "name": "IoT Cloud Platforms & MQTT/CoAP",    "semester": 6},
        {"code": "BCI602", "name": "Security in Decentralized Ledger",   "semester": 6},
        {"code": "BCI603", "name": "Embedded Systems Vulnerability Assess","semester": 6},
        {"code": "BCI701", "name": "IoT Architecture & Security Protocol","semester": 7},
        {"code": "BCI702", "name": "Blockchain Technologies & Ethereum", "semester": 7},
        {"code": "BCI703", "name": "Cyber Threat Intelligence & SIEM",   "semester": 7},
        {"code": "BCI704", "name": "Cloud-Edge IoT Security Frameworks", "semester": 7},
        {"code": "BCI786", "name": "Major Project Phase-II",            "semester": 7},
        {"code": "BCI801", "name": "Zero Trust Architecture & Quantum Crypt","semester": 8},
        {"code": "BCI802", "name": "Decentralized Finance (DeFi) Security","semester": 8},
    ]
}

# Backward compatibility alias
DEFAULT_SUBJECTS = DEPARTMENT_SUBJECT_CATALOG["CSE"]

def get_department_subjects(department: Optional[str] = None, semester: Optional[int] = None) -> List[Dict[str, Any]]:
    dept_code = normalize_dept(department)
    catalog = DEPARTMENT_SUBJECT_CATALOG.get(dept_code, DEPARTMENT_SUBJECT_CATALOG["CSE"])
    if semester:
        filtered = [s for s in catalog if s["semester"] == int(semester)]
        if filtered:
            return filtered
        return [
            {"code": f"B{dept_code}{semester}01", "name": f"{dept_code} Core Subject 1", "semester": int(semester)},
            {"code": f"B{dept_code}{semester}02", "name": f"{dept_code} Core Subject 2", "semester": int(semester)},
            {"code": f"B{dept_code}{semester}03", "name": f"{dept_code} Core Subject 3", "semester": int(semester)},
            {"code": f"B{dept_code}{semester}04", "name": f"{dept_code} Core Subject 4", "semester": int(semester)},
            {"code": f"B{dept_code}{semester}05", "name": f"{dept_code} Laboratory / Elective", "semester": int(semester)},
        ]
    return catalog

def get_current_period(now_time: Optional[time] = None) -> Dict[str, Any]:
    """Determines the current academic period slot based on the time."""
    if not now_time:
        now_time = datetime.now().time()

    for idx, slot in enumerate(PERIOD_SLOTS):
        is_last = (idx == len(PERIOD_SLOTS) - 1)
        in_slot = (slot["start"] <= now_time <= slot["end"]) if is_last else (slot["start"] <= now_time < slot["end"])
        if in_slot:
            if isinstance(slot["period"], str) and "BREAK" in slot["period"]:
                return {
                    "is_class_time": False,
                    "is_break": True,
                    "period_number": None,
                    "slot_name": slot["period"],
                    "label": slot["label"],
                    "message": f"Class locked: Currently {slot['label']}"
                }
            return {
                "is_class_time": True,
                "is_break": False,
                "period_number": slot["period"],
                "slot_name": f"Period {slot['period']}",
                "label": slot["label"],
                "message": f"Currently in Period {slot['period']} ({slot['label']})"
            }

    # If outside formal slots, allow Major Project / Extra Lab slot
    return {
        "is_class_time": True,
        "is_break": False,
        "period_number": 7,
        "slot_name": "Extended / Major Project Session",
        "label": "Lab / Project Window",
        "message": "Major Project / Special Lab Session Active"
    }

def generate_default_day_schedule(department: str, semester: int, section: str, day_of_week: str) -> List[Dict[str, Any]]:
    """Generates the standard weekly schedule matrix tailored to this department & semester."""
    subjects = get_department_subjects(department, semester)
    dept_code = normalize_dept(department)
    
    # Select subject cycle based on day
    day_idx = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5}.get(day_of_week, 0)
    
    room_map = {
        "CSE": "LH-204", "ECE": "LH-301", "EE": "LH-102", "ME": "LH-405",
        "BME": "LH-501", "ISE": "LH-208", "AIML": "LH-602", "CSE_AI": "LH-604",
        "CSE_IOT_CS_BT": "LH-608"
    }
    room = room_map.get(dept_code, "LH-101")
    
    schedule = []
    academic_periods = [s for s in PERIOD_SLOTS if isinstance(s["period"], int)]
    
    for idx, slot in enumerate(academic_periods):
        p_num = slot["period"]
        # Rotate subjects for variety across days & periods
        sub_idx = (day_idx + idx) % len(subjects) if subjects else 0
        sub = subjects[sub_idx] if subjects else {"code": f"B{dept_code}{semester}01", "name": f"Core Subject {p_num}"}
        
        is_lab = p_num >= 6
        curr_room = f"{dept_code} Laboratory" if is_lab else (f"{room} (Sec {section})")
        
        schedule.append({
            "period_number": p_num,
            "day_of_week": day_of_week,
            "start_time": slot["start"].strftime("%H:%M"),
            "end_time": slot["end"].strftime("%H:%M"),
            "label": slot["label"],
            "time_str": slot["time_str"],
            "subject_code": sub["code"],
            "subject_name": sub["name"],
            "room": curr_room,
            "section": section,
            "semester": semester,
            "department": dept_code,
            "faculty_name": f"Assigned {dept_code} Faculty",
            "is_default": True
        })
    return schedule
 