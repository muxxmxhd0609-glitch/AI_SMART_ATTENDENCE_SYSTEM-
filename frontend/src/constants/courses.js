// RGIT Official Undergraduate B.E Courses Registry
export const RGIT_BE_COURSES = [
  {
    id: 'EE',
    name: 'B.E in Electrical Engineering',
    code: 'EE',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'CSE',
    name: 'B.E in Computer Science and Engineering',
    code: 'CSE',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'ECE',
    name: 'B.E in Electronics and Communication',
    code: 'ECE',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'BME',
    name: 'B.E in Bio-Medical Engineering',
    code: 'BME',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'ME',
    name: 'B.E in Mechanical Engineering',
    code: 'ME',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'CSE_AI',
    name: 'B.E in Computer Science & Engineering (Artificial Intelligence)',
    code: 'CSE-AI',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'CSE_IOT_CS_BT',
    name: 'B.E in Computer Science & Engineering (Internet of things Cyber Security with Blockchain Technology)',
    code: 'CSE-IoT/CS/BT',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'ISE',
    name: 'B.E in Information Science & Engineering',
    code: 'ISE',
    level: 'Undergraduate',
    duration: '4 Years'
  },
  {
    id: 'AIML',
    name: 'B.E in Artificial Intelligence & Machine Learning',
    code: 'AI & ML',
    level: 'Undergraduate',
    duration: '4 Years'
  }
];

// Dedicated Database files per department
export const DEPT_DB_FILE = {
  CSE: 'attendance_CSE.db',
  ECE: 'attendance_ECE.db',
  EE: 'attendance_EE.db',
  BME: 'attendance_BME.db',
  ME: 'attendance_ME.db',
  CSE_AI: 'attendance_CSE_AI.db',
  'CSE-AI': 'attendance_CSE_AI.db',
  CSE_IOT_CS_BT: 'attendance_CSE_IOT_CS_BT.db',
  'CSE-IoT/CS/BT': 'attendance_CSE_IOT_CS_BT.db',
  ISE: 'attendance_ISE.db',
  AIML: 'attendance_AIML.db',
  'AI & ML': 'attendance_AIML.db'
};

// Department Head (HOD) Roster for all 9 RGIT B.E Departments + Super Admin
export const RGIT_HOD_ROSTER = [
  {
    username: 'hod_cse',
    name: 'Dr. Arudra A',
    title: 'HOD — Computer Science & Engineering',
    code: 'CSE',
    courseName: 'B.E in Computer Science and Engineering',
    email: 'arudra.a@rgit.ac.in'
  },
  {
    username: 'hod_ee',
    name: 'Dr. V. Suresh',
    title: 'HOD — Electrical Engineering',
    code: 'EE',
    courseName: 'B.E in Electrical Engineering',
    email: 'hod.ee@rgit.ac.in'
  },
  {
    username: 'hod_ece',
    name: 'Dr. Sunitha K',
    title: 'HOD — Electronics & Communication',
    code: 'ECE',
    courseName: 'B.E in Electronics and Communication',
    email: 'hod.ece@rgit.ac.in'
  },
  {
    username: 'hod_bme',
    name: 'Dr. Preethi M',
    title: 'HOD — Bio-Medical Engineering',
    code: 'BME',
    courseName: 'B.E in Bio-Medical Engineering',
    email: 'hod.bme@rgit.ac.in'
  },
  {
    username: 'hod_me',
    name: 'Dr. Ravishankar H',
    title: 'HOD — Mechanical Engineering',
    code: 'ME',
    courseName: 'B.E in Mechanical Engineering',
    email: 'hod.me@rgit.ac.in'
  },
  {
    username: 'hod_cse_ai',
    name: 'Dr. Anusha P',
    title: 'HOD — CSE (Artificial Intelligence)',
    code: 'CSE-AI',
    courseName: 'B.E in Computer Science & Engineering (Artificial Intelligence)',
    email: 'hod.cseai@rgit.ac.in'
  },
  {
    username: 'hod_cse_iot',
    name: 'Dr. Keshava Murthy',
    title: 'HOD — CSE (IoT, Cyber Sec & Blockchain)',
    code: 'CSE-IoT/CS/BT',
    courseName: 'B.E in Computer Science & Engineering (Internet of things Cyber Security with Blockchain Technology)',
    email: 'hod.cseiot@rgit.ac.in'
  },
  {
    username: 'hod_ise',
    name: 'Dr. Sharada B',
    title: 'HOD — Information Science & Engineering',
    code: 'ISE',
    courseName: 'B.E in Information Science & Engineering',
    email: 'hod.ise@rgit.ac.in'
  },
  {
    username: 'hod_aiml',
    name: 'Dr. Karthik S',
    title: 'HOD — Artificial Intelligence & Machine Learning',
    code: 'AI & ML',
    courseName: 'B.E in Artificial Intelligence & Machine Learning',
    email: 'hod.aiml@rgit.ac.in'
  },
  {
    username: 'MOHD',
    name: 'Master Control & HOD DB',
    title: 'RGIT System Super Admin (All Departments)',
    code: 'ALL',
    courseName: 'B.E in Computer Science and Engineering',
    email: 'admin.master@rgit.ac.in'
  }
];

export const getDeptCode = (dept) => {
  if (!dept) return 'ALL';
  const str = String(dept).toUpperCase().trim();
  if (str === 'ALL' || str === 'MASTER CONTROL & HOD DB') return 'ALL';

  if (str.includes('ELECTRICAL') || str === 'EE' || str.includes('ATTENDANCE_EE')) return 'EE';
  if (str.includes('ELECTRONICS') || str === 'ECE' || str === 'EC' || str.startsWith('EC ') || str.includes('ATTENDANCE_ECE')) return 'ECE';
  if (str.includes('BIO-MEDICAL') || str.includes('BIOMEDICAL') || str === 'BME' || str.includes('ATTENDANCE_BME')) return 'BME';
  if (str.includes('MECHANICAL') || str === 'ME' || str.includes('ATTENDANCE_ME')) return 'ME';
  if (str.includes('INFORMATION') || str === 'ISE' || str.includes('ATTENDANCE_ISE')) return 'ISE';
  if (str.includes('ARTIFICIAL INTELLIGENCE & MACHINE') || str.includes('AI & ML') || str === 'AIML' || str.includes('ATTENDANCE_AIML')) return 'AIML';
  if (str.includes('ARTIFICIAL INTELLIGENCE') || str.includes('CSE-AI') || str.includes('ATTENDANCE_CSE_AI')) return 'CSE_AI';
  if (str.includes('INTERNET OF THINGS') || str.includes('CYBER SECURITY') || str.includes('CSE-IOT') || str.includes('ATTENDANCE_CSE_IOT') || str.includes('CSE_IOT_CS_BT')) return 'CSE_IOT_CS_BT';
  if (str.includes('COMPUTER SCIENCE') || str === 'CSE' || str.includes('ATTENDANCE_CSE')) return 'CSE';

  return str;
};

export const getDeptHodInfo = (deptIdentifier) => {
  const code = getDeptCode(deptIdentifier);
  return RGIT_HOD_ROSTER.find(h => h.code === code) || RGIT_HOD_ROSTER[0];
};

export const isDeptMatch = (deptA, deptB) => {
  if (!deptA || !deptB) return true;
  const codeA = getDeptCode(deptA);
  const codeB = getDeptCode(deptB);
  if (codeA === 'ALL' || codeB === 'ALL') return true;
  return codeA === codeB;
};

// Curriculum Subjects Catalog for All 9 RGIT B.E Branches (Sem 7 & general)
export const DEPARTMENT_SUBJECT_CATALOG_FRONTEND = {
  "CSE": [
    {
      "code": "BCS101",
      "name": "Calculus & Linear Algebra",
      "semester": 1
    },
    {
      "code": "BCS102",
      "name": "Engineering Physics",
      "semester": 1
    },
    {
      "code": "BCS103",
      "name": "Principles of C Programming",
      "semester": 1
    },
    {
      "code": "BCS201",
      "name": "Advanced Calculus & Diff Eqns",
      "semester": 2
    },
    {
      "code": "BCS202",
      "name": "Applied Chemistry for Computing",
      "semester": 2
    },
    {
      "code": "BCS203",
      "name": "Problem Solving with Python",
      "semester": 2
    },
    {
      "code": "BCS301",
      "name": "Discrete Mathematics & Transforms",
      "semester": 3
    },
    {
      "code": "BCS302",
      "name": "Digital Design & Computer Org",
      "semester": 3
    },
    {
      "code": "BCS303",
      "name": "Operating Systems",
      "semester": 3
    },
    {
      "code": "BCS304",
      "name": "Data Structures & Applications",
      "semester": 3
    },
    {
      "code": "BCS401",
      "name": "Design & Analysis of Algorithms",
      "semester": 4
    },
    {
      "code": "BCS402",
      "name": "Microcontrollers & Embedded Sys",
      "semester": 4
    },
    {
      "code": "BCS403",
      "name": "Database Management Systems",
      "semester": 4
    },
    {
      "code": "BCS501",
      "name": "Software Engineering & Agile",
      "semester": 5
    },
    {
      "code": "BCS502",
      "name": "Computer Networks",
      "semester": 5
    },
    {
      "code": "BCS503",
      "name": "Theory of Computation & Automata",
      "semester": 5
    },
    {
      "code": "BCS601",
      "name": "Full Stack Web Development",
      "semester": 6
    },
    {
      "code": "BCS602",
      "name": "Information & Network Security",
      "semester": 6
    },
    {
      "code": "BCS603",
      "name": "Big Data Analytics & Cloud",
      "semester": 6
    },
    {
      "code": "BCS701",
      "name": "Parallel Computing",
      "semester": 7
    },
    {
      "code": "BCS702",
      "name": "Internet of Things (IoT)",
      "semester": 7
    },
    {
      "code": "BCS703",
      "name": "Cryptography & Network Security",
      "semester": 7
    },
    {
      "code": "BCS714D",
      "name": "Big Data Analytics",
      "semester": 7
    },
    {
      "code": "BCS786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BCS801",
      "name": "Deep Learning & Neural Networks",
      "semester": 8
    },
    {
      "code": "BCS802",
      "name": "Technical Seminar & Capstone",
      "semester": 8
    }
  ],
  "ECE": [
    {
      "code": "BEC101",
      "name": "Basic Electronics & Circuit Theory",
      "semester": 1
    },
    {
      "code": "BEC102",
      "name": "Engineering Physics & Optics",
      "semester": 1
    },
    {
      "code": "BEC201",
      "name": "Transforms & Circuit Analysis",
      "semester": 2
    },
    {
      "code": "BEC202",
      "name": "C++ Programming & Data Structures",
      "semester": 2
    },
    {
      "code": "BEC301",
      "name": "Network Analysis & Transmission",
      "semester": 3
    },
    {
      "code": "BEC302",
      "name": "Digital System Design with Verilog",
      "semester": 3
    },
    {
      "code": "BEC303",
      "name": "Electronic Devices & Analog Circuits",
      "semester": 3
    },
    {
      "code": "BEC401",
      "name": "Signals & Systems",
      "semester": 4
    },
    {
      "code": "BEC402",
      "name": "Linear Integrated Circuits",
      "semester": 4
    },
    {
      "code": "BEC403",
      "name": "Microprocessor & Interfacing",
      "semester": 4
    },
    {
      "code": "BEC501",
      "name": "Electromagnetic Waves & Antennas",
      "semester": 5
    },
    {
      "code": "BEC502",
      "name": "Digital Signal Processing",
      "semester": 5
    },
    {
      "code": "BEC503",
      "name": "Control Systems Engineering",
      "semester": 5
    },
    {
      "code": "BEC601",
      "name": "VLSI Design & CMOS Tech",
      "semester": 6
    },
    {
      "code": "BEC602",
      "name": "Microwave & Radar Engineering",
      "semester": 6
    },
    {
      "code": "BEC603",
      "name": "Information Theory & Coding",
      "semester": 6
    },
    {
      "code": "BEC701",
      "name": "Wireless Communication & 5G",
      "semester": 7
    },
    {
      "code": "BEC702",
      "name": "Embedded Systems & IoT Devices",
      "semester": 7
    },
    {
      "code": "BEC703",
      "name": "Optical Fiber Communications",
      "semester": 7
    },
    {
      "code": "BEC704",
      "name": "Digital Image & Video Processing",
      "semester": 7
    },
    {
      "code": "BEC786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BEC801",
      "name": "Satellite Communication Systems",
      "semester": 8
    },
    {
      "code": "BEC802",
      "name": "Advanced Embedded System Design",
      "semester": 8
    }
  ],
  "EE": [
    {
      "code": "BEE101",
      "name": "Basic Electrical Engineering",
      "semester": 1
    },
    {
      "code": "BEE102",
      "name": "Engineering Mathematics-I",
      "semester": 1
    },
    {
      "code": "BEE201",
      "name": "Electric Circuit Analysis",
      "semester": 2
    },
    {
      "code": "BEE202",
      "name": "Analog Electronic Circuits",
      "semester": 2
    },
    {
      "code": "BEE301",
      "name": "Electrical Machines-I (Transformers)",
      "semester": 3
    },
    {
      "code": "BEE302",
      "name": "Electromagnetic Field Theory",
      "semester": 3
    },
    {
      "code": "BEE303",
      "name": "Digital Electronics & Logic",
      "semester": 3
    },
    {
      "code": "BEE401",
      "name": "Power Electronics & Drives",
      "semester": 4
    },
    {
      "code": "BEE402",
      "name": "Electrical Machines-II (Induction)",
      "semester": 4
    },
    {
      "code": "BEE403",
      "name": "Linear Control Systems",
      "semester": 4
    },
    {
      "code": "BEE501",
      "name": "Control Systems & Automation",
      "semester": 5
    },
    {
      "code": "BEE502",
      "name": "Power System Analysis & Grid",
      "semester": 5
    },
    {
      "code": "BEE503",
      "name": "Signals & DSP Applications",
      "semester": 5
    },
    {
      "code": "BEE601",
      "name": "High Voltage Engineering",
      "semester": 6
    },
    {
      "code": "BEE602",
      "name": "Electric Vehicles & Energy Storage",
      "semester": 6
    },
    {
      "code": "BEE603",
      "name": "Microcontrollers for Power Systems",
      "semester": 6
    },
    {
      "code": "BEE701",
      "name": "Power System Protection & Switchgear",
      "semester": 7
    },
    {
      "code": "BEE702",
      "name": "Renewable Energy Sources & Microgrid",
      "semester": 7
    },
    {
      "code": "BEE703",
      "name": "Smart Grid Technologies",
      "semester": 7
    },
    {
      "code": "BEE704",
      "name": "Industrial Automation & PLC",
      "semester": 7
    },
    {
      "code": "BEE786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BEE801",
      "name": "Electrical Energy Conservation",
      "semester": 8
    },
    {
      "code": "BEE802",
      "name": "Power Quality & FACTs Devices",
      "semester": 8
    }
  ],
  "ME": [
    {
      "code": "BME101",
      "name": "Elements of Mechanical Engineering",
      "semester": 1
    },
    {
      "code": "BME102",
      "name": "Computer Aided Engineering Drawing",
      "semester": 1
    },
    {
      "code": "BME201",
      "name": "Engineering Mechanics & Statics",
      "semester": 2
    },
    {
      "code": "BME202",
      "name": "Materials Science & Metallurgy",
      "semester": 2
    },
    {
      "code": "BME301",
      "name": "Basic Thermodynamics",
      "semester": 3
    },
    {
      "code": "BME302",
      "name": "Mechanics of Materials",
      "semester": 3
    },
    {
      "code": "BME303",
      "name": "Manufacturing Process-I (Casting)",
      "semester": 3
    },
    {
      "code": "BME401",
      "name": "Applied Thermodynamics & Turbines",
      "semester": 4
    },
    {
      "code": "BME402",
      "name": "Fluid Mechanics & Machinery",
      "semester": 4
    },
    {
      "code": "BME403",
      "name": "Kinematics of Machines",
      "semester": 4
    },
    {
      "code": "BME501",
      "name": "Design of Machine Elements-I",
      "semester": 5
    },
    {
      "code": "BME502",
      "name": "Heat & Mass Transfer",
      "semester": 5
    },
    {
      "code": "BME503",
      "name": "Dynamics of Machinery",
      "semester": 5
    },
    {
      "code": "BME601",
      "name": "Design of Machine Elements-II",
      "semester": 6
    },
    {
      "code": "BME602",
      "name": "Finite Element Analysis (FEA)",
      "semester": 6
    },
    {
      "code": "BME603",
      "name": "Turbo Machines & Aerodynamics",
      "semester": 6
    },
    {
      "code": "BME701",
      "name": "Control Engineering & Robotics",
      "semester": 7
    },
    {
      "code": "BME702",
      "name": "Total Quality Management (TQM)",
      "semester": 7
    },
    {
      "code": "BME703",
      "name": "Automotive Engineering & EV Tech",
      "semester": 7
    },
    {
      "code": "BME704",
      "name": "Mechatronics & MEMS Systems",
      "semester": 7
    },
    {
      "code": "BME786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BME801",
      "name": "Operations Research & Production",
      "semester": 8
    },
    {
      "code": "BME802",
      "name": "Tribology & Surface Engineering",
      "semester": 8
    }
  ],
  "BME": [
    {
      "code": "BBM101",
      "name": "Introduction to Biomedical Engg",
      "semester": 1
    },
    {
      "code": "BBM102",
      "name": "Biochemistry & Cellular Dynamics",
      "semester": 1
    },
    {
      "code": "BBM201",
      "name": "Biomedical Circuits & Analysis",
      "semester": 2
    },
    {
      "code": "BBM202",
      "name": "Medical Physics & Radiation",
      "semester": 2
    },
    {
      "code": "BBM301",
      "name": "Biomedical Transducers & Sensors",
      "semester": 3
    },
    {
      "code": "BBM302",
      "name": "Bio-Electric Potential & Amplifiers",
      "semester": 3
    },
    {
      "code": "BBM303",
      "name": "Medical Electronics",
      "semester": 3
    },
    {
      "code": "BBM401",
      "name": "Human Anatomy & Physiology",
      "semester": 4
    },
    {
      "code": "BBM402",
      "name": "Biosignal Conditioning & Processing",
      "semester": 4
    },
    {
      "code": "BBM403",
      "name": "Pathology & Microbiology for Engrs",
      "semester": 4
    },
    {
      "code": "BBM501",
      "name": "Biomedical Instrumentation",
      "semester": 5
    },
    {
      "code": "BBM502",
      "name": "Biomedical Signal Processing (DSP)",
      "semester": 5
    },
    {
      "code": "BBM503",
      "name": "Biomechanics & Orthotics",
      "semester": 5
    },
    {
      "code": "BBM601",
      "name": "Therapeutic Equipment & Dialysis",
      "semester": 6
    },
    {
      "code": "BBM602",
      "name": "Clinical Engineering & Safety",
      "semester": 6
    },
    {
      "code": "BBM603",
      "name": "Diagnostic Imaging (X-Ray/CT/MRI)",
      "semester": 6
    },
    {
      "code": "BBM701",
      "name": "Medical Imaging Systems & PACS",
      "semester": 7
    },
    {
      "code": "BBM702",
      "name": "Biomaterials & Artificial Organs",
      "semester": 7
    },
    {
      "code": "BBM703",
      "name": "Rehabilitation Engineering",
      "semester": 7
    },
    {
      "code": "BBM704",
      "name": "Hospital Safety & Patient Monitoring",
      "semester": 7
    },
    {
      "code": "BBM786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BBM801",
      "name": "Neural Engineering & Brain-Machine",
      "semester": 8
    },
    {
      "code": "BBM802",
      "name": "Telemedicine & IoT Healthcare",
      "semester": 8
    }
  ],
  "ISE": [
    {
      "code": "BIS101",
      "name": "Mathematics for Information Science",
      "semester": 1
    },
    {
      "code": "BIS102",
      "name": "Fundamentals of Information Tech",
      "semester": 1
    },
    {
      "code": "BIS201",
      "name": "Linear Algebra for Data Science",
      "semester": 2
    },
    {
      "code": "BIS202",
      "name": "Data Structures with C++",
      "semester": 2
    },
    {
      "code": "BIS301",
      "name": "Data Structures & File Structures",
      "semester": 3
    },
    {
      "code": "BIS302",
      "name": "Unix System Programming",
      "semester": 3
    },
    {
      "code": "BIS303",
      "name": "Computer Architecture & Logic",
      "semester": 3
    },
    {
      "code": "BIS401",
      "name": "Analysis & Design of Algorithms",
      "semester": 4
    },
    {
      "code": "BIS402",
      "name": "Operating System Kernels",
      "semester": 4
    },
    {
      "code": "BIS403",
      "name": "Relational Database Management",
      "semester": 4
    },
    {
      "code": "BIS501",
      "name": "Automata & Compiler Design",
      "semester": 5
    },
    {
      "code": "BIS502",
      "name": "Computer Networks & Protocols",
      "semester": 5
    },
    {
      "code": "BIS503",
      "name": "Software Architecture & Testing",
      "semester": 5
    },
    {
      "code": "BIS601",
      "name": "Mobile Application Development",
      "semester": 6
    },
    {
      "code": "BIS602",
      "name": "Cloud Computing Infrastructure",
      "semester": 6
    },
    {
      "code": "BIS603",
      "name": "Data Mining & Business Intelligence",
      "semester": 6
    },
    {
      "code": "BIS701",
      "name": "Cloud Computing & Virtualization",
      "semester": 7
    },
    {
      "code": "BIS702",
      "name": "Information Security & Cryptography",
      "semester": 7
    },
    {
      "code": "BIS703",
      "name": "Distributed Storage & NoSQL Systems",
      "semester": 7
    },
    {
      "code": "BIS704",
      "name": "Software Testing & QA Automation",
      "semester": 7
    },
    {
      "code": "BIS786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BIS801",
      "name": "Cyber Forensics & Incident Response",
      "semester": 8
    },
    {
      "code": "BIS802",
      "name": "DevOps Engineering & CI/CD",
      "semester": 8
    }
  ],
  "AIML": [
    {
      "code": "BAI101",
      "name": "Calculus & Linear Algebra for AI",
      "semester": 1
    },
    {
      "code": "BAI102",
      "name": "Python for Data Scientists",
      "semester": 1
    },
    {
      "code": "BAI201",
      "name": "Probability & Statistics for ML",
      "semester": 2
    },
    {
      "code": "BAI202",
      "name": "Object-Oriented Programming for AI",
      "semester": 2
    },
    {
      "code": "BAI301",
      "name": "Mathematical Foundations of AI",
      "semester": 3
    },
    {
      "code": "BAI302",
      "name": "Data Structures & ML Workflows",
      "semester": 3
    },
    {
      "code": "BAI303",
      "name": "Database Systems for Big Data",
      "semester": 3
    },
    {
      "code": "BAI401",
      "name": "Supervised Learning Algorithms",
      "semester": 4
    },
    {
      "code": "BAI402",
      "name": "Unsupervised & Clustering Methods",
      "semester": 4
    },
    {
      "code": "BAI403",
      "name": "Optimization Techniques in ML",
      "semester": 4
    },
    {
      "code": "BAI501",
      "name": "Deep Learning Fundamentals",
      "semester": 5
    },
    {
      "code": "BAI502",
      "name": "Statistical Machine Learning",
      "semester": 5
    },
    {
      "code": "BAI503",
      "name": "AI Knowledge Representation",
      "semester": 5
    },
    {
      "code": "BAI601",
      "name": "Natural Language Processing (NLP)",
      "semester": 6
    },
    {
      "code": "BAI602",
      "name": "Computer Vision & CNN Architectures",
      "semester": 6
    },
    {
      "code": "BAI603",
      "name": "Generative AI & Large Language Models",
      "semester": 6
    },
    {
      "code": "BAI701",
      "name": "Deep Learning Architectures",
      "semester": 7
    },
    {
      "code": "BAI702",
      "name": "Natural Language Processing Systems",
      "semester": 7
    },
    {
      "code": "BAI703",
      "name": "Computer Vision & Visual AI",
      "semester": 7
    },
    {
      "code": "BAI704",
      "name": "Reinforcement Learning & Agents",
      "semester": 7
    },
    {
      "code": "BAI786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BAI801",
      "name": "AI Ethics, Bias & Governance",
      "semester": 8
    },
    {
      "code": "BAI802",
      "name": "Autonomous Systems & Robotics AI",
      "semester": 8
    }
  ],
  "CSE_AI": [
    {
      "code": "BCA101",
      "name": "Engineering Mathematics-I",
      "semester": 1
    },
    {
      "code": "BCA102",
      "name": "Computational Thinking with Python",
      "semester": 1
    },
    {
      "code": "BCA201",
      "name": "Discrete Structures & Logic",
      "semester": 2
    },
    {
      "code": "BCA202",
      "name": "Data Structures & Algorithms",
      "semester": 2
    },
    {
      "code": "BCA301",
      "name": "Foundations of Artificial Intel",
      "semester": 3
    },
    {
      "code": "BCA302",
      "name": "Object-Oriented Programming (Java)",
      "semester": 3
    },
    {
      "code": "BCA303",
      "name": "Computer Organization & AI Chips",
      "semester": 3
    },
    {
      "code": "BCA401",
      "name": "Design of Efficient Algorithms",
      "semester": 4
    },
    {
      "code": "BCA402",
      "name": "Applied Machine Learning Models",
      "semester": 4
    },
    {
      "code": "BCA403",
      "name": "Operating Systems & Virtualization",
      "semester": 4
    },
    {
      "code": "BCA501",
      "name": "Deep Neural Networks & PyTorch",
      "semester": 5
    },
    {
      "code": "BCA502",
      "name": "Intelligent Agents & Heuristics",
      "semester": 5
    },
    {
      "code": "BCA503",
      "name": "Database Engines & Vector Stores",
      "semester": 5
    },
    {
      "code": "BCA601",
      "name": "Robotics & Intelligent Systems",
      "semester": 6
    },
    {
      "code": "BCA602",
      "name": "Speech Processing & Audio AI",
      "semester": 6
    },
    {
      "code": "BCA603",
      "name": "Cloud AI Pipelines & MLOps",
      "semester": 6
    },
    {
      "code": "BCA701",
      "name": "Neural Networks & Fuzzy Logic",
      "semester": 7
    },
    {
      "code": "BCA702",
      "name": "Robotics & Intelligent Automation",
      "semester": 7
    },
    {
      "code": "BCA703",
      "name": "Big Data Engineering for AI",
      "semester": 7
    },
    {
      "code": "BCA704",
      "name": "Edge AI & Embedded Intelligence",
      "semester": 7
    },
    {
      "code": "BCA786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BCA801",
      "name": "Cognitive Computing & Multimodal AI",
      "semester": 8
    },
    {
      "code": "BCA802",
      "name": "Quantum Machine Learning",
      "semester": 8
    }
  ],
  "CSE_IOT_CS_BT": [
    {
      "code": "BCI101",
      "name": "Engineering Mathematics-I",
      "semester": 1
    },
    {
      "code": "BCI102",
      "name": "Principles of Sensor Networks",
      "semester": 1
    },
    {
      "code": "BCI201",
      "name": "Digital Systems & Cryptography Basics",
      "semester": 2
    },
    {
      "code": "BCI202",
      "name": "Programming with C & Embedded C",
      "semester": 2
    },
    {
      "code": "BCI301",
      "name": "Data Structures & Cryptographic Prims",
      "semester": 3
    },
    {
      "code": "BCI302",
      "name": "Microcontrollers & IoT Sensors",
      "semester": 3
    },
    {
      "code": "BCI303",
      "name": "Computer Architecture & Security",
      "semester": 3
    },
    {
      "code": "BCI401",
      "name": "Network Protocols & Cyber Defense",
      "semester": 4
    },
    {
      "code": "BCI402",
      "name": "Operating System Security",
      "semester": 4
    },
    {
      "code": "BCI403",
      "name": "Database Security & Cryptography",
      "semester": 4
    },
    {
      "code": "BCI501",
      "name": "Wireless Sensor Networks & Zigbee",
      "semester": 5
    },
    {
      "code": "BCI502",
      "name": "Ethical Hacking & Penetration Test",
      "semester": 5
    },
    {
      "code": "BCI503",
      "name": "Blockchain Architecture & Smart Cont",
      "semester": 5
    },
    {
      "code": "BCI601",
      "name": "IoT Cloud Platforms & MQTT/CoAP",
      "semester": 6
    },
    {
      "code": "BCI602",
      "name": "Security in Decentralized Ledger",
      "semester": 6
    },
    {
      "code": "BCI603",
      "name": "Embedded Systems Vulnerability Assess",
      "semester": 6
    },
    {
      "code": "BCI701",
      "name": "IoT Architecture & Security Protocol",
      "semester": 7
    },
    {
      "code": "BCI702",
      "name": "Blockchain Technologies & Ethereum",
      "semester": 7
    },
    {
      "code": "BCI703",
      "name": "Cyber Threat Intelligence & SIEM",
      "semester": 7
    },
    {
      "code": "BCI704",
      "name": "Cloud-Edge IoT Security Frameworks",
      "semester": 7
    },
    {
      "code": "BCI786",
      "name": "Major Project Phase-II",
      "semester": 7
    },
    {
      "code": "BCI801",
      "name": "Zero Trust Architecture & Quantum Crypt",
      "semester": 8
    },
    {
      "code": "BCI802",
      "name": "Decentralized Finance (DeFi) Security",
      "semester": 8
    }
  ]
};

// RGIT Standard College USN Prefix & Formatter
export const RGIT_USN_PREFIX = '1RG';

// 2-Letter VTU Branch Codes for RGIT Departments
export const RGIT_DEPT_BRANCH_CODES = {
  CSE: 'CS',
  ECE: 'EC',
  EE: 'EE',
  BME: 'BM',
  ME: 'ME',
  CSE_AI: 'AI',
  'CSE-AI': 'AI',
  CSE_IOT_CS_BT: 'CB',
  'CSE-IoT/CS/BT': 'CB',
  ISE: 'IS',
  AIML: 'AM',
  'AI & ML': 'AM'
};

export const getDeptBranchCode = (deptIdentifier) => {
  const code = getDeptCode(deptIdentifier);
  return RGIT_DEPT_BRANCH_CODES[code] || 'CS';
};

/**
 * Format raw input as RGIT USN.
 * Total length strictly limited to 10 characters (e.g. 1RG24CS409).
 */
export const formatRGITUsn = (val) => {
  if (val === undefined || val === null) return '';
  const clean = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.substring(0, 10);
};

/**
 * Build 10-character USN from constituent parts:
 * 1RG + Year (2 digits) + Branch (2 letters) + Roll (3 digits)
 * Example: buildRGITUsn('24', 'CS', '409') => '1RG24CS409'
 */
export const buildRGITUsn = (yearDigits = '', branchCode = 'CS', rollDigits = '') => {
  const cleanYear = String(yearDigits || '').replace(/\D/g, '').substring(0, 2);
  const cleanBranch = String(branchCode || 'CS').toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
  const cleanRoll = String(rollDigits || '').replace(/\D/g, '').substring(0, 3);
  return `${RGIT_USN_PREFIX}${cleanYear}${cleanBranch}${cleanRoll}`;
};

/**
 * Parse an existing USN into its components
 */
export const parseRGITUsn = (usn = '') => {
  const clean = formatRGITUsn(usn);
  const match = clean.match(/^1RG(\d{0,2})([A-Z]{0,2})(\d{0,3})$/);
  if (!match) {
    return {
      isValid: false,
      prefix: '1RG',
      year: '',
      branch: '',
      roll: '',
      full: clean
    };
  }
  return {
    isValid: clean.length === 10 && /^\d{2}$/.test(match[1]) && /^[A-Z]{2}$/.test(match[2]) && /^\d{3}$/.test(match[3]),
    prefix: '1RG',
    year: match[1] || '',
    branch: match[2] || '',
    roll: match[3] || '',
    full: clean
  };
};

/**
 * Strict validator for 10-character RGIT USN
 */
export const validateRGITUsn = (usn, expectedDept = null) => {
  const clean = formatRGITUsn(usn);
  if (!clean || clean === '1RG') {
    return { valid: false, error: 'University Seat Number (USN) is mandatory (e.g. 1RG24CS409).' };
  }
  if (clean.length !== 10) {
    return {
      valid: false,
      error: `USN must be exactly 10 characters long (e.g. 1RG24CS409). Currently ${clean.length} characters entered. You cannot enter less or more.`
    };
  }
  if (!clean.startsWith('1RG')) {
    return { valid: false, error: "USN must begin with college prefix '1RG' (e.g. 1RG24CS409)." };
  }
  const regex = /^1RG(\d{2})([A-Z]{2})(\d{3})$/;
  const match = clean.match(regex);
  if (!match) {
    return {
      valid: false,
      error: 'Invalid USN credentials. Must match format: 1RG + 2-digit Year (e.g. 24) + 2-letter Dept (e.g. CS) + 3-digit Roll No (e.g. 409) = 1RG24CS409.'
    };
  }
  if (expectedDept) {
    const expectedBranch = getDeptBranchCode(expectedDept);
    const actualBranch = match[2];
    if (actualBranch !== expectedBranch) {
      return {
        valid: false,
        error: `USN department code '${actualBranch}' does not match the selected department '${expectedDept}' (expected '${expectedBranch}', e.g. 1RG24${expectedBranch}${match[3]}).`
      };
    }
  }
  return { valid: true, usn: clean };
};

// Phone & Email Validation Utilities
export const COUNTRY_CODE_OPTIONS = [
  { code: '+91', country: 'India', flag: '🇮🇳', digits: 10, label: '+91 (India)' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸', digits: 10, label: '+1 (USA)' },
  { code: '+44', country: 'UK', flag: '🇬🇧', digits: 10, label: '+44 (UK)' },
  { code: '+971', country: 'UAE', flag: '🇦🇪', digits: 9, label: '+971 (UAE)' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', digits: 9, label: '+61 (AUS)' },
];

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/;
  if (!regex.test(clean)) return false;
  if (clean.includes('..')) return false;
  return true;
};

export const cleanPhoneDigits = (val) => {
  return String(val || '').replace(/\D/g, '');
};

export const validatePhoneNumber = (phoneDigits, countryCode = '+91') => {
  const digits = cleanPhoneDigits(phoneDigits);
  if (!digits) {
    return { valid: false, error: 'Mobile phone number is mandatory.' };
  }
  if (countryCode === '+91') {
    if (digits.length !== 10) {
      return {
        valid: false,
        error: `Indian mobile number (+91) must be exactly 10 digits (currently ${digits.length} digits entered). Not more, not less.`
      };
    }
    if (!/^[6-9]/.test(digits)) {
      return {
        valid: false,
        error: 'Indian mobile number should begin with 6, 7, 8, or 9 (e.g. 9876543210).'
      };
    }
  } else if (countryCode === '+1') {
    if (digits.length !== 10) {
      return { valid: false, error: `US/Canada phone number (+1) must be exactly 10 digits.` };
    }
  } else if (countryCode === '+971' || countryCode === '+61') {
    if (digits.length !== 9) {
      return { valid: false, error: `Phone number for ${countryCode} must be exactly 9 digits.` };
    }
  } else {
    if (digits.length < 7 || digits.length > 15) {
      return { valid: false, error: `Please enter a valid phone number (${countryCode}).` };
    }
  }
  return { valid: true, digits };
};
