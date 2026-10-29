import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, MapPin, Sliders, Lock, RefreshCw, Activity,
  Users, UserCheck, Search, Filter, CheckCircle, XCircle,
  Clock, BookOpen, KeyRound, Eye, EyeOff, ChevronRight, X, Phone,
  Mail, Award, AlertTriangle, Sparkles, GraduationCap, Check,
  UserPlus, Edit3, Trash2, Plus, Building, Download, FileSpreadsheet, User,
  Calendar, Save, LayoutGrid, Layers, ChevronDown, Star, Bell, Database,
  Zap, Palette, Radio, Terminal, Compass, Camera
} from 'lucide-react';
import { api } from '../services/api';
import { RGIT_BE_COURSES, isDeptMatch, getDeptCode, DEPARTMENT_SUBJECT_CATALOG_FRONTEND, DEPT_DB_FILE, isValidEmail, cleanPhoneDigits, validatePhoneNumber, COUNTRY_CODE_OPTIONS } from '../constants/courses';
import { THEMES, applyTheme } from './ThemeCustomizerModal';

const REJECTION_PRESETS = [
  {
    id: 'blurry_photo',
    label: 'Blurry / Dim Photo',
    badge: 'Photo Quality',
    description: 'Out of focus, dark, or low resolution',
    text: 'Biometric face photo is blurry, dark, or does not meet clarity standards. Please upload a clear photo with good lighting.'
  },
  {
    id: 'face_obscured',
    label: 'Face Obscured / Covered',
    badge: 'Visibility',
    description: 'Wearing glasses, mask, cap, or tilted angle',
    text: 'Face is partially obscured (glasses/mask/cap/tilted). Face must be directly looking into the camera without obstructions.'
  },
  {
    id: 'multiple_faces',
    label: 'Multiple Faces in Photo',
    badge: 'Biometrics',
    description: 'Multiple people in background or not student',
    text: 'Multiple faces detected in image or photo does not clearly show the applicant student alone.'
  },
  {
    id: 'usn_not_found',
    label: 'USN Not in Roster',
    badge: 'Admission Ledger',
    description: 'USN missing from college admission roster',
    text: 'USN was not found in official VTU / RGIT department admission ledger for this semester. Please verify your USN.'
  },
  {
    id: 'dept_sem_mismatch',
    label: 'Wrong Dept or Semester',
    badge: 'Program Info',
    description: 'Wrong branch, semester, or section chosen',
    text: 'Incorrect Department, Semester, or Section selected. Please re-register under your correct academic program.'
  },
  {
    id: 'duplicate_reg',
    label: 'Duplicate Registration',
    badge: 'Security',
    description: 'Student profile already registered with this USN',
    text: 'Duplicate registration detected. An active profile or registration request already exists for this USN.'
  },
  {
    id: 'custom',
    label: 'Other / Write Custom Reason',
    badge: 'Custom Note',
    description: 'Type your own specific rejection feedback',
    text: ''
  }
];

export default function AdminPortal({ currentUser }) {
  const [activeTab, setActiveTab] = useState('kpis'); // 'kpis' | 'students' | 'faculty' | 'geofence' | 'audit'
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('ALL');
  
  // Student Directory Filter States
  const [studentSectionFilter, setStudentSectionFilter] = useState('ALL');
  const [studentSemesterFilter, setStudentSemesterFilter] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('ALL'); // 'ALL' | 'DEFAULTER' | 'COMPLIANT'
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

  // Student Edit Modal States (HOD Exclusive)
  const [editStudentModal, setEditStudentModal] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    usn: '',
    email: '',
    countryCode: '+91',
    phone: '',
    semester: 7,
    section: 'A',
    department: '',
    unbind_device: false,
    password: '',
    showPassword: false,
    photo_base64: null,
    photo_preview: null,
    isWebcamActive: false,
    webcamError: null
  });
  const [savingStudent, setSavingStudent] = useState(false);
  const [studentEditError, setStudentEditError] = useState(null);
  const [studentEditSuccess, setStudentEditSuccess] = useState(null);
  const [photoTimestamp, setPhotoTimestamp] = useState(() => Date.now());
  const editVideoRef = useRef(null);
  const editFileInputRef = useRef(null);
  const editStreamRef = useRef(null);

  // Faculty Directory & Onboarding States (Admin Only)
  const [facultySearch, setFacultySearch] = useState('');
  const [pendingRegs, setPendingRegs] = useState([]);
  const [newFacultyModal, setNewFacultyModal] = useState(false);
  const [editFacultySubjectsModal, setEditFacultySubjectsModal] = useState(null);
  const [editSubjectCodes, setEditSubjectCodes] = useState([]);
  const [editFacultyCredentialsModal, setEditFacultyCredentialsModal] = useState(null);
  const [editFacultyProfileModal, setEditFacultyProfileModal] = useState(null);
  const [editProfileData, setEditProfileData] = useState({
    facultyId: null,
    full_name: '',
    email: '',
    phone: '',
    designation: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [editCredentialsData, setEditCredentialsData] = useState({
    facultyId: null,
    facultyName: '',
    username: '',
    newPassword: ''
  });
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [facultyFormData, setFacultyFormData] = useState({
    fullName: '',
    facultyCode: '',
    username: '',
    password: '',
    designation: 'Assistant Professor',
    department: 'Computer Science & Engineering',
    semester: 1,
    email: '',
    countryCode: '+91',
    phone: '',
    subjectCodes: []
  });
  const [facultyFormError, setFacultyFormError] = useState(null);
  const [facultyFormLoading, setFacultyFormLoading] = useState(false);

  // Student Registration Approvals States (HOD Verification Queue)
  const [approvalSemesterFilter, setApprovalSemesterFilter] = useState('ALL');
  const [approvalSectionFilter, setApprovalSectionFilter] = useState('ALL');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('PENDING');
  const [approvalSearch, setApprovalSearch] = useState('');
  const [previewPhotoModal, setPreviewPhotoModal] = useState(null);
  const [rejectModalData, setRejectModalData] = useState(null);
  const [rejectReason, setRejectReason] = useState(REJECTION_PRESETS[0].text);
  const [selectedRejectPreset, setSelectedRejectPreset] = useState('blurry_photo');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [approvalFeedback, setApprovalFeedback] = useState(null);

  // Department HOD Governance States (Master Admin MOHD Only)
  const [departmentHods, setDepartmentHods] = useState([]);
  const [hodsLoading, setHodsLoading] = useState(false);
  const [createHODModal, setCreateHODModal] = useState(false);
  const [createHODForm, setCreateHODForm] = useState({
    department: 'B.E in Electronics and Communication Engineering',
    full_name: '',
    username: '',
    password: '',
    email: '',
    phone: ''
  });
  const [createHODError, setCreateHODError] = useState(null);
  const [createHODLoading, setCreateHODLoading] = useState(false);

  // Edit / Set HOD Password Modal State
  const [editHODPasswordModal, setEditHODPasswordModal] = useState(null);
  const [editHODPasswordData, setEditHODPasswordData] = useState({
    hodId: null,
    department: '',
    fullName: '',
    username: '',
    email: '',
    phone: '',
    newPassword: '',
    showPassword: false
  });
  const [editHODPasswordLoading, setEditHODPasswordLoading] = useState(false);
  const [editHODPasswordError, setEditHODPasswordError] = useState(null);

  // HOD Timetable Manager State
  const [timetableTab, setTimetableTab] = useState('timetable'); // 'timetable'
  const [timetableDept, setTimetableDept] = useState('');
  const [timetableSemester, setTimetableSemester] = useState(1);
  const [timetableSection, setTimetableSection] = useState('A');
  const [timetableDay, setTimetableDay] = useState('Monday');
  const [timetableMatrix, setTimetableMatrix] = useState([]);
  const [timetableAvailableSubjects, setTimetableAvailableSubjects] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableMsg, setTimetableMsg] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editSlotData, setEditSlotData] = useState({
    subject_code: '',
    subject_name: '',
    faculty_name: '',
    room: ''
  });
  const [savingSlot, setSavingSlot] = useState(false);
  const [customSubjectCode, setCustomSubjectCode] = useState('');
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [useCustomSubject, setUseCustomSubject] = useState(false);

  // Overview Tab Registered Academic Subjects State
  const [overviewSubjectDept, setOverviewSubjectDept] = useState('ALL');
  const [overviewSubjectSem, setOverviewSubjectSem] = useState('1'); // Default to Sem 1, NOT 7!
  const [overviewSubjectSearch, setOverviewSubjectSearch] = useState('');
  
  // Geofence Studio State
  const [radiusInput, setRadiusInput] = useState(250);
  const [enforceGeofence, setEnforceGeofence] = useState(true);
  const [geofenceMsg, setGeofenceMsg] = useState(null);

  // Department Databases Status State
  const [deptDbStatus, setDeptDbStatus] = useState(null);

  const loadData = async () => {
    try {
      const dashboardStats = await api.getDashboardStats();
      setStats(dashboardStats);
      setRadiusInput(dashboardStats.geofence_radius_meters || 250);
      setEnforceGeofence(dashboardStats.geofence_enforced ?? true);

      try {
        const dbStatus = await api.getDepartmentDatabasesStatus();
        setDeptDbStatus(dbStatus);
      } catch (e) {}

      const logs = await api.getAuditLogs();
      setAuditLogs(logs);

      // Load all students
      const studs = await api.getStudentsList();
      setStudents(studs);

      // Load all faculty
      const facs = await api.getFacultyList();
      setFaculty(facs);

      // Load all curriculum subjects
      const subs = await api.getAllSubjects();
      setAllSubjects(subs);

      // Load self-registration queue
      const regs = await api.getPendingRegistrations();
      setPendingRegs(regs);

      // Load department HODs
      try {
        const hods = await api.getDepartmentHods();
        if (Array.isArray(hods)) {
          setDepartmentHods(hods);
        }
      } catch (e) {}
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Update Campus Geofence Perimeter
  const handleUpdateGeofence = async () => {
    setLoading(true);
    setGeofenceMsg(null);
    try {
      await api.updateGeofence(radiusInput, enforceGeofence);
      setGeofenceMsg({
        type: 'success',
        text: `Campus geofence perimeter updated to ${radiusInput} meters. Enforcement: ${enforceGeofence ? 'ON' : 'OFF'}`
      });
      loadData();
    } catch (err) {
      setGeofenceMsg({
        type: 'error',
        text: 'Failed to update geofence: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Admin Onboarding New Teacher Handlers
  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setFacultyFormError(null);
    if (!facultyFormData.fullName.trim()) {
      setFacultyFormError('Full name is required.');
      return;
    }
    if (!facultyFormData.facultyCode.trim()) {
      setFacultyFormError('Faculty code (e.g. FAC-CS-03) is required.');
      return;
    }
    if (!facultyFormData.username.trim()) {
      setFacultyFormError('Login username is required.');
      return;
    }
    // Email is required and must match valid format
    const emailVal = facultyFormData.email.trim().toLowerCase();
    if (!emailVal) {
      setFacultyFormError('Email address is mandatory.');
      return;
    }
    if (!isValidEmail(emailVal)) {
      setFacultyFormError('Please enter a valid email address format (e.g. name@rgit.ac.in or name@gmail.com).');
      return;
    }
    // Phone is required - validate based on country code (e.g. +91 strictly 10 digits only)
    const phoneValResult = validatePhoneNumber(facultyFormData.phone, facultyFormData.countryCode);
    if (!phoneValResult.valid) {
      setFacultyFormError(phoneValResult.error);
      return;
    }
    if (facultyFormData.subjectCodes.length === 0) {
      setFacultyFormError('Please select at least one subject to assign to this teacher.');
      return;
    }

    const fullPhone = `${facultyFormData.countryCode} ${phoneValResult.digits}`;
    setFacultyFormLoading(true);
    try {
      await api.createFaculty({
        full_name: facultyFormData.fullName.trim(),
        faculty_code: facultyFormData.facultyCode.trim().toUpperCase(),
        username: facultyFormData.username.trim(),
        password: facultyFormData.password.trim(),
        designation: facultyFormData.designation,
        department: facultyFormData.department,
        email: emailVal,
        phone: fullPhone,
        subject_codes: facultyFormData.subjectCodes
      });
      setNewFacultyModal(false);
      setFacultyFormData({
        fullName: '',
        facultyCode: '',
        username: '',
        password: '',
        designation: 'Assistant Professor',
        department: 'Computer Science & Engineering',
        email: '',
        countryCode: '+91',
        phone: '',
        subjectCodes: []
      });
      loadData();
    } catch (err) {
      setFacultyFormError(err.message || 'Failed to onboard teacher');
    } finally {
      setFacultyFormLoading(false);
    }
  };

  const handleToggleSubjectSelection = (code) => {
    setFacultyFormData(prev => {
      const exists = prev.subjectCodes.includes(code);
      return {
        ...prev,
        subjectCodes: exists ? prev.subjectCodes.filter(c => c !== code) : [...prev.subjectCodes, code]
      };
    });
  };

  const handleToggleEditSubjectSelection = (code) => {
    setEditSubjectCodes(prev => {
      const exists = prev.includes(code);
      return exists ? prev.filter(c => c !== code) : [...prev, code];
    });
  };

  const handleSaveUpdatedSubjects = async () => {
    if (!editFacultySubjectsModal) return;
    if (editSubjectCodes.length === 0) {
      alert('Teacher must be assigned to at least one subject.');
      return;
    }
    setFacultyFormLoading(true);
    try {
      await api.updateFacultySubjects(editFacultySubjectsModal.id, editSubjectCodes);
      setEditFacultySubjectsModal(null);
      loadData();
    } catch (err) {
      alert('Update failed: ' + err.message);
    } finally {
      setFacultyFormLoading(false);
    }
  };

  const handleSaveUpdatedProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editProfileData.full_name.trim()) {
      alert('Please enter a name.');
      return;
    }
    const emailToSave = editProfileData.email.trim().toLowerCase();
    if (!emailToSave) {
      alert('Email address is mandatory.');
      return;
    }
    if (!isValidEmail(emailToSave)) {
      alert('Please enter a valid email address (e.g. name@rgit.ac.in or name@gmail.com).');
      return;
    }
    const phCheck = validatePhoneNumber(editProfileData.phone, '+91');
    if (!phCheck.valid) {
      alert(phCheck.error);
      return;
    }
    setProfileLoading(true);
    try {
      await api.updateFacultyProfile(editProfileData.facultyId, {
        full_name: editProfileData.full_name.trim(),
        email: emailToSave,
        phone: `+91 ${phCheck.digits}`,
        designation: editProfileData.designation.trim()
      });
      alert('Faculty details updated successfully!');
      setEditFacultyProfileModal(null);
      loadData();
    } catch (err) {
      alert('Failed to update teacher profile: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveUpdatedCredentials = async (e) => {
    if (e) e.preventDefault();
    if (!editCredentialsData.newPassword.trim()) {
      alert('Please enter the new password set by Admin for this teacher.');
      return;
    }
    setCredentialsLoading(true);
    try {
      await api.updateFacultyCredentials(
        editCredentialsData.facultyId,
        editCredentialsData.newPassword.trim(),
        editCredentialsData.username.trim() || null
      );
      alert(`Login credentials saved successfully!\nTeacher Login Name: ${editCredentialsData.username}\n\nPassword has been securely updated. Share it privately with the teacher.`);
      setEditFacultyCredentialsModal(null);
      loadData();
    } catch (err) {
      alert('Failed to update teacher credentials: ' + err.message);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleDeleteFaculty = async (facultyId, facultyName) => {
    if (!window.confirm(`Are you sure you want to remove teacher ${facultyName} from RGIT? This will delete their faculty credentials.`)) {
      return;
    }
    try {
      await api.deleteFaculty(facultyId);
      loadData();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };


  // Resolve user department code
  const userDeptCode = getDeptCode(currentUser?.department) || 'CSE';

  // Check if logged-in user is Master Super Admin (MOHD / admin) or a specific Department HOD
  const isMasterAdmin = 
    currentUser?.username?.toUpperCase() === 'MOHD' || 
    currentUser?.username === 'admin' || 
    currentUser?.role === 'admin' ||
    currentUser?.role === 'admin_master';

  // HOD & Administrator Exclusive Permission to edit student profiles and semesters
  const isHod = currentUser?.role === 'hod' || isMasterAdmin;
  const canEditStudent = isHod || isMasterAdmin;

  // Admin department filter: 'ALL' or specific department code (e.g. 'CSE', 'ECE', 'EE', 'ME', etc.)
  // If HOD: strictly locked to userDeptCode. If Master Admin: defaults to 'ALL', can scope to any dept.
  const [adminDeptFilter, setAdminDeptFilter] = useState(() => (!isMasterAdmin ? userDeptCode : 'ALL'));
  const currentEffectiveDept = isMasterAdmin ? adminDeptFilter : userDeptCode;

  // HOD Active Course Department Selection
  const [hodCourse, setHodCourse] = useState(currentUser?.department || 'B.E in Computer Science and Engineering');
  const hodDepartmentName = isMasterAdmin 
    ? (currentEffectiveDept !== 'ALL' ? (RGIT_BE_COURSES.find(c => c.code === currentEffectiveDept)?.name || hodCourse) : hodCourse)
    : (currentUser?.department || hodCourse || 'B.E in Computer Science and Engineering');

  // Futuristic Theme State
  const [activeThemeId, setActiveThemeId] = useState(() => localStorage.getItem('rgit_active_theme') || 'cyber-neon');
  const handleSwitchTheme = (tId) => {
    setActiveThemeId(tId);
    applyTheme(tId);
  };

  // Switch Scoped Department (instantly scopes entire dashboard: students, faculty, stats, timetable)
  const handleSelectDept = (deptCode) => {
    setAdminDeptFilter(deptCode);
    const matched = RGIT_BE_COURSES.find(c => c.code === deptCode);
    if (matched) {
      setHodCourse(matched.name);
    }
    if (deptCode !== 'ALL') {
      setTimetableDept(deptCode);
    }
  };

  // 1-Click Export VTU / NBA Audit Compliance Report (CSV) for Scoped Department
  const exportVTUReportCSV = () => {
    try {
      const targetStudents = filteredStudents && filteredStudents.length > 0 ? filteredStudents : students;
      if (!targetStudents || targetStudents.length === 0) {
        alert('No student records available to export for the selected department.');
        return;
      }

      const headers = [
        "USN",
        "Student Name",
        "Department / Course",
        "Semester",
        "Section",
        "Attendance Percentage (%)",
        "Defaulter Status",
        "Biometric Face Enrolled"
      ];

      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = targetStudents.map(s => [
        escapeCsv(s.usn || ''),
        escapeCsv(s.name || s.full_name || s.username || 'Student'),
        escapeCsv(s.department || hodDepartmentName || currentEffectiveDept || 'RGIT Bangalore'),
        escapeCsv(`Sem ${s.semester || 1}`),
        escapeCsv(`Sec ${s.section || 'A'}`),
        escapeCsv(`${s.attendance_percentage !== undefined ? s.attendance_percentage : 85}%`),
        escapeCsv(s.is_defaulter ? "DEFAULTER (<75%)" : "COMPLIANT (>=75%)"),
        escapeCsv(s.face_registered ? "YES" : "NO")
      ]);

      const csvContent = [
        ["RAJIV GANDHI INSTITUTE OF TECHNOLOGY (RGIT), BANGALORE"].map(escapeCsv).join(","),
        ["VTU / NBA AUDIT COMPLIANCE ATTENDANCE REPORT"].map(escapeCsv).join(","),
        ["Department Scoped", hodDepartmentName || currentEffectiveDept || "ALL"].map(escapeCsv).join(","),
        ["Generated Date", new Date().toLocaleString()].map(escapeCsv).join(","),
        ["Total Records", String(targetStudents.length)].map(escapeCsv).join(","),
        "",
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\r\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      link.href = url;
      const deptClean = (currentEffectiveDept || 'ALL').replace(/\s+/g, '_');
      const todayStr = new Date().toISOString().split('T')[0];
      link.download = `RGIT_VTU_Audit_Report_${deptClean}_${todayStr}.csv`;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
          window.URL.revokeObjectURL(url);
        } catch (e) {}
      }, 15000);

      alert(`VTU Attendance Report CSV exported successfully (${targetStudents.length} students)!`);
    } catch (err) {
      console.error('Failed to export VTU report CSV:', err);
      alert('Failed to export CSV report: ' + err.message);
    }
  };

  // 1-Click Export Official Monthly Excel Sheet (.xlsx) with Google Calendar Govt Holidays till date
  const exportOfficialMonthlyExcel = async () => {
    try {
      const dept = currentEffectiveDept || null;
      const semToUse = activeSemFilter && activeSemFilter !== 'ALL' ? parseInt(activeSemFilter, 10) : 7;
      await api.downloadAttendanceExcel({
        department: dept,
        subjectCode: 'BCS702',
        section: 'A',
        semester: semToUse,
        month: 10,
        year: 2026,
        dateTo: new Date().toISOString().split('T')[0],
        reportType: 'monthly_matrix'
      });
      alert('Official Attendance Sheet (.xlsx) with Google Calendar Government Holidays till date downloaded successfully!');
    } catch (err) {
      console.error('Failed to export Official Excel sheet:', err);
      alert('Failed to export Official Excel sheet: ' + (err.message || 'Server error'));
    }
  };

  // 1-Click Export Official Attendance CSV with Google Calendar Govt Holidays till date
  const exportOfficialMonthlyCSV = async () => {
    try {
      const dept = currentEffectiveDept || null;
      const semToUse = activeSemFilter && activeSemFilter !== 'ALL' ? parseInt(activeSemFilter, 10) : 7;
      await api.downloadAttendanceCsv({
        department: dept,
        subjectCode: 'BCS702',
        section: 'A',
        semester: semToUse,
        month: 10,
        year: 2026,
        dateTo: new Date().toISOString().split('T')[0],
        reportType: 'monthly_matrix'
      });
      alert('Official Attendance Sheet (CSV) with Google Calendar Government Holidays till date downloaded successfully!');
    } catch (err) {
      console.error('Failed to export Official CSV sheet:', err);
      alert('Failed to export Official CSV sheet: ' + (err.message || 'Server error'));
    }
  };

  // 1-Click Export Day-to-Day Subject Attendance Register (CSV with exact Date, Time, USN)
  const exportDayToDaySubjectCSV = async (subjectCode = null) => {
    try {
      const dept = currentEffectiveDept || null;
      await api.downloadAttendanceCsv({
        department: dept,
        subjectCode: subjectCode || null,
        section: 'ALL',
        semester: activeSemFilter && activeSemFilter !== 'ALL' ? parseInt(activeSemFilter, 10) : null,
        reportType: 'day_to_day'
      });
      alert(`Day-to-Day Subject Attendance Register exported successfully!`);
    } catch (err) {
      console.error('Failed to export Day-to-Day CSV:', err);
      alert('Failed to export Day-to-Day CSV: ' + (err.message || 'Server error'));
    }
  };
  // Master Admin (MOHD) HOD Management Action Handlers
  const handleOpenCreateHOD = () => {
    setCreateHODForm({
      department: RGIT_BE_COURSES[0].name,
      full_name: '',
      username: '',
      password: '',
      email: '',
      phone: ''
    });
    setCreateHODError(null);
    setCreateHODModal(true);
  };

  const handleCreateHODSubmit = async (e) => {
    e.preventDefault();
    setCreateHODError(null);
    if (!createHODForm.department) {
      setCreateHODError('Please select an engineering department.');
      return;
    }
    if (!createHODForm.full_name.trim()) {
      setCreateHODError('Please enter the HOD full name.');
      return;
    }
    if (!createHODForm.username.trim()) {
      setCreateHODError('Please enter the HOD login username.');
      return;
    }
    const hodEmail = createHODForm.email.trim().toLowerCase();
    if (!hodEmail) {
      setCreateHODError('HOD email address is mandatory.');
      return;
    }
    if (!isValidEmail(hodEmail)) {
      setCreateHODError('Please enter a valid email address format (e.g. hod.dept@rgit.ac.in or name@gmail.com).');
      return;
    }

    if (!createHODForm.phone || !createHODForm.phone.trim()) {
      setCreateHODError('HOD mobile phone number is mandatory.');
      return;
    }
    const phCheck = validatePhoneNumber(createHODForm.phone, '+91');
    if (!phCheck.valid) {
      setCreateHODError(phCheck.error);
      return;
    }
    const formattedHODPhone = `+91 ${phCheck.digits}`;

    setCreateHODLoading(true);
    try {
      await api.createDepartmentHOD({
        department: createHODForm.department,
        full_name: createHODForm.full_name.trim(),
        username: createHODForm.username.trim(),
        password: createHODForm.password.trim(),
        email: createHODForm.email.trim().toLowerCase() || undefined,
        phone: formattedHODPhone
      });
      // Do NOT show password in alert for security
      alert(`HOD account created successfully!\nDepartment: ${createHODForm.department}\nHOD: ${createHODForm.full_name}\nLogin Username: ${createHODForm.username}\n\nPassword has been securely set. Share it privately with the HOD.`);
      setCreateHODModal(false);
      loadData();
    } catch (err) {
      setCreateHODError(err.message || 'Failed to create HOD account.');
    } finally {
      setCreateHODLoading(false);
    }
  };

  const handleOpenEditHODPassword = (hod) => {
    const rawDigits = cleanPhoneDigits(hod.phone || '');
    const clean10 = rawDigits.startsWith('91') && rawDigits.length === 12 ? rawDigits.slice(2) : (rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits);
    setEditHODPasswordData({
      hodId: hod.id,
      department: hod.department || '',
      fullName: hod.full_name || '',
      username: hod.username || '',
      email: (hod.email || '').trim().toLowerCase(),
      phone: clean10,
      newPassword: '',
      showPassword: false
    });
    setEditHODPasswordError(null);
    setEditHODPasswordModal(hod);
  };

  const handleSaveHODPassword = async (e) => {
    e.preventDefault();
    if (!editHODPasswordData.username.trim() || !editHODPasswordData.fullName.trim()) {
      setEditHODPasswordError('Username and Full Name are required.');
      return;
    }

    const hodEmail = editHODPasswordData.email ? editHODPasswordData.email.trim().toLowerCase() : '';
    if (!hodEmail) {
      setEditHODPasswordError('Email address is mandatory.');
      return;
    }
    if (!isValidEmail(hodEmail)) {
      setEditHODPasswordError('Please enter a valid email address (e.g. hod.dept@rgit.ac.in or name@gmail.com).');
      return;
    }

    if (!editHODPasswordData.phone || !editHODPasswordData.phone.trim()) {
      setEditHODPasswordError('Mobile phone number is mandatory.');
      return;
    }
    const phCheck = validatePhoneNumber(editHODPasswordData.phone, '+91');
    if (!phCheck.valid) {
      setEditHODPasswordError(phCheck.error);
      return;
    }
    const formattedHODPhone = `+91 ${phCheck.digits}`;

    setEditHODPasswordLoading(true);
    setEditHODPasswordError(null);
    try {
      await api.updateHODPassword(
        editHODPasswordData.hodId,
        editHODPasswordData.newPassword.trim() || null,
        editHODPasswordData.username.trim() || null,
        editHODPasswordData.department.trim() || null,
        editHODPasswordData.fullName.trim() || null,
        editHODPasswordData.email.trim().toLowerCase() || null,
        formattedHODPhone
      );
      if (currentUser?.id === editHODPasswordData.hodId) {
        const updated = {
          ...currentUser,
          full_name: editHODPasswordData.fullName.trim(),
          email: editHODPasswordData.email.trim().toLowerCase(),
          phone: formattedHODPhone
        };
        api.setCurrentUser(updated);
      }

      alert(`Credentials and Details updated successfully for HOD ${editHODPasswordData.fullName} (${editHODPasswordData.department})!`);
      setEditHODPasswordModal(null);
      loadData();
    } catch (err) {
      setEditHODPasswordError(err.message || 'Failed to update HOD credentials.');
    } finally {
      setEditHODPasswordLoading(false);
    }
  };

  // HOD Timetable: Resolve correct dept code for API calls
  const resolveTimetableDept = useCallback(() => {
    if (isMasterAdmin) {
      return timetableDept || (adminDeptFilter !== 'ALL' ? getDeptCode(adminDeptFilter) : 'CSE');
    }
    // For HOD: always use their own dept code from getDeptCode
    return getDeptCode(currentUser?.department) || 'CSE';
  }, [isMasterAdmin, timetableDept, adminDeptFilter, currentUser]);

  // HOD Timetable: Load timetable matrix
  const loadTimetableMatrix = useCallback(async () => {
    const dept = resolveTimetableDept();
    setTimetableLoading(true);
    setTimetableMsg(null);
    try {
      const data = await api.getTimetableMatrix(dept, timetableSemester, timetableSection, timetableDay);
      setTimetableMatrix(data.matrix || []);
      setTimetableAvailableSubjects(data.available_subjects || []);
    } catch (err) {
      setTimetableMsg({ type: 'error', text: 'Failed to load timetable: ' + err.message });
    } finally {
      setTimetableLoading(false);
    }
  }, [resolveTimetableDept, timetableSemester, timetableSection, timetableDay]);

  useEffect(() => {
    if (activeTab === 'timetable') {
      loadTimetableMatrix();
    }
  }, [activeTab, loadTimetableMatrix]);

  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setUseCustomSubject(false);
    setCustomSubjectCode('');
    setCustomSubjectName('');
    setEditSlotData({
      subject_code: slot.subject_code || '',
      subject_name: slot.subject_name || '',
      faculty_name: slot.faculty_name || '',
      room: slot.room || 'LH-101'
    });
  };

  const handleSaveSlot = async (slot) => {
    const finalCode = useCustomSubject ? customSubjectCode.trim().toUpperCase() : editSlotData.subject_code.trim().toUpperCase();
    const finalName = useCustomSubject ? customSubjectName.trim() : editSlotData.subject_name.trim();
    if (!finalCode) {
      setTimetableMsg({ type: 'error', text: 'Subject code is required. Please select from the list or enter a custom code.' });
      return;
    }
    setSavingSlot(true);
    setTimetableMsg(null);
    const dept = resolveTimetableDept();
    try {
      await api.setTimetableEntry({
        department: dept,
        semester: timetableSemester,
        section: timetableSection,
        day_of_week: timetableDay,
        period_number: slot.period_number,
        subject_code: finalCode,
        subject_name: finalName || finalCode,
        faculty_name: editSlotData.faculty_name.trim(),
        room: editSlotData.room.trim() || 'LH-101'
      });
      setTimetableMsg({ type: 'success', text: `✅ Period ${slot.period_number} saved successfully for ${dept} Sem ${timetableSemester} Sec ${timetableSection} (${timetableDay})!` });
      setEditingSlot(null);
      setUseCustomSubject(false);
      loadTimetableMatrix();
    } catch (err) {
      setTimetableMsg({ type: 'error', text: '❌ Failed to save: ' + (err.message || 'Server error. Check that you are logged in as HOD.') });
    } finally {
      setSavingSlot(false);
    }
  };

  const handleDeleteHOD = async (hod) => {
    if (!window.confirm(`Are you sure you want to remove HOD ${hod.full_name} from ${hod.department}? This will revoke their HOD access.`)) {
      return;
    }
    try {
      await api.deleteDepartmentHOD(hod.id);
      loadData();
    } catch (err) {
      alert('Failed to delete HOD: ' + err.message);
    }
  };

  const handleDeleteStudent = async (student) => {
    const studentName = student.name || student.full_name || student.usn;
    if (!window.confirm(`Are you sure you want to permanently delete student ${studentName} (${student.usn})?\n\nThis will remove their biometric face profile, device bindings, and all attendance records.`)) {
      return;
    }
    setActionLoadingId(student.id || student.usn);
    try {
      const res = await api.deleteStudent(student.usn);
      alert(res.message || `Student ${studentName} (${student.usn}) was permanently deleted.`);
      if (selectedStudentForModal && selectedStudentForModal.usn === student.usn) {
        setSelectedStudentForModal(null);
      }
      loadData();
    } catch (err) {
      alert(`Failed to delete student: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // HOD Student Profile & Semester Edit Handlers
  const handleOpenEditStudent = (student) => {
    if (!canEditStudent) {
      alert('Access Restricted: Only Department HOD or Administrator has authority to edit student academic records.');
      return;
    }
    const rawPhone = student.phone || '';
    const digitsOnly = cleanPhoneDigits(rawPhone);
    const tenDigits = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    const initialPhotoUrl = student.photo_url || `/api/students/${student.usn}/photo?t=${Date.now()}`;

    setEditStudentModal(student);
    setEditStudentForm({
      name: student.name || student.full_name || '',
      usn: student.usn || '',
      email: student.email || '',
      countryCode: '+91',
      phone: tenDigits,
      semester: parseInt(student.semester, 10) || 1,
      section: (student.section || 'A').toUpperCase(),
      department: student.department || hodDepartmentName,
      unbind_device: false,
      password: '',
      showPassword: false,
      photo_base64: null,
      photo_preview: initialPhotoUrl,
      isWebcamActive: false,
      webcamError: null
    });
    setStudentEditError(null);
    setStudentEditSuccess(null);
  };

  const startEditWebcam = async () => {
    try {
      setEditStudentForm(prev => ({ ...prev, webcamError: null }));
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam streaming is not supported on this browser or connection.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' }
      });
      editStreamRef.current = stream;
      setEditStudentForm(prev => ({ ...prev, isWebcamActive: true }));
      setTimeout(() => {
        if (editVideoRef.current) {
          editVideoRef.current.srcObject = stream;
          editVideoRef.current.play().catch(e => console.error("Webcam play error", e));
        }
      }, 100);
    } catch (err) {
      setEditStudentForm(prev => ({
        ...prev,
        webcamError: err.message || 'Permission denied or webcam not accessible.'
      }));
    }
  };

  const stopEditWebcam = () => {
    if (editStreamRef.current) {
      editStreamRef.current.getTracks().forEach(t => t.stop());
      editStreamRef.current = null;
    }
    setEditStudentForm(prev => ({ ...prev, isWebcamActive: false }));
  };

  const captureEditWebcamPhoto = () => {
    if (!editVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = editVideoRef.current.videoWidth || 640;
    canvas.height = editVideoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(editVideoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.92);
    setEditStudentForm(prev => ({
      ...prev,
      photo_base64: b64,
      photo_preview: b64,
      isWebcamActive: false
    }));
    stopEditWebcam();
  };

  const handleEditPhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStudentEditError('Selected file must be an image (JPEG, PNG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      setEditStudentForm(prev => ({
        ...prev,
        photo_base64: b64,
        photo_preview: b64,
        isWebcamActive: false
      }));
      stopEditWebcam();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRevertPhoto = () => {
    stopEditWebcam();
    setEditStudentForm(prev => ({
      ...prev,
      photo_base64: null,
      photo_preview: `/api/students/${editStudentModal?.usn}/photo?t=${Date.now()}`,
      isWebcamActive: false
    }));
  };

  const handleSaveStudent = async (e) => {
    if (e) e.preventDefault();
    if (!editStudentModal) return;

    if (!editStudentForm.name.trim()) {
      setStudentEditError('Student full name is required.');
      return;
    }
    const emailToSave = editStudentForm.email.trim().toLowerCase();
    if (!emailToSave || !isValidEmail(emailToSave)) {
      setStudentEditError('Please enter a valid student email address matching standard format (e.g. name@rgit.ac.in or name@gmail.com).');
      return;
    }
    const phoneCheck = validatePhoneNumber(editStudentForm.phone, editStudentForm.countryCode || '+91');
    if (!phoneCheck.valid) {
      setStudentEditError(phoneCheck.error);
      return;
    }

    setSavingStudent(true);
    setStudentEditError(null);
    setStudentEditSuccess(null);

    try {
      const fullPhone = `${editStudentForm.countryCode || '+91'} ${phoneCheck.digits}`;
      const payload = {
        full_name: editStudentForm.name.trim(),
        email: emailToSave,
        phone: fullPhone,
        semester: parseInt(editStudentForm.semester, 10),
        section: editStudentForm.section.trim().toUpperCase(),
        department: editStudentForm.department.trim(),
        unbind_device: Boolean(editStudentForm.unbind_device)
      };

      if (editStudentForm.password && editStudentForm.password.trim()) {
        if (editStudentForm.password.trim().length < 4) {
          setStudentEditError('Password must contain at least 4 characters.');
          setSavingStudent(false);
          return;
        }
        payload.password = editStudentForm.password.trim();
      }

      if (editStudentForm.photo_base64) {
        payload.photo_base64 = editStudentForm.photo_base64;
      }

      const res = await api.updateStudent(editStudentModal.usn, payload);
      stopEditWebcam();
      setPhotoTimestamp(Date.now());
      const updatedPhotoUrl = `/api/students/${editStudentModal.usn}/photo?t=${Date.now()}`;
      
      // Update local state directly for seamless instant UI update
      setStudents(prev => prev.map(s => {
        if (s.usn === editStudentModal.usn) {
          return {
            ...s,
            name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            semester: payload.semester,
            section: payload.section,
            department: payload.department,
            bound_device: payload.unbind_device ? false : s.bound_device,
            device_uuid: payload.unbind_device ? null : s.device_uuid,
            photo_url: payload.photo_base64 ? updatedPhotoUrl : (s.photo_url || updatedPhotoUrl)
          };
        }
        return s;
      }));

      // If viewing the student records modal, update it as well
      if (selectedStudentForModal && selectedStudentForModal.usn === editStudentModal.usn) {
        setSelectedStudentForModal(prev => ({
          ...prev,
          name: payload.full_name,
          email: payload.email,
          phone: payload.phone,
          semester: payload.semester,
          section: payload.section,
          department: payload.department,
          bound_device: payload.unbind_device ? false : prev.bound_device,
          device_uuid: payload.unbind_device ? null : prev.device_uuid,
          photo_url: payload.photo_base64 ? updatedPhotoUrl : (prev.photo_url || updatedPhotoUrl)
        }));
      }

      setStudentEditSuccess(res.message || `Student ${editStudentModal.usn} updated successfully by HOD.`);
      setTimeout(() => {
        setEditStudentModal(null);
        setStudentEditSuccess(null);
      }, 1200);

      // Re-fetch all data in background to sync any stats
      loadData();
    } catch (err) {
      setStudentEditError(err.message || 'Failed to update student profile. Check HOD permissions.');
    } finally {
      setSavingStudent(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.event_type === logFilter;
  });

  // HOD Student Registration Approval Handlers
  const handleApproveStudent = async (req) => {
    setActionLoadingId(req.id);
    setApprovalFeedback(null);
    try {
      const res = await api.verifyStudentRegistration(req.id, 'APPROVE');
      setApprovalFeedback({
        type: 'success',
        text: res.message || `Student ${req.full_name} (${req.usn}) has been officially verified and enrolled by HOD!`
      });
      loadData();
    } catch (err) {
      setApprovalFeedback({
        type: 'error',
        text: `Approval Failed: ${err.message}`
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (req) => {
    setRejectModalData(req);
    setSelectedRejectPreset('blurry_photo');
    setRejectReason(REJECTION_PRESETS[0].text);
  };

  const handleSelectRejectPreset = (preset) => {
    setSelectedRejectPreset(preset.id);
    if (preset.id === 'custom') {
      const isPresetText = REJECTION_PRESETS.some(p => p.id !== 'custom' && p.text === rejectReason);
      if (isPresetText) {
        setRejectReason('');
      }
    } else {
      setRejectReason(preset.text);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalData) return;
    setActionLoadingId(rejectModalData.id);
    setApprovalFeedback(null);
    try {
      const res = await api.verifyStudentRegistration(rejectModalData.id, 'REJECT', rejectReason.trim());
      setApprovalFeedback({
        type: 'info',
        text: res.message || `Registration for ${rejectModalData.usn} was rejected.`
      });
      setRejectModalData(null);
      loadData();
    } catch (err) {
      setApprovalFeedback({
        type: 'error',
        text: `Rejection Failed: ${err.message}`
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBatchApprovePending = async () => {
    const targetDept = isMasterAdmin ? (adminDeptFilter === 'ALL' ? 'All Departments' : adminDeptFilter) : (currentUser?.department || 'your department');
    if (!window.confirm(`Are you sure you want to approve all pending verified student registrations for ${targetDept}?`)) {
      return;
    }
    setApprovalFeedback(null);
    try {
      const res = await api.batchApproveRegistrations(approvalSectionFilter !== 'ALL' ? approvalSectionFilter : null);
      setApprovalFeedback({
        type: 'success',
        text: `Batch Approved: ${res.message || `Successfully approved pending students for ${targetDept}!`}`
      });
      loadData();
    } catch (err) {
      setApprovalFeedback({
        type: 'error',
        text: `Batch Approval Failed: ${err.message}`
      });
    }
  };

  // Scoped registration applications for HOD
  const deptPendingCount = pendingRegs.filter(r => {
    if (!isMasterAdmin) {
      const rDeptCode = getDeptCode(r.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      if (hodCode !== 'ALL' && rDeptCode !== hodCode) return false;
    } else if (adminDeptFilter !== 'ALL') {
      const rDeptCode = getDeptCode(r.department || '');
      if (rDeptCode !== getDeptCode(adminDeptFilter)) return false;
    }
    return r.status === 'PENDING';
  }).length;

  const scopedPendingRegs = pendingRegs.filter(r => {
    // 1. Department authority filtering
    if (!isMasterAdmin) {
      const rDeptCode = getDeptCode(r.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      if (hodCode !== 'ALL' && rDeptCode !== hodCode) return false;
    } else if (adminDeptFilter !== 'ALL') {
      const rDeptCode = getDeptCode(r.department || '');
      if (rDeptCode !== getDeptCode(adminDeptFilter)) return false;
    }

    // 2. Semester filter (e.g. 1st semester, 7th semester, etc.)
    if (approvalSemesterFilter !== 'ALL' && r.semester !== parseInt(approvalSemesterFilter, 10)) {
      return false;
    }

    // 3. Section filter
    if (approvalSectionFilter !== 'ALL' && r.section !== approvalSectionFilter) {
      return false;
    }

    // 4. Status filter
    if (approvalStatusFilter !== 'ALL' && r.status !== approvalStatusFilter) {
      return false;
    }

    // 5. Search query
    if (approvalSearch.trim()) {
      const q = approvalSearch.toLowerCase();
      const matchName = (r.full_name || '').toLowerCase().includes(q);
      const matchUsn = (r.usn || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      if (!matchName && !matchUsn && !matchPhone && !matchEmail) return false;
    }

    return true;
  });

  // Dept-scoped student and faculty lists
  const filteredStudents = students.filter(s => {
    // HOD: strictly locked to their own department
    if (!isMasterAdmin) {
      const sDeptCode = getDeptCode(s.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      if (hodCode !== 'ALL' && sDeptCode !== hodCode) return false;
    } else if (adminDeptFilter !== 'ALL') {
      // Master admin: scope to selected department chip
      const sDeptCode = getDeptCode(s.department || '');
      if (sDeptCode !== getDeptCode(adminDeptFilter)) return false;
    }
    if (studentSectionFilter !== 'ALL' && s.section !== studentSectionFilter) return false;
    if (studentSemesterFilter !== 'ALL' && s.semester !== parseInt(studentSemesterFilter, 10)) return false;
    if (studentStatusFilter === 'DEFAULTER' && !s.is_defaulter) return false;
    if (studentStatusFilter === 'COMPLIANT' && s.is_defaulter) return false;
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase();
      if (!(s.usn || '').toLowerCase().includes(q) &&
          !(s.name || '').toLowerCase().includes(q) &&
          !(s.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredFaculty = faculty.filter(f => {
    // HOD: strictly locked to their own department
    if (!isMasterAdmin) {
      const fDeptCode = getDeptCode(f.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      if (hodCode !== 'ALL' && fDeptCode !== hodCode) return false;
    } else if (adminDeptFilter !== 'ALL') {
      const fDeptCode = getDeptCode(f.department || '');
      if (fDeptCode !== getDeptCode(adminDeptFilter)) return false;
    }
    if (facultySearch.trim()) {
      const q = facultySearch.toLowerCase();
      const matchName = (f.name || '').toLowerCase().includes(q);
      const matchCode = (f.faculty_code || '').toLowerCase().includes(q);
      const matchDesig = (f.designation || '').toLowerCase().includes(q);
      const matchSub = (f.assigned_subjects || []).some(sub => sub.toLowerCase().includes(q));
      if (!matchName && !matchCode && !matchDesig && !matchSub) return false;
    }
    return true;
  });

  // Scoped metrics computed from filtered arrays
  const scopedDeptLabel = isMasterAdmin
    ? (adminDeptFilter === 'ALL' ? 'All Departments' : adminDeptFilter)
    : (getDeptCode(currentUser?.department) || 'YOUR DEPT');
  const deptStudents = students.filter(s => {
    if (!isMasterAdmin) {
      const sDeptCode = getDeptCode(s.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      return hodCode === 'ALL' || sDeptCode === hodCode;
    }
    if (adminDeptFilter === 'ALL') return true;
    return getDeptCode(s.department || '') === getDeptCode(adminDeptFilter);
  });
  const deptFaculty = faculty.filter(f => {
    if (!isMasterAdmin) {
      const fDeptCode = getDeptCode(f.department || '');
      const hodCode = getDeptCode(currentUser?.department || '');
      return hodCode === 'ALL' || fDeptCode === hodCode;
    }
    if (adminDeptFilter === 'ALL') return true;
    return getDeptCode(f.department || '') === getDeptCode(adminDeptFilter);
  });
  const deptDefaulters = deptStudents.filter(s => s.is_defaulter);
  const deptFaceEnrolled = deptStudents.filter(s => s.face_registered);
  const deptLiveSessions = deptFaculty.filter(f => f.active_session);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner: RGIT Futuristic HUD Portal */}
      <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.09) 0%, rgba(59,130,246,0.06) 100%)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(99,102,241,0.25) 100%)', color: '#c084fc', padding: '0.55rem', borderRadius: 'var(--radius-sm)', flexShrink: 0, boxShadow: '0 0 16px rgba(168,85,247,0.35)' }}>
                <Building size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>
                    {isMasterAdmin ? 'RGIT Master System Administration' : `HOD Portal — ${getDeptCode(currentUser?.department) || 'DEPT'}`}
                  </h2>
                  <span className={isMasterAdmin ? "badge badge-warning" : "badge badge-success"} style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={11} /> {isMasterAdmin ? `MASTER ADMIN • Viewing: ${scopedDeptLabel}` : `HOD: ${getDeptCode(currentUser?.department) || 'DEPT'}`}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isMasterAdmin ? (
                    <>Master Admin: <strong style={{ color: '#fbbf24' }}>MOHD</strong> • <strong style={{ color: '#38bdf8' }}>All 9 B.E Departments</strong> • Viewing: <strong style={{ color: '#34d399' }}>{scopedDeptLabel}</strong></>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <span>HOD: <strong>{currentUser?.full_name}</strong> • Dept: <strong style={{ color: '#38bdf8' }}>{getDeptCode(currentUser?.department) || 'DEPT'}</strong> • <em style={{ color: '#94a3b8' }}>{currentUser?.department}</em></span>
                      <button
                        type="button"
                        onClick={() => handleOpenEditHODPassword(currentUser)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8'
                        }}
                        title="Edit my Mobile Number, Email ID, and Password"
                      >
                        <Phone size={10} /> Edit Contact & Profile
                      </button>
                    </div>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={exportOfficialMonthlyExcel} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #002D62 0%, #1e3a8a 50%, #2563eb 100%)', borderColor: '#3b82f6', gap: '5px' }} title="Download Official Monthly Attendance Sheet (.xlsx) with Google Calendar Government Holidays till date">
              <FileSpreadsheet size={13} /><span className="nav-tab-label">Official Excel (.xlsx)</span>
            </button>
            <button onClick={exportOfficialMonthlyCSV} className="btn btn-secondary btn-sm" style={{ background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399', gap: '5px' }} title="Download Official Attendance Sheet (CSV) with Google Calendar Government Holidays till date">
              <Download size={13} /><span className="nav-tab-label">Attendance CSV</span>
            </button>
            <button onClick={exportVTUReportCSV} className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderColor: '#10b981', gap: '5px' }}>
              <Download size={13} /><span className="nav-tab-label">Export VTU Report</span>
            </button>
            <button onClick={() => exportDayToDaySubjectCSV(null)} className="btn btn-secondary btn-sm" style={{ background: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa', gap: '5px' }} title="Export Day-to-Day Subject Attendance Register with exact Date, Time, and Student list">
              <Download size={13} /><span className="nav-tab-label">Day-to-Day Subject CSV</span>
            </button>
            <button onClick={loadData} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} /><span className="nav-tab-label">Refresh</span>
            </button>
          </div>
        </div>

        {/* Futuristic HUD Status Bar */}
        <div className="futuristic-hud-bar" style={{ marginTop: '1rem', fontSize: '0.7rem' }}>
          <span style={{ color: '#34d399', fontWeight: 700 }}>● QUANTUM: ONLINE</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>● AI BIOMETRICS: ACTIVE</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: '#a78bfa', fontWeight: 700 }}>● VAULT: SECURE</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>● GEOFENCE: ACTIVE</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: '#f472b6', fontWeight: 700 }}>● VTU COMPLIANCE: MONITORING</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
          </span>
        </div>

        {/* Theme Switcher Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '0.25rem' }}>🎨 THEME:</span>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => handleSwitchTheme(t.id)}
              className={`theme-pill-btn${activeThemeId === t.id ? ' active' : ''}`}
              style={{
                background: activeThemeId === t.id ? (t.vars['--glass-glow'] || 'rgba(139,92,246,0.25)') : 'rgba(255,255,255,0.04)',
                color: activeThemeId === t.id ? t.primary : 'var(--text-muted)',
                border: `1px solid ${activeThemeId === t.id ? t.primary : 'transparent'}`,
                boxShadow: activeThemeId === t.id ? `0 0 10px ${t.vars['--theme-glow'] || 'rgba(139,92,246,0.35)'}` : 'none'
              }}
            >
              {activeThemeId === t.id && '✦ '}
              {t.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Master Admin: Department Scope Chips */}
        {isMasterAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '0.25rem' }}>⚡ DEPT SCOPE:</span>
            {[{ code: 'ALL', label: '⊕ ALL' }, ...RGIT_BE_COURSES.map(c => ({ code: c.code, label: c.code }))].map(d => (
              <button
                key={d.code}
                onClick={() => handleSelectDept(d.code)}
                style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  background: adminDeptFilter === d.code ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.04)',
                  color: adminDeptFilter === d.code ? '#38bdf8' : 'var(--text-muted)',
                  boxShadow: adminDeptFilter === d.code ? '0 0 8px rgba(56,189,248,0.4)' : 'none',
                  border: adminDeptFilter === d.code ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >{d.label}</button>
            ))}
          </div>
        )}

        {/* HOD: Locked jurisdiction badge */}
        {!isMasterAdmin && (
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.85rem', borderRadius: '20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', fontSize: '0.75rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            <Lock size={13} />
            HOD JURISDICTION LOCKED: {getDeptCode(currentUser?.department) || 'DEPT'} — {currentUser?.department}
          </div>
        )}

        {/* High-Level Metric Cards — Dept-Scoped */}
        <div className="grid-4" style={{ marginTop: '1.25rem' }}>
          
          <div 
            className="glass-panel glass-panel-hover" 
            style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', cursor: 'pointer' }}
            onClick={() => { setActiveTab('students'); setStudentStatusFilter('ALL'); }}
          >
            <span style={{ fontSize: '0.75rem', color: '#93c5fd' }}>Registered Students</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.2rem' }}>
              {deptStudents.length}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Dept: <strong style={{ color: '#38bdf8' }}>{scopedDeptLabel}</strong></span>
          </div>

          <div 
            className="glass-panel glass-panel-hover" 
            style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', cursor: 'pointer' }}
            onClick={() => { setActiveTab('students'); setStudentStatusFilter('ALL'); }}
          >
            <span style={{ fontSize: '0.75rem', color: '#6ee7b7' }}>Biometric Faces Enrolled</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              {deptFaceEnrolled.length} / {deptStudents.length}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>128-d Vector Encodings</span>
          </div>

          <div 
            className="glass-panel glass-panel-hover" 
            style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.08)', cursor: 'pointer' }}
            onClick={() => { setActiveTab('faculty'); }}
          >
            <span style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>Live Classroom Sessions</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.2rem' }}>
              {deptLiveSessions.length} Live
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{deptFaculty.length} Total Faculty</span>
          </div>

          <div 
            className="glass-panel glass-panel-hover" 
            style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', cursor: 'pointer' }}
            onClick={() => { setActiveTab('students'); setStudentStatusFilter('DEFAULTER'); }}
          >
            <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>VTU Defaulters (&lt; 75%)</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '0.2rem' }}>
              {deptDefaulters.length}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Statutory Deficit — {scopedDeptLabel}</span>
          </div>

        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className="admin-tabs"
        style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}
      >
        {[
          { id: 'kpis', label: 'Overview', icon: Activity },
          { 
            id: 'approvals', 
            label: isMasterAdmin ? 'Student Approvals' : `${getDeptCode(currentUser?.department) || 'Dept'} Approvals`, 
            icon: UserCheck, 
            count: deptPendingCount,
            isAlert: deptPendingCount > 0
          },
          { id: 'students', label: 'Students', icon: Users, count: deptStudents.length },
          { id: 'faculty', label: 'Faculty', icon: UserCheck, count: deptFaculty.length },
          { id: 'timetable', label: 'Timetable', icon: Calendar },
          { id: 'geofence', label: 'Geofence', icon: MapPin },
          { id: 'audit', label: 'Audit', icon: Lock, count: auditLogs.length },
          ...(isMasterAdmin ? [{ id: 'hods', label: 'HOD Management', icon: Shield, count: departmentHods.length }] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn btn-sm"
              style={{
                background: isActive 
                  ? 'rgba(59, 130, 246, 0.25)' 
                  : tab.isAlert 
                  ? 'rgba(234, 179, 8, 0.12)' 
                  : 'transparent',
                color: isActive 
                  ? '#60a5fa' 
                  : tab.isAlert 
                  ? '#fef08a' 
                  : 'var(--text-secondary)',
                border: `1px solid ${
                  isActive 
                    ? 'rgba(59, 130, 246, 0.5)' 
                    : tab.isAlert 
                    ? 'rgba(234, 179, 8, 0.4)' 
                    : 'transparent'
                }`,
                flexShrink: 0,
                boxShadow: tab.isAlert && !isActive ? '0 0 10px rgba(234, 179, 8, 0.2)' : 'none'
              }}
            >
              <Icon size={14} />
              <span className="nav-tab-label">{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  fontSize: '0.7rem',
                  background: tab.isAlert ? '#eab308' : 'rgba(255, 255, 255, 0.1)',
                  color: tab.isAlert ? '#000000' : 'inherit',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview Analytics */}
      {activeTab === 'kpis' && (
        <>
          <div className="grid-2">
          
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Rajiv Gandhi Institute of Technology — System Integrity Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span>Hardware Device Binding (Anti-Proxy)</span>
                <span className="badge badge-success">Active & Enforcing</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span>GPS Geofence Perimeter Engine</span>
                <span className="badge badge-success">Calibrated to RGIT (250m)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span>Anti-Mock Location Guard</span>
                <span className="badge badge-success">Native Provider Interrogation</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)' }}>
                <span>Active AI Liveness Verification</span>
                <span className="badge badge-success">EAR Blink + MAR Smile Check</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={17} style={{ color: '#38bdf8' }} />
                  <span>Registered Academic Subjects</span>
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  {overviewSubjectDept === 'ALL' && adminDeptFilter === 'ALL' 
                    ? 'Catalogued curriculum across all 9 RGIT B.E departments' 
                    : `Curriculum for ${overviewSubjectDept !== 'ALL' ? overviewSubjectDept : scopedDeptLabel}`}
                </p>
              </div>

              {/* Filters Toolbar: Department + Semester */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                {/* Department Dropdown (Master Admin / All Departments) */}
                {isMasterAdmin && (
                  <select 
                    className="form-select" 
                    style={{ 
                      width: 'auto', 
                      padding: '0.3rem 1.6rem 0.3rem 0.6rem', 
                      fontSize: '0.75rem', 
                      height: 'auto',
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderColor: 'rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      fontWeight: 600
                    }}
                    value={overviewSubjectDept}
                    onChange={(e) => setOverviewSubjectDept(e.target.value)}
                  >
                    <option value="ALL">All Departments (9 Branches)</option>
                    {RGIT_BE_COURSES.map(c => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.name.replace('B.E in ', '')}
                      </option>
                    ))}
                  </select>
                )}

                {/* Semester Dropdown: 1 to 8 + All Semesters, DEFAULT SEM 1 */}
                <select 
                  className="form-select" 
                  style={{ 
                    width: 'auto', 
                    padding: '0.3rem 1.6rem 0.3rem 0.6rem', 
                    fontSize: '0.75rem', 
                    height: 'auto',
                    background: 'rgba(15, 23, 42, 0.8)',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                    color: '#c084fc',
                    fontWeight: 700
                  }}
                  value={overviewSubjectSem}
                  onChange={(e) => setOverviewSubjectSem(e.target.value)}
                >
                  <option value="ALL">All Semesters (1–8)</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={String(sem)}>Sem {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Search Bar within Subjects */}
            <div style={{ 
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(0,0,0,0.25)',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--glass-border)'
            }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search subject code (e.g. BEC101, BCS101) or name..."
                value={overviewSubjectSearch}
                onChange={(e) => setOverviewSubjectSearch(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.75rem',
                  width: '100%'
                }}
              />
              {overviewSubjectSearch && (
                <button 
                  onClick={() => setOverviewSubjectSearch('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Subjects List with Scroll */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              maxHeight: '340px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {(() => {
                const catalog = DEPARTMENT_SUBJECT_CATALOG_FRONTEND || {};
                
                // Determine target department keys
                let targetDeptKeys = [];
                if (overviewSubjectDept !== 'ALL') {
                  targetDeptKeys = [overviewSubjectDept];
                } else if (adminDeptFilter !== 'ALL') {
                  targetDeptKeys = [getDeptCode(adminDeptFilter)];
                } else if (!isMasterAdmin) {
                  targetDeptKeys = [getDeptCode(currentUser?.department) || 'ECE'];
                } else {
                  // All departments across RGIT
                  targetDeptKeys = Object.keys(catalog);
                }

                // Gather all matching subjects
                let subjects = [];
                targetDeptKeys.forEach(dKey => {
                  const list = catalog[dKey] || [];
                  list.forEach(item => {
                    subjects.push({ ...item, deptCode: dKey });
                  });
                });

                // Filter by semester if not 'ALL'
                if (overviewSubjectSem !== 'ALL') {
                  const targetSem = parseInt(overviewSubjectSem, 10);
                  subjects = subjects.filter(s => (s.semester || 1) === targetSem);
                }

                // Filter by search query
                if (overviewSubjectSearch.trim()) {
                  const q = overviewSubjectSearch.toLowerCase().trim();
                  subjects = subjects.filter(s => 
                    (s.code || '').toLowerCase().includes(q) ||
                    (s.name || '').toLowerCase().includes(q) ||
                    (s.deptCode || '').toLowerCase().includes(q)
                  );
                }

                if (subjects.length === 0) {
                  return (
                    <div style={{ 
                      color: 'var(--text-muted)', 
                      fontSize: '0.8rem', 
                      padding: '1.5rem', 
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      No subjects found matching {overviewSubjectSem !== 'ALL' ? `Semester ${overviewSubjectSem}` : 'the criteria'}. 
                      Try selecting another department or semester.
                    </div>
                  );
                }

                return subjects.map((c, idx) => (
                  <div 
                    key={`${c.deptCode}_${c.code}_${idx}`} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.6rem 0.75rem', 
                      background: 'rgba(255, 255, 255, 0.025)', 
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                          {c.code}
                        </strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>—</span>
                        <span style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500 }}>
                          {c.name}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>Semester {c.semester || 1}</span>
                        <span>•</span>
                        <span style={{ 
                          color: '#38bdf8', 
                          background: 'rgba(56, 189, 248, 0.12)', 
                          padding: '1px 6px', 
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.65rem'
                        }}>
                          {c.deptCode}
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                      Active
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>


        </div>

        {/* Separate Departmental Databases Architecture Deck */}
        <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '0.45rem', borderRadius: 'var(--radius-sm)' }}>
                <Building size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  Separate Departmental Databases Architecture (RGIT Multi-DB System)
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Isolated SQLite Database Files for Each of the 9 RGIT B.E Departments + Master Control DB
                </p>
              </div>
            </div>

            <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
              10 Databases Online
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {/* Master DB */}
            <div style={{
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <strong style={{ fontSize: '0.82rem', color: '#c084fc', fontFamily: 'var(--font-mono)' }}>attendance_system.db</strong>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>MASTER</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#f8fafc', fontWeight: 600 }}>Master Control & HOD DB</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Status: <strong style={{ color: '#34d399' }}>ONLINE 🟢</strong> • Size: {deptDbStatus ? `${deptDbStatus.databases?.[0]?.size_kb || 200} KB` : '200 KB'}
              </div>
            </div>

            {/* 9 Department DBs — Clickable for Master Admin */}
            {RGIT_BE_COURSES.map(c => {
              const codeMap = {
                'EE': 'attendance_EE.db',
                'CSE': 'attendance_CSE.db',
                'ECE': 'attendance_ECE.db',
                'BME': 'attendance_BME.db',
                'ME': 'attendance_ME.db',
                'CSE-AI': 'attendance_CSE_AI.db',
                'CSE-IoT/CS/BT': 'attendance_CSE_IOT_CS_BT.db',
                'ISE': 'attendance_ISE.db',
                'AI & ML': 'attendance_AIML.db'
              };
              const dbFileName = codeMap[c.code] || `attendance_${c.code}.db`;
              const isUserDepartment = !isMasterAdmin
                ? (getDeptCode(c.code) === getDeptCode(currentUser?.department))
                : (adminDeptFilter !== 'ALL' && c.code === adminDeptFilter);
              const isRestricted = !isMasterAdmin && !isUserDepartment;
              const isClickable = isMasterAdmin;

              return (
                <div
                  key={c.id}
                  onClick={() => isClickable && handleSelectDept(c.code)}
                  style={{
                    background: isUserDepartment
                      ? 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.18) 0%, rgba(15, 23, 42, 0.85) 100%)'
                      : 'rgba(15, 23, 42, 0.4)',
                    border: isUserDepartment
                      ? '2px solid #10b981'
                      : (adminDeptFilter !== 'ALL' && c.code === adminDeptFilter ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)'),
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isRestricted ? 0.55 : 1,
                    boxShadow: isUserDepartment ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.2s ease',
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <strong style={{ fontSize: '0.78rem', color: isUserDepartment ? '#34d399' : '#93c5fd', fontFamily: 'var(--font-mono)' }}>{dbFileName}</strong>
                    <span style={{
                      fontSize: '0.65rem',
                      background: isUserDepartment ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.15)',
                      color: isUserDepartment ? '#34d399' : '#60a5fa',
                      border: isUserDepartment ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
                      padding: '1px 6px', borderRadius: '4px', fontWeight: 700
                    }}>{c.code}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#f8fafc', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Status: <strong style={{ color: '#34d399' }}>ONLINE 🟢</strong></span>
                    {isUserDepartment ? (
                      <span className="badge badge-success" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>ACTIVE SCOPE</span>
                    ) : isRestricted ? (
                      <span style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 600 }}>🔒 HOD Locked</span>
                    ) : isClickable ? (
                      <span style={{ color: '#38bdf8', fontSize: '0.65rem' }}>Click to scope →</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}

      {/* Tab: Student Registration Approvals (Department HOD Verification Queue) */}
      {activeTab === 'approvals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Department HOD Authority Header Banner */}
          <div className="glass-panel" style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1.5px solid rgba(168, 85, 247, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
                boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4)'
              }}>
                <Building size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                    {isMasterAdmin ? 'RGIT Institutional Student Verification Queue' : `${getDeptCode(currentUser?.department) || 'Department'} Student Admission Verification Queue`}
                  </h3>
                  <span className="badge badge-purple" style={{
                    fontSize: '0.68rem',
                    background: 'rgba(168, 85, 247, 0.25)',
                    color: '#e9d5ff',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    fontWeight: 700
                  }}>
                    {isMasterAdmin ? 'MASTER ADMIN OVERVIEW' : `HOD AUTHORITY: ${getDeptCode(currentUser?.department)}`}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '780px', lineHeight: 1.4 }}>
                  {isMasterAdmin ? (
                    <>Master Administrator authority across all departments. Currently scoped to: <strong style={{ color: '#38bdf8' }}>{scopedDeptLabel}</strong></>
                  ) : (
                    <>As the <strong>Head of Department (HOD) for {currentUser?.department}</strong> ({currentUser?.full_name}), only you have the official authority to verify, accept, or reject student admission requests for this department. Approved students are enrolled into the official <strong>{DEPT_DB_FILE[getDeptCode(currentUser?.department)] || 'department database'}</strong> and granted facial attendance clearance.</>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleBatchApprovePending}
                disabled={deptPendingCount === 0}
                className="btn btn-primary btn-sm"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  borderColor: '#10b981',
                  fontWeight: 700,
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <CheckCircle size={15} />
                <span>Batch Approve All ({deptPendingCount} Pending)</span>
              </button>
              <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ gap: '5px' }}>
                <RefreshCw size={14} /> <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {approvalFeedback && (
            <div style={{
              padding: '0.85rem 1.1rem',
              borderRadius: 'var(--radius-sm)',
              background: approvalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : approvalFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${approvalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : approvalFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
              color: approvalFeedback.type === 'success' ? '#34d399' : approvalFeedback.type === 'error' ? '#fca5a5' : '#93c5fd',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div>{approvalFeedback.text}</div>
              <button
                onClick={() => setApprovalFeedback(null)}
                style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Metric Summary Cards */}
          <div className="grid-4">
            <div
              className="glass-panel glass-panel-hover"
              style={{
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                border: approvalStatusFilter === 'PENDING' ? '1.5px solid #eab308' : '1px solid var(--glass-border)',
                background: approvalStatusFilter === 'PENDING' ? 'rgba(234, 179, 8, 0.12)' : 'rgba(255, 255, 255, 0.02)'
              }}
              onClick={() => setApprovalStatusFilter('PENDING')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#fef08a', fontWeight: 600 }}>Awaiting HOD Decision</span>
                <Clock size={15} style={{ color: '#eab308' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#facc15', marginTop: '4px' }}>
                {deptPendingCount}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {scopedDeptLabel} • Pending Review
              </div>
            </div>

            <div
              className="glass-panel glass-panel-hover"
              style={{
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                border: approvalStatusFilter === 'APPROVED' ? '1.5px solid #10b981' : '1px solid var(--glass-border)',
                background: approvalStatusFilter === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)'
              }}
              onClick={() => setApprovalStatusFilter('APPROVED')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 600 }}>HOD Approved</span>
                <CheckCircle size={15} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                {pendingRegs.filter(r => (!isMasterAdmin ? getDeptCode(r.department) === getDeptCode(currentUser?.department) : (adminDeptFilter === 'ALL' || getDeptCode(r.department) === getDeptCode(adminDeptFilter))) && r.status === 'APPROVED').length}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Biometrics Activated in Database
              </div>
            </div>

            <div
              className="glass-panel glass-panel-hover"
              style={{
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                border: approvalStatusFilter === 'REJECTED' ? '1.5px solid #ef4444' : '1px solid var(--glass-border)',
                background: approvalStatusFilter === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.02)'
              }}
              onClick={() => setApprovalStatusFilter('REJECTED')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#fca5a5', fontWeight: 600 }}>Rejected by HOD</span>
                <XCircle size={15} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
                {pendingRegs.filter(r => (!isMasterAdmin ? getDeptCode(r.department) === getDeptCode(currentUser?.department) : (adminDeptFilter === 'ALL' || getDeptCode(r.department) === getDeptCode(adminDeptFilter))) && r.status === 'REJECTED').length}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Application Denied with Reason
              </div>
            </div>

            <div
              className="glass-panel glass-panel-hover"
              style={{
                padding: '0.9rem 1.1rem',
                cursor: 'pointer',
                border: approvalSemesterFilter === 1 ? '1.5px solid #38bdf8' : '1px solid var(--glass-border)',
                background: approvalSemesterFilter === 1 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.02)'
              }}
              onClick={() => setApprovalSemesterFilter(approvalSemesterFilter === 1 ? 'ALL' : 1)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#7dd3fc', fontWeight: 600 }}>1st Semester Applicants</span>
                <Sparkles size={15} style={{ color: '#38bdf8' }} />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
                {pendingRegs.filter(r => (!isMasterAdmin ? getDeptCode(r.department) === getDeptCode(currentUser?.department) : (adminDeptFilter === 'ALL' || getDeptCode(r.department) === getDeptCode(adminDeptFilter))) && r.semester === 1).length}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                New Batch 1st Year Enrollees
              </div>
            </div>
          </div>

          {/* Filter Bar with Semester Buttons */}
          <div className="glass-panel" style={{ padding: '1.1rem 1.25rem' }}>
            {/* Semester Selector Buttons (Sem 1 to 8) */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Layers size={14} style={{ color: '#38bdf8' }} /> Filter By Academic Semester:
                </span>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {approvalSemesterFilter === 'ALL' ? 'Showing All Semesters (1–8)' : `Filtered to Semester ${approvalSemesterFilter} Only`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setApprovalSemesterFilter('ALL')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: approvalSemesterFilter === 'ALL' ? '1.5px solid #38bdf8' : '1px solid var(--glass-border)',
                    background: approvalSemesterFilter === 'ALL' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                    color: approvalSemesterFilter === 'ALL' ? '#38bdf8' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: approvalSemesterFilter === 'ALL' ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  All Semesters
                </button>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sNum => {
                  const isSel = approvalSemesterFilter === sNum;
                  const countInSem = pendingRegs.filter(r => (!isMasterAdmin ? getDeptCode(r.department) === getDeptCode(currentUser?.department) : (adminDeptFilter === 'ALL' || getDeptCode(r.department) === getDeptCode(adminDeptFilter))) && r.semester === sNum).length;
                  return (
                    <button
                      key={sNum}
                      onClick={() => setApprovalSemesterFilter(sNum)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSel ? '1.5px solid #38bdf8' : '1px solid var(--glass-border)',
                        background: isSel ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSel ? '#38bdf8' : 'var(--text-muted)',
                        fontSize: '0.78rem',
                        fontWeight: isSel ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>Sem {sNum}</span>
                      {countInSem > 0 && (
                        <span style={{
                          fontSize: '0.65rem',
                          background: isSel ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)',
                          color: isSel ? '#000' : 'inherit',
                          padding: '0 5px',
                          borderRadius: '8px',
                          fontWeight: 800
                        }}>
                          {countInSem}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status, Section, and Search Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px', background: 'rgba(0, 0, 0, 0.3)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <Search size={15} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by student name, USN, phone, or email..."
                  value={approvalSearch}
                  onChange={(e) => setApprovalSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '0.8rem', width: '100%' }}
                />
                {approvalSearch && (
                  <button onClick={() => setApprovalSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Status Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Status:</span>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
                  <button
                    key={st}
                    onClick={() => setApprovalStatusFilter(st)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: approvalStatusFilter === st 
                        ? (st === 'PENDING' ? '#eab308' : st === 'APPROVED' ? '#10b981' : st === 'REJECTED' ? '#ef4444' : 'var(--primary-color)') 
                        : 'rgba(255, 255, 255, 0.05)',
                      color: approvalStatusFilter === st 
                        ? (st === 'PENDING' ? '#000' : '#fff') 
                        : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Section Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Section:</span>
                {['ALL', 'A', 'B'].map(sec => (
                  <button
                    key={sec}
                    onClick={() => setApprovalSectionFilter(sec)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: approvalSectionFilter === sec ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.05)',
                      color: approvalSectionFilter === sec ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sec === 'ALL' ? 'All' : sec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applications List */}
          {scopedPendingRegs.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <CheckCircle size={32} />
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.4rem' }}>
                No Student Applications Found
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                There are currently no registration applications matching the selected criteria for <strong>{scopedDeptLabel}</strong> {approvalSemesterFilter !== 'ALL' ? `(Semester ${approvalSemesterFilter})` : ''}.
                When new students register on the Student Login page, they will appear here for your review and approval.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1rem' }}>
              {scopedPendingRegs.map(req => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';
                const isLoadingAction = actionLoadingId === req.id;

                return (
                  <div
                    key={req.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: isPending ? '1.5px solid rgba(234, 179, 8, 0.45)' : isApproved ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                      background: 'rgba(15, 23, 42, 0.75)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.9rem',
                      boxShadow: isPending ? '0 4px 18px rgba(234, 179, 8, 0.12)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Passport Photo + USN/Name + Status Badge */}
                    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => req.photo_url && setPreviewPhotoModal(req)}
                        style={{
                          width: '68px',
                          height: '78px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid rgba(255, 255, 255, 0.15)',
                          flexShrink: 0,
                          cursor: req.photo_url ? 'pointer' : 'default',
                          position: 'relative',
                          background: '#0a0f1d'
                        }}
                        title="Click to view full photo"
                      >
                        {req.photo_url ? (
                          <img
                            src={req.photo_url}
                            alt={req.full_name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <User size={24} />
                          </div>
                        )}
                        {req.photo_url && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(0,0,0,0.65)',
                            fontSize: '0.55rem',
                            color: '#fff',
                            textAlign: 'center',
                            padding: '1px 0'
                          }}>
                            ZOOM 🔍
                          </div>
                        )}
                      </div>

                      {/* Student Identity */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            color: '#f8fafc',
                            letterSpacing: '0.04em'
                          }}>
                            {req.usn}
                          </span>
                          <span className={`badge ${
                            isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {req.status}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#93c5fd', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.full_name}
                        </div>

                        {/* Academic badges */}
                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.66rem', background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {getDeptCode(req.department)}
                          </span>
                          <span style={{ fontSize: '0.66rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Semester {req.semester || 1}
                          </span>
                          <span style={{ fontSize: '0.66rem', background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Section {req.section || 'A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Biometrics Info */}
                    <div style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} style={{ color: '#34d399' }} /> {req.phone || 'No phone'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} style={{ color: '#60a5fa' }} /> {req.email || 'No email'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', color: 'var(--text-muted)' }}>
                        <span>Submitted: {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                        <span style={{ color: req.face_detected ? '#34d399' : '#f59e0b', fontWeight: 600 }}>
                          {req.face_detected ? '✓ 128-d Face Encodable' : '⚠️ No Face'}
                        </span>
                      </div>
                    </div>

                    {/* Status Decision Footer / Action Buttons */}
                    {isPending ? (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          onClick={() => handleApproveStudent(req)}
                          disabled={isLoadingAction}
                          className="btn btn-primary btn-sm"
                          style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                            borderColor: '#10b981',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {isLoadingAction ? <RefreshCw size={13} className="spin" /> : <CheckCircle size={14} />}
                          <span>Accept / Approve</span>
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(req)}
                          disabled={isLoadingAction}
                          className="btn btn-secondary btn-sm"
                          style={{
                            borderColor: 'rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        fontSize: '0.72rem',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        background: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${isApproved ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        color: isApproved ? '#34d399' : '#fca5a5'
                      }}>
                        {isApproved ? (
                          <div>
                            <strong>✓ Approved by:</strong> {req.verified_by || 'Department HOD'}
                            {req.verified_at && <span style={{ marginLeft: '4px', color: 'var(--text-muted)' }}>({new Date(req.verified_at).toLocaleDateString('en-IN')})</span>}
                          </div>
                        ) : (
                          <div>
                            <strong>✕ Rejected by:</strong> {req.verified_by || 'Department HOD'}
                            <div style={{ color: '#fca5a5', marginTop: '2px' }}>Reason: {req.rejection_reason || 'Details mismatch'}</div>
                            <button
                              onClick={() => handleApproveStudent(req)}
                              style={{
                                marginTop: '4px',
                                background: 'transparent',
                                border: 'none',
                                color: '#60a5fa',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                              }}
                            >
                              Re-evaluate & Approve Student →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Tab: All Students Directory */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Quick Metrics Bar — Dept-Scoped */}
          <div className="grid-4">
            <div 
              className="glass-panel glass-panel-hover" 
              style={{ padding: '0.9rem 1.1rem', cursor: 'pointer' }}
              onClick={() => setStudentStatusFilter('ALL')}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Enrolled [{scopedDeptLabel}]</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                {deptStudents.length} Students
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Sec A: {deptStudents.filter(s => s.section === 'A').length} | Sec B: {deptStudents.filter(s => s.section === 'B').length}
              </div>
            </div>

            <div 
              className="glass-panel glass-panel-hover" 
              style={{ padding: '0.9rem 1.1rem', cursor: 'pointer' }}
              onClick={() => setStudentStatusFilter('ALL')}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biometric Face Enrolled</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                {deptFaceEnrolled.length} / {deptStudents.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>
                {deptStudents.length > 0 ? Math.round((deptFaceEnrolled.length / deptStudents.length) * 100) : 0}% Registered
              </div>
            </div>

            <div 
              className="glass-panel glass-panel-hover" 
              style={{ padding: '0.9rem 1.1rem', cursor: 'pointer' }}
              onClick={() => setStudentStatusFilter('ALL')}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Device Hardware Bound</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {deptStudents.filter(s => s.bound_device).length} / {deptStudents.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#60a5fa' }}>
                Anti-Buddy Proxy Enforced
              </div>
            </div>

            <div 
              className="glass-panel glass-panel-hover" 
              style={{ padding: '0.9rem 1.1rem', cursor: 'pointer' }}
              onClick={() => setStudentStatusFilter('DEFAULTER')}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>VTU Defaulters (&lt; 75%)</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: students.filter(s => s.is_defaulter).length > 0 ? '#ef4444' : '#34d399', marginTop: '2px' }}>
                {students.filter(s => s.is_defaulter).length} Students
              </div>
              <div style={{ fontSize: '0.7rem', color: students.filter(s => s.is_defaulter).length > 0 ? '#f87171' : '#34d399' }}>
                {students.filter(s => s.is_defaulter).length > 0 ? '⚠️ Notice Issuance Required' : '✓ 100% University Compliant'}
              </div>
            </div>
          </div>

          {/* Student Admission Verification Queue Alert for HOD / Admin */}
          {deptPendingCount > 0 && (
            <div style={{
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '1px solid rgba(234, 179, 8, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: '#eab308',
                  color: '#000',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <UserCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: '#fef08a' }}>
                    {deptPendingCount} Student Admission Applications Awaiting {isMasterAdmin ? 'Admin / HOD' : `${getDeptCode(currentUser?.department) || 'Department'} HOD`} Verification
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Applicants submitted verified biometric photos and are pending official approval
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    borderColor: 'rgba(168, 85, 247, 0.5)',
                    color: '#c084fc',
                    fontWeight: 700
                  }}
                >
                  <Eye size={14} /> Review in Approvals Tab
                </button>
                <button
                  onClick={handleBatchApprovePending}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <CheckCircle size={14} /> Batch Approve All Pending
                </button>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px', background: 'rgba(0, 0, 0, 0.3)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by student name, USN (e.g. 1RG21CS001), or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '0.825rem', width: '100%' }}
                />
                {studentSearch && (
                  <button onClick={() => setStudentSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Section Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Section:</span>
                <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                  {['ALL', 'A', 'B'].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setStudentSectionFilter(sec)}
                      style={{
                        background: studentSectionFilter === sec ? 'var(--primary-color)' : 'transparent',
                        color: studentSectionFilter === sec ? 'white' : 'var(--text-muted)',
                        border: 'none',
                        padding: '0.3rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {sec === 'ALL' ? 'All Sections' : `Sec ${sec}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semester-Wise Database Filter (Select Sem 1 to 8 only - NO Add Semester) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Semester:</span>
                <select
                  value={studentSemesterFilter}
                  onChange={(e) => setStudentSemesterFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                >
                  <option value="ALL">All Semesters (1–8)</option>
                  <option value="1">Sem 1</option>
                  <option value="2">Sem 2</option>
                  <option value="3">Sem 3</option>
                  <option value="4">Sem 4</option>
                  <option value="5">Sem 5</option>
                  <option value="6">Sem 6</option>
                  <option value="7">Sem 7</option>
                  <option value="8">Sem 8</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>VTU Status:</span>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => setStudentStatusFilter(e.target.value)}
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="DEFAULTER">Defaulters (&lt;75%)</option>
                  <option value="COMPLIANT">Compliant (≥75%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Students Directory Glass Table */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} style={{ color: '#38bdf8' }} /> Student Identity & Biometric Database
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Complete VTU records, attendance ratios, and device-binding security tokens
                </p>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                Showing {filteredStudents.length} of {students.length} students
              </span>
            </div>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Student Name & USN</th>
                    <th>Academic Section</th>
                    <th>Contact Details</th>
                    <th>Face Biometrics</th>
                    <th>Device Guard</th>
                    <th>Attendance %</th>
                    <th>VTU Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.78rem'
                            }}>
                              {s.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <strong style={{ color: '#f8fafc' }}>{s.name}</strong>
                              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                                {s.usn}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>Section {s.section}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Sem {s.semester} • {s.department}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.phone}</div>
                        </td>
                        <td>
                          {s.face_registered ? (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              <CheckCircle size={11} /> 128-d Enrolled
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                              Pending Setup
                            </span>
                          )}
                        </td>
                        <td>
                          {s.bound_device ? (
                            <div>
                              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                <Shield size={11} /> Bound Device
                              </span>
                              {s.device_uuid && (
                                <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  {s.device_uuid.substring(0, 14)}...
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                              Unbound
                            </span>
                          )}
                        </td>
                        <td style={{ minWidth: '140px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                            <span style={{ fontWeight: 700, color: s.is_defaulter ? '#f87171' : (s.attendance_percentage >= 85 ? '#34d399' : '#fbbf24') }}>
                              {s.attendance_percentage}%
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              {s.attended_classes}/{s.total_classes}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, s.attendance_percentage)}%`,
                              height: '100%',
                              background: s.is_defaulter ? '#ef4444' : (s.attendance_percentage >= 85 ? '#10b981' : '#f59e0b'),
                              borderRadius: '3px'
                            }} />
                          </div>
                        </td>
                        <td>
                          {s.is_defaulter ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>
                              <AlertTriangle size={11} /> Defaulter (&lt;75%)
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              <Award size={11} /> Eligible (≥75%)
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => setSelectedStudentForModal(s)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="View student's attendance records"
                            >
                              <Eye size={13} /> Records
                            </button>
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.6rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                color: '#38bdf8'
                              }}
                              title="Edit student mobile, email, section & semester (HOD Authority)"
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s)}
                              disabled={actionLoadingId === (s.id || s.usn)}
                              className="btn btn-danger btn-sm"
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.55rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#f87171'
                              }}
                              title={`Delete ${s.name} (${s.usn})`}
                            >
                              {actionLoadingId === (s.id || s.usn) ? (
                                <RefreshCw size={12} className="spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No students found matching current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab: Faculty & Teachers Directory */}
      {activeTab === 'faculty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Faculty Overview Metrics — Dept-Scoped */}
          <div className="grid-4">
            <div className="glass-panel" style={{ padding: '0.9rem 1.1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Faculty [{scopedDeptLabel}]</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                {deptFaculty.length} Instructors
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {scopedDeptLabel} Department
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 1.1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Live Classroom Sessions</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: deptLiveSessions.length > 0 ? '#34d399' : '#94a3b8', marginTop: '2px' }}>
                {deptLiveSessions.length} Live
              </div>
              <div style={{ fontSize: '0.7rem', color: deptLiveSessions.length > 0 ? '#10b981' : 'var(--text-muted)' }}>
                {deptLiveSessions.length > 0 ? 'Receiving Biometric Check-ins' : 'No Live Lectures Currently'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 1.1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Current Dept Scope</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px', wordBreak: 'break-word' }}>
                {scopedDeptLabel}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                VTU 2021 Scheme
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '0.9rem 1.1rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sessions Conducted</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                {deptFaculty.reduce((acc, f) => acc + (f.total_sessions || 0), 0)} Sessions
              </div>
              <div style={{ fontSize: '0.7rem', color: '#60a5fa' }}>
                Logged in Institutional Vault
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search instructors by name, faculty code (e.g. FAC_CSE_01), designation, or subject..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '0.825rem', width: '100%' }}
              />
              {facultySearch && (
                <button onClick={() => setFacultySearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Faculty Cards / Table */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={18} style={{ color: '#60a5fa' }} /> RGIT Faculty & Instructor Registry
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Instructor credentials, assigned curriculum, and real-time launched classroom session PINs
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                  {filteredFaculty.length} Instructors Listed
                </span>
                <button
                  onClick={() => {
                    setNewFacultyModal(true);
                    setFacultyFormError(null);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <UserPlus size={15} /> Add New Teacher
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      background: f.active_session ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)' : 'rgba(255, 255, 255, 0.02)',
                      border: f.active_session ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 800,
                          fontSize: '1rem',
                          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                        }}>
                          {f.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').substring(0, 2) || 'FA'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>{f.name}</h4>
                            <span className="badge badge-info" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                              {f.faculty_code}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({f.username})</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            <strong>{f.designation}</strong> • {f.department}
                          </div>
                        </div>
                      </div>

                      {/* Live Session Status & PIN (Visible to Admin!) */}
                      {f.active_session ? (
                        <div style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.5rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>
                              <span className="pulse-dot pulse-dot-green"></span> ACTIVE LECTURE WINDOW
                            </div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                              {f.active_session.subject_name} ({f.active_session.subject_code})
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Section {f.active_session.section} • Period {f.active_session.period_number}
                            </div>
                          </div>
                          <div style={{ borderLeft: '1px solid rgba(16, 185, 129, 0.3)', paddingLeft: '0.85rem', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PIN</span>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '2px' }}>
                              {f.active_session.session_code}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                            <Clock size={11} /> Lecture Window Idle
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details row: Contact & Courses */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '0.78rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                          <KeyRound size={12} style={{ color: '#60a5fa' }} />
                          <span>Login Name: <strong style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)' }}>{f.username}</strong></span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={13} style={{ color: '#60a5fa' }} /> {f.email}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} style={{ color: '#34d399' }} /> {f.phone}
                        </span>
                        <span>
                          Sessions Conducted: <strong style={{ color: '#f8fafc' }}>{f.total_sessions}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Assigned Subjects:</span>
                        {f.assigned_subjects && f.assigned_subjects.map((sub, idx) => (
                          <span key={idx} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                            {sub}
                          </span>
                        ))}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '0.4rem' }}>
                          <button
                            onClick={() => {
                              // Auto-generate username from instructor name
                              // e.g. "Prof. Rajesh Kulkarni" → "rajesh.kulkarni"
                              const nameParts = (f.name || '')
                                .replace(/^(prof\.?|dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '')
                                .trim()
                                .toLowerCase()
                                .split(/\s+/);
                              const suggestedUsername = nameParts.length >= 2
                                ? `${nameParts[0]}.${nameParts[nameParts.length - 1]}`
                                : nameParts[0] || f.username;
                              setEditFacultyCredentialsModal(f);
                              setEditCredentialsData({
                                facultyId: f.id,
                                facultyName: f.name,
                                username: suggestedUsername,
                                newPassword: ''
                              });
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Set or reset login username and password for this teacher"
                          >
                            <KeyRound size={11} /> Set Password
                          </button>
                          <button
                            onClick={() => {
                              const rawDigits = cleanPhoneDigits(f.phone || '');
                              const clean10 = rawDigits.startsWith('91') && rawDigits.length === 12 ? rawDigits.slice(2) : (rawDigits.length > 10 ? rawDigits.slice(-10) : rawDigits);
                              setEditFacultyProfileModal(f);
                              setEditProfileData({
                                facultyId: f.id,
                                full_name: f.name || '',
                                email: (f.email || '').trim().toLowerCase(),
                                phone: clean10,
                                designation: f.designation || 'Assistant Professor'
                              });
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Edit teacher profile details"
                          >
                            <User size={11} /> Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              setEditFacultySubjectsModal(f);
                              const existingCodes = f.assigned_subject_codes
                                ? f.assigned_subject_codes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
                                : f.assigned_subjects.map(s => s.split(' ')[0].trim().toUpperCase());
                              setEditSubjectCodes(existingCodes);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Edit subjects assigned to this teacher"
                          >
                            <Edit3 size={11} /> Edit Subjects
                          </button>
                          <button
                            onClick={() => handleDeleteFaculty(f.id, f.name)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '3px' }}
                            title="Remove teacher from institution"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No faculty members matching current search.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Geofence & Location Studio */}
      {activeTab === 'geofence' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Campus Geofence Studio & Geodesic Perimeter Control
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Center Coordinates: Lat 13.033090, Lon 77.597786 (Rajiv Gandhi Institute of Technology, Bangalore)
              </p>
            </div>
          </div>

          {geofenceMsg && (
            <div style={{
              padding: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem',
              background: geofenceMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${geofenceMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              fontSize: '0.85rem'
            }}>
              {geofenceMsg.text}
            </div>
          )}

          <div className="grid-2" style={{ alignItems: 'center' }}>
            
            {/* Visual Geofence Map / Radar Simulator */}
            <div style={{
              height: '260px',
              background: 'radial-gradient(circle at center, #0f1c38 0%, #060a14 70%)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Radar sweep */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(59, 130, 246, 0.25) 360deg)',
                borderRadius: '50%',
                animation: 'radarSweep 5s linear infinite'
              }} />

              {/* Dynamic boundary ring reflecting radiusInput */}
              <div style={{
                position: 'absolute',
                width: `${Math.min(220, Math.max(80, (radiusInput / 500) * 220))}px`,
                height: `${Math.min(220, Math.max(80, (radiusInput / 500) * 220))}px`,
                border: '2px solid rgba(16, 185, 129, 0.7)',
                borderRadius: '50%',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.3s ease'
              }} />

              {/* Campus Center Pin */}
              <div style={{
                position: 'absolute',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{ background: 'var(--primary-gradient)', padding: '6px', borderRadius: '50%', boxShadow: '0 0 15px #3b82f6' }}>
                  <MapPin size={20} color="white" />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', marginTop: '4px' }}>
                  RGIT CAMPUS CENTER
                </span>
                <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 600 }}>
                  Perimeter: {radiusInput}m
                </span>
              </div>
            </div>

            {/* Slider & Enforce Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Campus Geofence Radius (Meters)</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
                    {radiusInput} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="25"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>100m (Strict Block)</span>
                  <span>250m (Standard Campus)</span>
                  <span>500m (Extended Grounds)</span>
                </div>
              </div>

              <div style={{
                padding: '0.85rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Strict Geofence Enforcement</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Reject any attendance submission outside campus perimeter
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enforceGeofence}
                  onChange={(e) => setEnforceGeofence(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--success)', cursor: 'pointer' }}
                />
              </div>

              <button
                onClick={handleUpdateGeofence}
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <Sliders size={16} />
                <span>{loading ? 'Saving to Database...' : 'Save Geofence Settings'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: Security & Audit Vault */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={18} style={{ color: '#ef4444' }} /> Tamper-Proof Security & Audit Log Vault
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Immutable event stream for mock GPS alerts, perimeter breaches, and authentication security
              </p>
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Filter Event:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
              >
                <option value="ALL">All Security Events</option>
                <option value="GEOFENCE_BREACH_ATTEMPT">Geofence Breach Attempts</option>
                <option value="MOCK_GPS_DETECTED">Mock GPS Alerts</option>
                <option value="FACE_VERIFICATION_FAILED">Biometric Mismatches</option>
                <option value="UNAUTHORIZED_DEVICE_ATTENDANCE">Device Mismatches</option>
                <option value="ATTENDANCE_SUCCESS">Attendance Success</option>
                <option value="MANUAL_OVERRIDE">Manual Overrides</option>
                <option value="FAILED_LOGIN">Failed Logins</option>
              </select>
            </div>
          </div>

          <div className="glass-table-container">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Event Type</th>
                  <th>User / Role</th>
                  <th>Timestamp</th>
                  <th>Client IP / GPS</th>
                  <th>Audit Log Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isDanger = log.event_type.includes('FAIL') || log.event_type.includes('BREACH') || log.event_type.includes('MOCK');
                    return (
                      <tr key={log.id}>
                        <td>
                          <span className={`badge ${isDanger ? 'badge-danger' : 'badge-info'}`}>
                            {log.event_type}
                          </span>
                        </td>
                        <td>
                          <strong>{log.username}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.role}</div>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {log.timestamp}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{log.client_ip}</div>
                          {log.latitude && log.longitude && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-main)', maxWidth: '400px' }}>
                          {log.details}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No audit events matching current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* Tab: HOD Timetable Manager (HOD + Master Admin)      */}
      {/* ==================================================== */}
      {activeTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(59,130,246,0.08) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 15px rgba(124,58,237,0.4)' }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>Departmental Timetable Manager</h3>
                  <p style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: '2px' }}>
                    {isMasterAdmin ? 'Master Admin — All Departments Access' : `HOD ${currentUser?.full_name || ''} — ${hodDepartmentName}`}
                    {' '}• Each department & semester has its own independent timetable
                  </p>
                </div>
              </div>
              <button onClick={loadTimetableMatrix} className="btn btn-secondary btn-sm" style={{ gap: '5px' }}>
                <RefreshCw size={13} /><span>Refresh</span>
              </button>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
              {/* Department selector - only for master admin */}
              {isMasterAdmin && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Department:</span>
                  <select
                    className="form-select"
                    value={timetableDept || 'CSE'}
                    onChange={(e) => setTimetableDept(e.target.value)}
                    style={{ width: 'auto', padding: '0.3rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(139,92,246,0.4)' }}
                  >
                    {RGIT_BE_COURSES.map(c => (
                      <option key={c.id} value={c.code}>{c.code} — {c.name.replace('B.E in ', '')}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Semester */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Semester:</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <button key={sem} onClick={() => setTimetableSemester(sem)} style={{
                      background: timetableSemester === sem ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'transparent',
                      color: timetableSemester === sem ? 'white' : 'var(--text-muted)',
                      border: 'none', padding: '0.25rem 0.55rem',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}>{sem}</button>
                  ))}
                </div>
              </div>

              {/* Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Section:</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                  {['A','B'].map(sec => (
                    <button key={sec} onClick={() => setTimetableSection(sec)} style={{
                      background: timetableSection === sec ? 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' : 'transparent',
                      color: timetableSection === sec ? 'white' : 'var(--text-muted)',
                      border: 'none', padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}>Sec {sec}</button>
                  ))}
                </div>
              </div>

              {/* Day of Week */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Day:</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '2px', flexWrap: 'wrap' }}>
                  {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(day => (
                    <button key={day} onClick={() => setTimetableDay(day)} style={{
                      background: timetableDay === day ? 'linear-gradient(135deg, #0891b2 0%, #3b82f6 100%)' : 'transparent',
                      color: timetableDay === day ? 'white' : 'var(--text-muted)',
                      border: 'none', padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                    }}>{day.substring(0,3)}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Timetable Info Banner */}
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#93c5fd' }}>
            <Layers size={14} />
            <span>
              <strong>Independent Timetable:</strong> Each department-semester combination has its own unique timetable.
              {isMasterAdmin ? ' As Master Admin, you can edit any department.' : ` As HOD of ${hodDepartmentName}, you can only edit your department's timetable.`}
            </span>
          </div>

          {timetableMsg && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              background: timetableMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${timetableMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem'
            }}>
              {timetableMsg.type === 'success' ? <CheckCircle size={15} style={{ color: '#34d399' }} /> : <AlertTriangle size={15} style={{ color: '#f87171' }} />}
              {timetableMsg.text}
            </div>
          )}

          {/* Timetable Grid */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={18} style={{ color: '#a78bfa' }} />
                {(timetableDept || (isMasterAdmin ? 'CSE' : 'YOUR DEPT'))} — Semester {timetableSemester} — Section {timetableSection} — {timetableDay}
              </h3>
              <span className="badge" style={{ background: 'rgba(139,92,246,0.2)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.4)', fontSize: '0.7rem' }}>
                {timetableMatrix.filter(s => s.is_custom).length}/{timetableMatrix.length} Custom Slots
              </span>
            </div>

            {timetableLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: '0.5rem' }} />
                <div>Loading timetable...</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {timetableMatrix.map(slot => (
                  <div key={slot.period_number} style={{
                    borderRadius: 'var(--radius-md)',
                    border: editingSlot?.period_number === slot.period_number
                      ? '2px solid rgba(139,92,246,0.7)'
                      : slot.is_custom ? '1.5px solid rgba(16,185,129,0.4)' : '1px solid var(--glass-border)',
                    background: editingSlot?.period_number === slot.period_number
                      ? 'rgba(139,92,246,0.1)'
                      : slot.is_custom ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                    padding: '0.85rem 1rem',
                    transition: 'all 0.2s ease'
                  }}>
                    {editingSlot?.period_number === slot.period_number ? (
                      /* Edit Mode — Full Authority HOD */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.2)', color: '#c084fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>PERIOD {slot.period_number}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{slot.time_str}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600 }}>✏️ HOD AUTHORITY — Editing Slot</span>
                        </div>

                        {/* Subject Mode Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(139,92,246,0.07)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,92,246,0.2)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject Mode:</span>
                          <button
                            onClick={() => setUseCustomSubject(false)}
                            style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                              background: !useCustomSubject ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)',
                              color: !useCustomSubject ? '#e9d5ff' : 'var(--text-muted)' }}
                          >📋 From Catalog</button>
                          <button
                            onClick={() => setUseCustomSubject(true)}
                            style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                              background: useCustomSubject ? 'rgba(6,182,212,0.35)' : 'rgba(255,255,255,0.05)',
                              color: useCustomSubject ? '#67e8f9' : 'var(--text-muted)' }}
                          >✏️ Custom Subject</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {!useCustomSubject ? (
                            <>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Subject Code * (from Department Catalog)</label>
                                <select
                                  className="form-select"
                                  value={editSlotData.subject_code}
                                  onChange={(e) => {
                                    const sel = timetableAvailableSubjects.find(s => s.code === e.target.value);
                                    setEditSlotData(prev => ({
                                      ...prev,
                                      subject_code: e.target.value,
                                      subject_name: sel ? sel.name : prev.subject_name
                                    }));
                                  }}
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(139,92,246,0.4)' }}
                                >
                                  <option value="">— Select Subject from Catalog —</option>
                                  {timetableAvailableSubjects.map(s => (
                                    <option key={s.code} value={s.code}>{s.code} — {s.name} (Sem {s.semester || '?'})</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Subject Name (auto-filled)</label>
                                <input type="text" className="form-input"
                                  value={editSlotData.subject_name}
                                  onChange={(e) => setEditSlotData(prev => ({ ...prev, subject_name: e.target.value }))}
                                  placeholder="Subject name"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: '#67e8f9', marginBottom: '0.25rem', display: 'block' }}>Custom Subject Code *</label>
                                <input type="text" className="form-input"
                                  value={customSubjectCode}
                                  onChange={(e) => setCustomSubjectCode(e.target.value.toUpperCase())}
                                  placeholder="e.g. BCS701, ECE501"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(6,182,212,0.5)' }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', color: '#67e8f9', marginBottom: '0.25rem', display: 'block' }}>Custom Subject Name *</label>
                                <input type="text" className="form-input"
                                  value={customSubjectName}
                                  onChange={(e) => setCustomSubjectName(e.target.value)}
                                  placeholder="e.g. Cloud Computing & Virtualization"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: 'rgba(6,182,212,0.5)' }}
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Assigned Faculty / Instructor</label>
                            <input type="text" className="form-input"
                              value={editSlotData.faculty_name}
                              onChange={(e) => setEditSlotData(prev => ({ ...prev, faculty_name: e.target.value }))}
                              placeholder="e.g. Dr. Arudra A"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Room / Lab No.</label>
                            <input type="text" className="form-input"
                              value={editSlotData.room}
                              onChange={(e) => setEditSlotData(prev => ({ ...prev, room: e.target.value }))}
                              placeholder="e.g. LH-301, CS-LAB-2"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                            />
                          </div>
                        </div>

                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.72rem', color: '#93c5fd' }}>
                          ⚡ <strong>HOD Authority:</strong> Setting timetable for <strong>{resolveTimetableDept()}</strong> — Semester <strong>{timetableSemester}</strong> — Section <strong>{timetableSection}</strong> — <strong>{timetableDay}</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingSlot(null); setUseCustomSubject(false); }} className="btn btn-secondary btn-sm">Cancel</button>
                          <button
                            onClick={() => handleSaveSlot(slot)}
                            disabled={savingSlot}
                            className="btn btn-sm"
                            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', color: 'white', gap: '4px' }}
                          >
                            {savingSlot ? <><RefreshCw size={12} className="spin" /> Saving...</> : <><Save size={12} /> ⚡ Set & Save Period</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                            background: slot.is_custom ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.1)',
                            border: slot.is_custom ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(59,130,246,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem',
                            color: slot.is_custom ? '#34d399' : '#60a5fa'
                          }}>
                            P{slot.period_number}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                              {slot.subject_code} — {slot.subject_name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                              {slot.time_str} • {slot.faculty_name} • Room: {slot.room}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {slot.is_custom ? (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Custom</span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>Default</span>
                          )}
                          <button
                            onClick={() => handleOpenEditSlot(slot)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c084fc', gap: '4px', fontSize: '0.72rem' }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {timetableMatrix.length === 0 && !timetableLoading && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No timetable data. Click Edit on any period to set subjects.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* Tab 6: Department HOD Governance (Master Admin MOHD) */}
      {/* ==================================================== */}
      {activeTab === 'hods' && isMasterAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Action Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
                }}>
                  <Shield size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    Department HOD Governance & Password Management
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Master Admin <strong style={{ color: '#fbbf24' }}>MOHD</strong> • Create Department Heads, Assign Departments & Configure Passwords
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={handleOpenCreateHOD}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                    borderColor: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: 700,
                    gap: '6px'
                  }}
                >
                  <Plus size={15} />
                  <span>+ Create Department HOD</span>
                </button>
                <button
                  onClick={loadData}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '5px' }}
                >
                  <RefreshCw size={13} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid-4" style={{ marginTop: '1.25rem', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total B.E Branches</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>9 Programs</div>
                <div style={{ fontSize: '0.68rem', color: '#93c5fd' }}>VTU Affiliated Engineering</div>
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registered HODs in DB</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                  {departmentHods.length} Active
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>Department Authorized</div>
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Credential Authority</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>Admin MOHD</div>
                <div style={{ fontSize: '0.68rem', color: '#fde68a' }}>Password & Login Control</div>
              </div>

              <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>System Jurisdiction</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a855f7', marginTop: '2px' }}>Root Master</div>
                <div style={{ fontSize: '0.68rem', color: '#d8b4fe' }}>Full Campus Super Admin</div>
              </div>
            </div>
          </div>

          {/* Department Coverage Grid: 9 RGIT B.E Branches */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  RGIT 9 B.E Engineering Branches — HOD Deployment Status
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  View assigned Head of Department for each engineering branch or create & assign a new HOD
                </p>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                9 Standard RGIT B.E Branches
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
              {RGIT_BE_COURSES.map(course => {
                const assignedHod = departmentHods.find(h => isDeptMatch(h.department, course.name));
                return (
                  <div
                    key={course.id}
                    style={{
                      background: assignedHod ? 'rgba(168, 85, 247, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: assignedHod ? '1px solid rgba(168, 85, 247, 0.35)' : '1px dashed var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '0.35rem' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.7rem',
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#60a5fa',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700
                        }}>
                          {course.code}
                        </span>
                        {assignedHod ? (
                          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                            <Check size={10} style={{ marginRight: '3px' }} /> Assigned
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                            Vacant
                          </span>
                        )}
                      </div>

                      <h5 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
                        {course.name.replace('B.E in ', '')}
                      </h5>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {course.level} • {course.duration}
                      </div>

                      {assignedHod ? (
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e9d5ff' }}>
                            {assignedHod.full_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Username: <strong style={{ color: '#c084fc', fontFamily: 'var(--font-mono)' }}>{assignedHod.username}</strong>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {assignedHod.email || `${assignedHod.username}@rgit.ac.in`} • {assignedHod.phone || '+91 9845012345'}
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem', background: 'rgba(255, 255, 255, 0.01)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            No HOD currently assigned to this branch
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.25rem' }}>
                      {assignedHod ? (
                        <>
                          <button
                            onClick={() => handleOpenEditHODPassword(assignedHod)}
                            className="btn btn-sm"
                            style={{
                              flex: 1,
                              background: 'rgba(245, 158, 11, 0.15)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              color: '#fbbf24',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              gap: '4px'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>Edit Data</span>
                          </button>
                          <button
                            onClick={() => handleDeleteHOD(assignedHod)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.4rem 0.6rem' }}
                            title="Remove HOD"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setCreateHODForm({
                              department: course.name,
                              full_name: '',
                              username: `hod_${course.code.toLowerCase()}`,
                              password: '',
                              email: '',
                              phone: ''
                            });
                            setCreateHODError(null);
                            setCreateHODModal(true);
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            width: '100%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            borderColor: 'rgba(59, 130, 246, 0.4)',
                            color: '#60a5fa',
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            gap: '4px'
                          }}
                        >
                          <Plus size={13} />
                          <span>+ Assign HOD to {course.code}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Registered HODs Table */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#f8fafc' }}>
                  All Active Department HOD Accounts ({departmentHods.length})
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Full roster of authorized Head of Department accounts registered across the database
                </p>
              </div>
            </div>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>HOD Name & Designation</th>
                    <th>Governing Department</th>
                    <th>Login Username</th>
                    <th>Contact Info</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin MOHD Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentHods.length > 0 ? (
                    departmentHods.map((hod) => (
                      <tr key={hod.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'rgba(168, 85, 247, 0.2)',
                              color: '#c084fc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}>
                              {hod.full_name?.charAt(0) || 'H'}
                            </div>
                            <div>
                              <strong style={{ color: '#f8fafc', fontSize: '0.85rem' }}>{hod.full_name}</strong>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Head of Department (HOD)</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: '#e9d5ff', fontWeight: 600 }}>
                            {hod.department || 'All Departments'}
                          </span>
                        </td>
                        <td>
                          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px', color: '#38bdf8', fontSize: '0.78rem' }}>
                            {hod.username}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {hod.email || '—'}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {hod.phone || '—'}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                            Active
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => handleOpenEditHODPassword(hod)}
                              className="btn btn-sm"
                              style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fbbf24',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                gap: '4px'
                              }}
                              title="Give or reset password for this HOD"
                            >
                              <Edit3 size={13} />
                              <span>Edit Data</span>
                            </button>
                            <button
                              onClick={() => handleDeleteHOD(hod)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.35rem 0.55rem' }}
                              title="Delete HOD"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No department HODs found. Click "+ Create Department HOD" above to create the first HOD.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Attendance Records Modal for Admin */}
      {selectedStudentForModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '0.4rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    {selectedStudentForModal.name} ({selectedStudentForModal.usn})
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Section {selectedStudentForModal.section} • VTU Statutory Attendance: {selectedStudentForModal.attendance_percentage}%
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={15} /> Close
              </button>
            </div>

            <div className="modal-body">
              {/* Summary cards */}
              <div className="grid-3" style={{ gap: '0.6rem' }}>
                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Attendance Ratio</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: selectedStudentForModal.is_defaulter ? '#ef4444' : '#34d399' }}>
                    {selectedStudentForModal.attendance_percentage}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    {selectedStudentForModal.attended_classes} of {selectedStudentForModal.total_classes} classes
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Face Biometrics</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selectedStudentForModal.face_registered ? '#34d399' : '#f87171', marginTop: '3px' }}>
                    {selectedStudentForModal.face_registered ? '✓ 128-d Vector Enrolled' : '✕ Not Registered'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Device Hardware Guard</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selectedStudentForModal.bound_device ? '#38bdf8' : '#94a3b8', marginTop: '3px' }}>
                    {selectedStudentForModal.bound_device ? '✓ Bound to Hardware' : 'Pending Binding'}
                  </div>
                </div>
              </div>

              {/* Recent Records Table */}
              <div>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.5rem', color: '#f8fafc' }}>
                  Timestamped Attendance Logs
                </h4>
                {selectedStudentForModal.recent_records && selectedStudentForModal.recent_records.length > 0 ? (
                  <div className="glass-table-container">
                    <table className="glass-table">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Subject</th>
                          <th>Period</th>
                          <th>Status</th>
                          <th>Biometric Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudentForModal.recent_records.map((rec) => (
                          <tr key={rec.id}>
                            <td style={{ fontSize: '0.78rem' }}>{rec.date} {rec.time}</td>
                            <td>
                              <strong>{rec.subject_code}</strong>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rec.subject_name}</div>
                            </td>
                            <td>Period {rec.period_number}</td>
                            <td>
                              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                {rec.status}
                              </span>
                            </td>
                            <td style={{ color: '#34d399', fontWeight: 600, fontSize: '0.78rem' }}>
                              {rec.confidence_score ? `${rec.confidence_score.toFixed(1)}%` : '95.0%'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                    No recent attendance logs recorded for this student.
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Email: {selectedStudentForModal.email} • Phone: {selectedStudentForModal.phone}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditStudent(selectedStudentForModal);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8'
                  }}
                  title="Edit student profile, contact info & semester (HOD Authority)"
                >
                  <Edit3 size={13} /> Edit Profile & Sem
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteStudent(selectedStudentForModal)}
                  className="btn btn-danger btn-sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171'
                  }}
                  title={`Delete ${selectedStudentForModal.name}`}
                >
                  <Trash2 size={13} /> Delete Student
                </button>
                <button onClick={() => setSelectedStudentForModal(null)} className="btn btn-secondary btn-sm">
                  Close Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: HOD Student Record & Semester Progression     */}
      {/* ==================================================== */}
      {editStudentModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '640px', width: '95%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                  color: '#38bdf8',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  <GraduationCap size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Edit Student Record & Semester
                    <span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'uppercase' }}>
                      HOD Exclusive
                    </span>
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Official VTU Academic Registry • Head of Department Authority
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { stopEditWebcam(); setEditStudentModal(null); }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.6rem' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
              <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                
                {/* HOD Authority Privilege Notice */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <Shield size={18} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                    <strong style={{ color: '#38bdf8' }}>HOD Academic Privileges Active:</strong> As Head of Department, you can edit contact details (mobile number, email), update section, and advance academic semesters upon term completion.
                  </div>
                </div>

                {studentEditError && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={15} /> {studentEditError}
                  </div>
                )}

                {studentEditSuccess && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.78rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle size={15} /> {studentEditSuccess}
                  </div>
                )}

                {/* Primary Student Identity Row */}
                <div className="grid-2" style={{ gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={13} style={{ color: '#38bdf8' }} /> Student Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editStudentForm.name}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                      placeholder="e.g. Mohammed Muzammil"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Lock size={13} style={{ color: '#94a3b8' }} /> VTU USN (University Seat No)
                    </label>
                    <input
                      type="text"
                      disabled
                      readOnly
                      className="form-input"
                      value={editStudentForm.usn}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        fontFamily: 'var(--font-mono)',
                        color: '#38bdf8',
                        cursor: 'not-allowed',
                        borderColor: 'rgba(255, 255, 255, 0.08)'
                      }}
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Official VTU registration identifier (Immutable)
                    </span>
                  </div>
                </div>

                {/* SEMESTER PROGRESSION CARD (HIGHLIGHTED FOR HOD) */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(67, 56, 202, 0.15) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={16} style={{ color: '#a78bfa' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                        Academic Semester Progression
                      </span>
                    </div>
                    {editStudentForm.semester < 8 ? (
                      <button
                        type="button"
                        onClick={() => setEditStudentForm({ ...editStudentForm, semester: editStudentForm.semester + 1 })}
                        className="btn btn-primary btn-sm"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.6rem',
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          border: 'none',
                          color: '#fff',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        🚀 Promote to Sem {editStudentForm.semester + 1}
                      </button>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        🎓 Final 8th Semester
                      </span>
                    )}
                  </div>

                  <div className="grid-2" style={{ gap: '0.85rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        Current Active Semester *
                      </label>
                      <select
                        className="form-select"
                        value={editStudentForm.semester}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, semester: parseInt(e.target.value, 10) })}
                      >
                        <option value={1}>Semester 1 (1st Year - Cycle A)</option>
                        <option value={2}>Semester 2 (1st Year - Cycle B)</option>
                        <option value={3}>Semester 3 (2nd Year - Core)</option>
                        <option value={4}>Semester 4 (2nd Year - Core)</option>
                        <option value={5}>Semester 5 (3rd Year - Advanced)</option>
                        <option value={6}>Semester 6 (3rd Year - Advanced)</option>
                        <option value={7}>Semester 7 (Final Year - Project/Electives)</option>
                        <option value={8}>Semester 8 (Final Year - Internship/Degree Completion)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        Class Section *
                      </label>
                      <select
                        className="form-select"
                        value={editStudentForm.section}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, section: e.target.value.toUpperCase() })}
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                      </select>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.7rem', color: '#cbd5e1', marginTop: '0.5rem', marginBottom: 0 }}>
                    💡 HOD Authority: Update the semester when the student finishes their exams and term requirements.
                  </p>
                </div>

                {/* Contact Information (Mobile Number & Email ID) */}
                <div className="grid-2" style={{ gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Phone size={13} style={{ color: '#38bdf8' }} /> Mobile Phone Number *
                      </label>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: (editStudentForm.countryCode || '+91') === '+91' ? (editStudentForm.phone.length === 10 ? '#34d399' : '#fbbf24') : '#38bdf8',
                        fontWeight: 700
                      }}>
                        {(editStudentForm.countryCode || '+91') === '+91' ? `${editStudentForm.phone.length}/10 Digits ${editStudentForm.phone.length === 10 ? '✓' : ''}` : `${editStudentForm.phone.length} Digits`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={editStudentForm.countryCode || '+91'}
                        onChange={(e) => {
                          const newCC = e.target.value;
                          setEditStudentForm({
                            ...editStudentForm,
                            countryCode: newCC,
                            phone: newCC === '+91' ? cleanPhoneDigits(editStudentForm.phone).slice(0, 10) : editStudentForm.phone
                          });
                        }}
                        style={{ width: '135px', flexShrink: 0, fontWeight: 600 }}
                      >
                        {COUNTRY_CODE_OPTIONS.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.label}
                          </option>
                        ))}
                      </select>

                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={(editStudentForm.countryCode || '+91') === '+91' ? 10 : 15}
                        className="form-input"
                        value={editStudentForm.phone}
                        onChange={(e) => {
                          const maxL = (editStudentForm.countryCode || '+91') === '+91' ? 10 : 15;
                          const digitsOnly = cleanPhoneDigits(e.target.value).slice(0, maxL);
                          setEditStudentForm({ ...editStudentForm, phone: digitsOnly });
                        }}
                        placeholder={(editStudentForm.countryCode || '+91') === '+91' ? '10-digit number (e.g. 9845012345)' : 'Phone number digits'}
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                      />
                    </div>

                    <span style={{ fontSize: '0.68rem', color: (editStudentForm.countryCode || '+91') === '+91' ? (editStudentForm.phone.length === 10 ? '#34d399' : '#fbbf24') : 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      {(editStudentForm.countryCode || '+91') === '+91'
                        ? 'Mandatory Indian mobile number: Exactly 10 digits only. Not more, not less.'
                        : 'Student active WhatsApp / SMS phone number.'}
                    </span>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, marginBottom: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={13} style={{ color: '#38bdf8' }} /> Student Email Address *
                      </label>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: editStudentForm.email && isValidEmail(editStudentForm.email) ? '#34d399' : '#fbbf24',
                        fontWeight: 700
                      }}>
                        {editStudentForm.email && isValidEmail(editStudentForm.email) ? '✓ Valid Credentials' : 'name@rgit.ac.in'}
                      </span>
                    </div>

                    <input
                      type="email"
                      required
                      className="form-input"
                      value={editStudentForm.email}
                      onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value.trim().toLowerCase() })}
                      placeholder="student.usn@rgit.ac.in"
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Official college institutional email ID or credentials
                    </span>
                  </div>
                </div>

                {/* HOD Authority: Student Portal Password */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.25) 0%, rgba(30, 27, 75, 0.4) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.35)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        background: 'rgba(168, 85, 247, 0.2)',
                        color: '#c084fc',
                        padding: '0.35rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(168, 85, 247, 0.4)'
                      }}>
                        <KeyRound size={16} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                          Student Account Password
                        </span>
                        <span className="badge badge-info" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                          HOD Authority
                        </span>
                      </div>
                    </div>
                    <span
                      onClick={() => setEditStudentForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      style={{ fontSize: '0.72rem', color: '#c084fc', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}
                    >
                      {editStudentForm.showPassword ? 'Hide Password' : 'Show Password'}
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.35rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={editStudentForm.showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Leave empty to keep existing password, or enter new password (min. 4 chars)"
                        value={editStudentForm.password}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, password: e.target.value })}
                        style={{ paddingLeft: '2.4rem' }}
                      />
                      <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#c084fc' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#cbd5e1', display: 'block', marginTop: '0.3rem' }}>
                    🔑 As Department HOD, you can directly change or reset the student's portal password.
                  </span>
                </div>

                {/* HOD Authority: Biometric Selfie Image */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(14, 116, 144, 0.2) 0%, rgba(15, 23, 42, 0.5) 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        background: 'rgba(6, 182, 212, 0.2)',
                        color: '#22d3ee',
                        padding: '0.35rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(6, 182, 212, 0.4)'
                      }}>
                        <Camera size={16} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>
                          Student Selfie Image (Registration Biometric)
                        </span>
                        <span className="badge badge-primary" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                          AI Face Model
                        </span>
                      </div>
                    </div>

                    {editStudentForm.photo_base64 && (
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        ✓ New Selfie Staged
                      </span>
                    )}
                  </div>

                  {editStudentForm.webcamError && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#f87171',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.74rem',
                      marginBottom: '0.75rem'
                    }}>
                      {editStudentForm.webcamError}
                    </div>
                  )}

                  {/* Hidden File Input for Image Upload */}
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/jpeg,image/png,image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleEditPhotoFileChange}
                  />

                  {/* Live Webcam Stream or Photo Viewfinder */}
                  {editStudentForm.isWebcamActive ? (
                    <div style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#000',
                      border: '2px solid #22d3ee',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <video
                        ref={editVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          maxHeight: '260px',
                          objectFit: 'cover'
                        }}
                      />
                      {/* Face alignment oval guide */}
                      <div style={{
                        position: 'absolute',
                        width: '140px',
                        height: '180px',
                        border: '2px dashed rgba(34, 211, 238, 0.8)',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)'
                      }} />

                      <div style={{
                        position: 'absolute',
                        bottom: '12px',
                        display: 'flex',
                        gap: '10px',
                        zIndex: 10
                      }}>
                        <button
                          type="button"
                          onClick={captureEditWebcamPhoto}
                          className="btn btn-primary btn-sm"
                          style={{
                            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Camera size={14} /> Capture Snapshot
                        </button>
                        <button
                          type="button"
                          onClick={stopEditWebcam}
                          className="btn btn-secondary btn-sm"
                          style={{ background: 'rgba(0,0,0,0.6)', color: '#f8fafc' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Enrolled or Selected Photo */
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: '#070a12',
                        border: editStudentForm.photo_base64 ? '2px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        flexShrink: 0
                      }}>
                        <img
                          src={editStudentForm.photo_preview || `/api/students/${editStudentModal.usn}/photo?t=${photoTimestamp}`}
                          alt={editStudentForm.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(editStudentForm.name || 'Student')}&background=0284c7&color=fff&size=150`;
                          }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                          {editStudentForm.photo_base64 ? 'New Selfie Image Ready to Enroll' : 'Current Biometric Passport / Selfie'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '2px 0 8px 0' }}>
                          {editStudentForm.photo_base64 ? 'Photo will be AI face-verified and re-indexed on save.' : 'Registered student selfie reference used in classroom AI face recognition.'}
                        </div>

                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            📁 Upload Photo
                          </button>
                          <button
                            type="button"
                            onClick={startEditWebcam}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.55rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(6, 182, 212, 0.15)',
                              borderColor: 'rgba(6, 182, 212, 0.4)',
                              color: '#22d3ee'
                            }}
                          >
                            <Camera size={12} /> Take Live Selfie
                          </button>
                          {editStudentForm.photo_base64 && (
                            <button
                              type="button"
                              onClick={handleRevertPhoto}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', color: '#f87171' }}
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '0.5rem', marginBottom: 0 }}>
                    💡 HOD Authority: You can edit or replace the student's registration selfie image at any time.
                  </p>
                </div>

                {/* Academic Department / Branch Selection */}
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Building size={13} style={{ color: '#38bdf8' }} /> Academic Department / Degree Program
                  </label>
                  <select
                    className="form-select"
                    value={editStudentForm.department}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, department: e.target.value })}
                  >
                    {RGIT_BE_COURSES.map((course) => (
                      <option key={course.code} value={course.name}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Guard & Biometric Hardware Binding */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: editStudentModal.bound_device ? '#38bdf8' : '#94a3b8' }} />
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        Device Hardware Guard
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {editStudentModal.bound_device ? (
                          <span style={{ color: '#38bdf8' }}>
                            Bound: {editStudentModal.device_uuid ? `${editStudentModal.device_uuid.substring(0, 16)}...` : 'Yes'}
                          </span>
                        ) : (
                          'Hardware binding is currently unbound'
                        )}
                      </div>
                    </div>
                  </div>

                  {editStudentModal.bound_device && (
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      color: editStudentForm.unbind_device ? '#f87171' : 'var(--text-secondary)'
                    }}>
                      <input
                        type="checkbox"
                        checked={editStudentForm.unbind_device}
                        onChange={(e) => setEditStudentForm({ ...editStudentForm, unbind_device: e.target.checked })}
                      />
                      <span style={{ fontWeight: editStudentForm.unbind_device ? 700 : 500 }}>
                        Reset / Unbind Device
                      </span>
                    </label>
                  )}
                </div>

              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  HOD Authority: <strong style={{ color: '#38bdf8' }}>{currentUser?.full_name || currentUser?.username || 'HOD'}</strong>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { stopEditWebcam(); setEditStudentModal(null); }}
                    className="btn btn-secondary btn-sm"
                    disabled={savingStudent}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStudent}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                      boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {savingStudent ? (
                      <>
                        <RefreshCw size={13} className="spin" /> Updating Student...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Save & Apply Updates (HOD)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Onboard New Teacher (Admin Only)              */}
      {/* ==================================================== */}
      {newFacultyModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Onboard New Teacher (Admin Authority)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Authorize instructor credentials and assign curriculum subjects
                  </p>
                </div>
              </div>

              <button
                onClick={() => setNewFacultyModal(false)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateFaculty} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div className="modal-body">
                {facultyFormError && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    fontSize: '0.8rem',
                    color: '#fca5a5',
                    marginBottom: '1rem'
                  }}>
                    <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <span>{facultyFormError}</span>
                  </div>
                )}

                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label">Instructor Full Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Prof. Sanjeev Kumar"
                      value={facultyFormData.fullName}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, fullName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Faculty Code / Employee ID *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. FAC_CSE_03"
                      style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}
                      value={facultyFormData.facultyCode}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, facultyCode: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label">Login Username *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. sanjeev.k"
                      value={facultyFormData.username}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, username: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="Create teacher password"
                      value={facultyFormData.password}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label className="form-label">Academic Designation *</label>
                    <select
                      className="form-select"
                      value={facultyFormData.designation}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, designation: e.target.value })}
                    >
                      <option value="Assistant Professor">Assistant Professor</option>
                      <option value="Associate Professor">Associate Professor</option>
                      <option value="Professor">Professor</option>
                      <option value="Professor & HOD">Professor & HOD</option>
                      <option value="Adjunct Faculty">Adjunct Faculty</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={facultyFormData.department}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Artificial Intelligence & ML">Artificial Intelligence & ML</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-select"
                      value={facultyFormData.semester}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, semester: parseInt(e.target.value, 10) })}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="form-label">Email Address * <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: 500 }}>(e.g. name@rgit.ac.in or name@gmail.com)</span></label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. name@rgit.ac.in or name@gmail.com"
                      value={facultyFormData.email}
                      onChange={(e) => setFacultyFormData({ ...facultyFormData, email: e.target.value.trim().toLowerCase() })}
                      style={{
                        borderColor: facultyFormData.email && !isValidEmail(facultyFormData.email)
                          ? 'rgba(239, 68, 68, 0.7)' : undefined
                      }}
                    />
                    {facultyFormData.email && !isValidEmail(facultyFormData.email) && (
                      <p style={{ fontSize: '0.7rem', color: '#fca5a5', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={11} /> Must be a valid email (e.g. name@rgit.ac.in or name@gmail.com)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Mobile Phone Number *</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <select
                        className="form-select"
                        style={{ width: '118px', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                        value={facultyFormData.countryCode}
                        onChange={(e) => setFacultyFormData({ ...facultyFormData, countryCode: e.target.value })}
                      >
                        <option value="+91">🇮🇳 +91 India</option>
                        <option value="+1">🇺🇸 +1 USA/CA</option>
                        <option value="+44">🇬🇧 +44 UK</option>
                        <option value="+61">🇦🇺 +61 AU</option>
                        <option value="+971">🇦🇪 +971 UAE</option>
                        <option value="+966">🇸🇦 +966 KSA</option>
                        <option value="+65">🇸🇬 +65 SG</option>
                        <option value="+60">🇲🇾 +60 MY</option>
                        <option value="+49">🇩🇪 +49 DE</option>
                        <option value="+33">🇫🇷 +33 FR</option>
                        <option value="+81">🇯🇵 +81 JP</option>
                        <option value="+86">🇨🇳 +86 CN</option>
                        <option value="+82">🇰🇷 +82 KR</option>
                        <option value="+55">🇧🇷 +55 BR</option>
                        <option value="+27">🇿🇦 +27 ZA</option>
                      </select>
                      <input
                        type="tel"
                        required
                        className="form-input"
                        style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                        placeholder={
                          facultyFormData.countryCode === '+91' ? '10-digit number' :
                          facultyFormData.countryCode === '+1' ? '10-digit number' :
                          facultyFormData.countryCode === '+44' ? '10-digit number' :
                          'Phone number'
                        }
                        value={facultyFormData.phone}
                        onChange={(e) => {
                          const maxL = facultyFormData.countryCode === '+91' ? 10 : 15;
                          const val = cleanPhoneDigits(e.target.value).slice(0, maxL);
                          setFacultyFormData({ ...facultyFormData, phone: val });
                        }}
                        maxLength={facultyFormData.countryCode === '+91' ? 10 : 15}
                        inputMode="numeric"
                      />
                    </div>
                    {facultyFormData.phone && (
                      <p style={{ fontSize: '0.7rem', color: facultyFormData.countryCode === '+91' ? (facultyFormData.phone.length === 10 ? '#34d399' : '#fbbf24') : 'var(--text-muted)', marginTop: '0.3rem' }}>
                        {facultyFormData.countryCode === '+91'
                          ? `Mandatory 10 digits only (${facultyFormData.phone.length}/10 digits) • Full: ${facultyFormData.countryCode} ${facultyFormData.phone}`
                          : `Full: ${facultyFormData.countryCode} ${facultyFormData.phone}`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject Assignment Section (Based on Curriculum) */}
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={15} style={{ color: 'var(--accent-blue)' }} /> Assign Subjects Based on Curriculum *
                    </label>
                    <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                      {facultyFormData.subjectCodes.length} Subjects Selected
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Admin and HODs can assign subjects. The teacher will only be authorized to launch attendance sessions and manage rosters for these selected courses.
                  </p>

                  {/* Custom Subject Input Field (Add Faculty Modal) */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        id="addFacCustomCode" 
                        placeholder="Subject Code (e.g. CUST301)" 
                        className="form-input" 
                        style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                      />
                      <input 
                        type="text" 
                        id="addFacCustomName" 
                        placeholder="Subject Name (e.g. Advanced AI)" 
                        className="form-input" 
                        style={{ flex: 2, padding: '0.45rem', fontSize: '0.8rem' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const codeInput = document.getElementById('addFacCustomCode');
                          const nameInput = document.getElementById('addFacCustomName');
                          const code = codeInput.value.trim().toUpperCase();
                          const name = nameInput.value.trim() || 'Custom Subject';
                          if (code && !facultyFormData.subjectCodes.includes(code)) {
                            handleToggleSubjectSelection(code);
                            if (!allSubjects.some(s => s.code === code)) {
                              setAllSubjects([{ code, name, department: getDeptCode(facultyFormData.department) }, ...allSubjects]);
                            }
                            codeInput.value = '';
                            nameInput.value = '';
                          }
                        }}
                      >
                        Add Custom
                      </button>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    paddingRight: '4px'
                  }}>
                    {allSubjects
                      .filter(sub => facultyFormData.subjectCodes.includes(sub.code) || 
                        ((sub.department === getDeptCode(facultyFormData.department) || !sub.department) && 
                         (sub.semester === facultyFormData.semester || sub.semester === 0)))
                      .map((sub) => {
                      const isSelected = facultyFormData.subjectCodes.includes(sub.code);
                      return (
                        <div
                          key={sub.code}
                          onClick={() => handleToggleSubjectSelection(sub.code)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.5)' : 'var(--glass-border)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? '#93c5fd' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                              {sub.code}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sub.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setNewFacultyModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={facultyFormLoading}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {facultyFormLoading ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Onboarding Teacher...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> Authorize & Onboard Teacher
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Update Faculty Assigned Subjects (Admin Only) */}
      {/* ==================================================== */}
      {editFacultySubjectsModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Modify Assigned Subjects: {editFacultySubjectsModal.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Faculty Code: {editFacultySubjectsModal.faculty_code} • {editFacultySubjectsModal.department}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditFacultySubjectsModal(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Select Curriculum Subjects for this Instructor:
                </span>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  {editSubjectCodes.length} Subjects Selected
                </span>
              </div>

              {/* Custom Subject Input Field */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  id="customSubjectCodeInput" 
                  placeholder="Subject Code (e.g. CUST301)" 
                  className="form-input" 
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  id="customSubjectNameInput" 
                  placeholder="Subject Name (e.g. Adv AI)" 
                  className="form-input" 
                  style={{ flex: 2, padding: '0.45rem', fontSize: '0.8rem' }}
                />
                <button 
                  id="addCustomSubjectBtn"
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const codeInput = document.getElementById('customSubjectCodeInput');
                    const nameInput = document.getElementById('customSubjectNameInput');
                    const code = codeInput.value.trim().toUpperCase();
                    const name = nameInput.value.trim() || 'Custom Subject';
                    if (code && !editSubjectCodes.includes(code)) {
                      handleToggleEditSubjectSelection(code);
                      // Add to allSubjects temporarily so it renders in the grid
                      if (!allSubjects.some(s => s.code === code)) {
                        setAllSubjects([{ code, name, department: editFacultySubjectsModal.department }, ...allSubjects]);
                      }
                      codeInput.value = '';
                      nameInput.value = '';
                    }
                  }}
                >
                  Add Custom
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '0.5rem',
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                {allSubjects
                  .filter(sub => editSubjectCodes.includes(sub.code) || sub.department === getDeptCode(editFacultySubjectsModal.department) || !sub.department)
                  .map((sub) => {
                  const isSelected = editSubjectCodes.includes(sub.code);
                  return (
                    <div
                      key={sub.code}
                      onClick={() => handleToggleEditSubjectSelection(sub.code)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.5)' : 'var(--glass-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSelected ? '#38bdf8' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                          {sub.code}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sub.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setEditFacultySubjectsModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpdatedSubjects}
                disabled={facultyFormLoading}
                className="btn btn-primary btn-sm"
              >
                {facultyFormLoading ? 'Updating Subjects...' : 'Save Subject Authorization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Edit Faculty Profile (Admin / HOD)            */}
      {/* ==================================================== */}
      {editFacultyProfileModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <User size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Edit Profile: {editFacultyProfileModal.name}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Faculty Code: {editFacultyProfileModal.faculty_code}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditFacultyProfileModal(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedProfile}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={editProfileData.full_name}
                      onChange={(e) => setEditProfileData({ ...editProfileData, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editProfileData.designation}
                      onChange={(e) => setEditProfileData({ ...editProfileData, designation: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. name@rgit.ac.in"
                      className="form-input"
                      value={editProfileData.email}
                      onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value.trim().toLowerCase() })}
                    />
                    {editProfileData.email && !isValidEmail(editProfileData.email) && (
                      <span style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '0.25rem', display: 'block' }}>
                        ⚠️ Invalid email address (e.g. name@rgit.ac.in or name@gmail.com)
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 0 }}>
                        Mobile Phone Number * (10 Digits)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: editProfileData.phone.length === 10 ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {editProfileData.phone.length}/10 {editProfileData.phone.length === 10 ? '✓' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{
                        padding: '0.55rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)'
                      }}>+91</span>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="form-input"
                        value={editProfileData.phone}
                        onChange={(e) => setEditProfileData({ ...editProfileData, phone: cleanPhoneDigits(e.target.value).slice(0, 10) })}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: editProfileData.phone.length === 10 ? '#34d399' : (editProfileData.phone ? '#fbbf24' : 'var(--text-muted)'), marginTop: '0.25rem', display: 'block' }}>
                      {editProfileData.phone.length === 10 ? '✓ Valid Indian Mobile Number' : `Mandatory 10 digits only (${editProfileData.phone.length}/10)`}
                    </span>
                  </div>
                </div>

                {/* Embedded Edit Subjects Option */}
                <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>Curriculum & Subjects</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manage this faculty's authorized subjects</span>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ borderColor: '#3b82f6', color: '#60a5fa' }}
                    onClick={() => {
                      const f = editFacultyProfileModal;
                      setEditFacultyProfileModal(null);
                      setEditFacultySubjectsModal(f);
                      const existingCodes = f.assigned_subject_codes
                        ? f.assigned_subject_codes.split(',').map(c => c.trim().toUpperCase()).filter(Boolean)
                        : f.assigned_subjects.map(s => s.split(' ')[0].trim().toUpperCase());
                      setEditSubjectCodes(existingCodes);
                    }}
                  >
                    Edit Subjects
                  </button>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditFacultyProfileModal(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn btn-primary btn-sm"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Set/Reset Faculty Credentials (Admin Only)    */}
      {/* ==================================================== */}
      {editFacultyCredentialsModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Configure Teacher Credentials
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Instructor: <strong style={{ color: '#f8fafc' }}>{editCredentialsData.facultyName}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditFacultyCredentialsModal(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedCredentials} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div className="modal-body">
                <div style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  <strong style={{ color: '#60a5fa' }}>Admin Credential Authority:</strong> You are setting the login name and password that this teacher must use to log into the RGIT Faculty Portal.
                </div>

                <div style={{
                  padding: '0.55rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '1rem',
                  fontSize: '0.72rem',
                  color: '#6ee7b7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle size={12} />
                  Username auto-suggested from instructor name. You can edit it below.
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Teacher Login Name / Username *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. faculty1 or teacher_username"
                    value={editCredentialsData.username}
                    onChange={(e) => setEditCredentialsData({ ...editCredentialsData, username: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    The teacher can sign in using this exact login username.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    New Password Set by Admin *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="Enter new password (e.g. RGIT@Teacher2026)"
                      value={editCredentialsData.newPassword}
                      onChange={(e) => setEditCredentialsData({ ...editCredentialsData, newPassword: e.target.value })}
                      style={{ paddingRight: '2.5rem' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Share this password with the instructor so they can access their classes.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditFacultyCredentialsModal(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={credentialsLoading}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {credentialsLoading ? (
                    <>
                      <RefreshCw size={13} className="spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <KeyRound size={13} /> Save Teacher Credentials
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Create Department HOD (Admin MOHD Authority)  */}
      {/* ==================================================== */}
      {createHODModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Create Department HOD (Admin MOHD)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Authorize a new Head of Department and assign login credentials
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCreateHODModal(false)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateHODSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div className="modal-body">
                {createHODError && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger)',
                    fontSize: '0.78rem',
                    color: '#fca5a5'
                  }}>
                    {createHODError}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Select RGIT Department / Branch *
                  </label>
                  <select
                    className="form-select"
                    value={createHODForm.department}
                    onChange={(e) => setCreateHODForm({ ...createHODForm, department: e.target.value })}
                    required
                  >
                    {RGIT_BE_COURSES.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.duration})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    HOD Full Name with Honorific *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Dr. Preeti R or Dr. Ramesh B"
                    value={createHODForm.full_name}
                    onChange={(e) => setCreateHODForm({ ...createHODForm, full_name: e.target.value })}
                  />
                </div>

                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      HOD Login Username *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. hod_ece or preeti_r"
                      value={createHODForm.username}
                      onChange={(e) => setCreateHODForm({ ...createHODForm, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>
                      Initial Password Given by Admin *
                    </label>
                    <input
                      type="password"
                      required
                      className="form-input"
                      placeholder="e.g. ECE@HOD2026"
                      value={createHODForm.password}
                      onChange={(e) => setCreateHODForm({ ...createHODForm, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="hod.dept@rgit.ac.in"
                      value={createHODForm.email}
                      onChange={(e) => setCreateHODForm({ ...createHODForm, email: e.target.value.trim().toLowerCase() })}
                    />
                    <span style={{ fontSize: '0.7rem', color: createHODForm.email && !isValidEmail(createHODForm.email) ? '#f87171' : 'var(--text-muted)' }}>
                      {createHODForm.email && !isValidEmail(createHODForm.email) ? '⚠️ Invalid email format' : 'Mandatory email ID'}
                    </span>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Mobile Phone Number *</label>
                      <span style={{ fontSize: '0.7rem', color: createHODForm.phone.length === 10 ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {createHODForm.phone.length}/10 Digits {createHODForm.phone.length === 10 ? '✓' : ''}
                      </span>
                    </div>
                    <input
                      type="tel"
                      required
                      inputMode="numeric"
                      className="form-input"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={createHODForm.phone}
                      onChange={(e) => setCreateHODForm({ ...createHODForm, phone: cleanPhoneDigits(e.target.value).slice(0, 10) })}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Indian 10-digit mobile number (+91)
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCreateHODModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHODLoading}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                    borderColor: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {createHODLoading ? (
                    <>
                      <RefreshCw size={13} className="spin" /> Creating HOD...
                    </>
                  ) : (
                    <>
                      <Shield size={13} /> Create Department HOD
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Set / Give HOD Password (Admin MOHD Authority) */}
      {/* ==================================================== */}
      {editHODPasswordModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Edit HOD Credentials & Data
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Admin <strong style={{ color: '#fbbf24' }}>MOHD</strong> Authority • Set login credentials and profile details for HOD
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditHODPasswordModal(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveHODPassword} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div className="modal-body">
                {editHODPasswordError && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid var(--danger)',
                    fontSize: '0.78rem',
                    color: '#fca5a5'
                  }}>
                    {editHODPasswordError}
                  </div>
                )}

                <div style={{
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45
                }}>
                  <strong style={{ color: '#fbbf24' }}>
                    {isMasterAdmin ? 'Master Admin Credential Authority:' : 'HOD Contact & Profile Settings:'}
                  </strong>{' '}
                  {isMasterAdmin 
                    ? 'You are updating profile details and optionally changing credentials for this Department HOD.' 
                    : 'You can update your personal contact email, mandatory 10-digit mobile number, and password.'}
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    HOD Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editHODPasswordData.fullName}
                    onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Department * {!isMasterAdmin && <span style={{ fontSize: '0.7rem', color: '#fbbf24' }}>(Locked)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isMasterAdmin}
                    className="form-input"
                    value={editHODPasswordData.department}
                    onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, department: e.target.value })}
                    style={!isMasterAdmin ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                  />
                  {!isMasterAdmin && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      🔒 Department jurisdiction is managed by Master Admin (MOHD).
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: 0 }}>
                        <Mail size={13} style={{ color: '#38bdf8' }} />
                        Email ID *
                      </label>
                      <span style={{
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-mono)',
                        color: editHODPasswordData.email && isValidEmail(editHODPasswordData.email) ? '#34d399' : '#fbbf24',
                        fontWeight: 700
                      }}>
                        {editHODPasswordData.email && isValidEmail(editHODPasswordData.email) ? '✓ Valid Credentials' : 'hod@rgit.ac.in'}
                      </span>
                    </div>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="e.g. hod.dept@rgit.ac.in"
                      value={editHODPasswordData.email}
                      onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, email: e.target.value.trim().toLowerCase() })}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <span style={{ fontSize: '0.68rem', color: editHODPasswordData.email && !isValidEmail(editHODPasswordData.email) ? '#f87171' : 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      {editHODPasswordData.email && !isValidEmail(editHODPasswordData.email) ? '⚠️ Invalid email format credentials' : 'Mandatory institutional contact email'}
                    </span>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: 0 }}>
                        <Phone size={13} style={{ color: '#34d399' }} />
                        Mobile Phone Number *
                      </label>
                      <span style={{ fontSize: '0.68rem', color: editHODPasswordData.phone.length === 10 ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {editHODPasswordData.phone.length}/10 {editHODPasswordData.phone.length === 10 ? '✓' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '0.25rem' }}>
                      <span style={{
                        padding: '0.55rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#38bdf8',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        fontFamily: 'var(--font-mono)'
                      }}>+91</span>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        className="form-input"
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        value={editHODPasswordData.phone}
                        onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, phone: cleanPhoneDigits(e.target.value).slice(0, 10) })}
                        style={{ flex: 1 }}
                      />
                    </div>
                    <span style={{ fontSize: '0.68rem', color: editHODPasswordData.phone.length === 10 ? '#34d399' : (editHODPasswordData.phone ? '#fbbf24' : 'var(--text-muted)'), marginTop: '0.2rem', display: 'block' }}>
                      {editHODPasswordData.phone.length === 10 ? '✓ Valid Indian Mobile Number' : `Mandatory 10 digits only (${editHODPasswordData.phone.length}/10)`}
                    </span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    HOD Login Username *
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editHODPasswordData.username}
                    onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, username: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    The HOD will sign in using this login username.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    New Password Given by Admin MOHD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={editHODPasswordData.showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Leave blank to keep current password"
                      value={editHODPasswordData.newPassword}
                      onChange={(e) => setEditHODPasswordData({ ...editHODPasswordData, newPassword: e.target.value })}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setEditHODPasswordData({ ...editHODPasswordData, showPassword: !editHODPasswordData.showPassword })}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {editHODPasswordData.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Give this password to the HOD so they can authenticate into their portal.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setEditHODPasswordModal(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editHODPasswordLoading}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                    borderColor: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {editHODPasswordLoading ? (
                    <>
                      <RefreshCw size={13} className="spin" /> Updating Password...
                    </>
                  ) : (
                    <>
                      <KeyRound size={13} /> Save & Enforce Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Full Biometric Photo Inspection / Zoom       */}
      {/* ==================================================== */}
      {previewPhotoModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setPreviewPhotoModal(null)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '480px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '0.45rem',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <UserCheck size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                    Biometric Passport Photo Inspection
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {previewPhotoModal.full_name} • {previewPhotoModal.usn}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={15} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid rgba(59, 130, 246, 0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                background: '#0f172a',
                maxWidth: '320px',
                width: '100%'
              }}>
                <img
                  src={previewPhotoModal.photo_url}
                  alt={previewPhotoModal.full_name}
                  style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  height: '240px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}>
                  Passport photo unavailable
                </div>
              </div>

              <div style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--glass-border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.78rem',
                textAlign: 'left'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{previewPhotoModal.department}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Semester / Section:</span>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>Semester {previewPhotoModal.semester} • Sec {previewPhotoModal.section}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Face AI Status:</span>
                  <div style={{ fontWeight: 600, color: previewPhotoModal.face_detected ? '#34d399' : '#f87171' }}>
                    {previewPhotoModal.face_detected ? '✓ Valid Face Detected' : '⚠️ No Face Detected'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Application Status:</span>
                  <div style={{ fontWeight: 600, color: previewPhotoModal.status === 'APPROVED' ? '#34d399' : previewPhotoModal.status === 'REJECTED' ? '#ef4444' : '#eab308' }}>
                    {previewPhotoModal.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => setPreviewPhotoModal(null)}
                className="btn btn-secondary btn-sm"
              >
                Close Inspection
              </button>

              {previewPhotoModal.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const req = previewPhotoModal;
                      setPreviewPhotoModal(null);
                      handleOpenRejectModal(req);
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ gap: '4px' }}
                  >
                    <XCircle size={14} /> Reject Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const req = previewPhotoModal;
                      setPreviewPhotoModal(null);
                      handleApproveStudent(req);
                    }}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      borderColor: '#10b981',
                      gap: '4px'
                    }}
                  >
                    <CheckCircle size={14} /> Accept & Enroll
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: Reject Student Application with Reason Dialog */}
      {/* ==================================================== */}
      {rejectModalData && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }}>
          <div className="modal-card" style={{ maxWidth: '640px', maxHeight: '90vh' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.25)', background: 'rgba(15, 23, 42, 0.98)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.18)',
                  color: '#f87171',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f87171', margin: 0, letterSpacing: '-0.01em' }}>
                    Reject Admission Application
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Select a predefined rejection reason or type a custom reason for the student
                  </p>
                </div>
              </div>

              <button
                onClick={() => setRejectModalData(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.35rem 0.5rem' }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.2rem 1.4rem' }}>
              
              {/* Student Overview Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                padding: '0.75rem 0.9rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  background: '#0a0f1d',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {rejectModalData.photo_url ? (
                    <img
                      src={rejectModalData.photo_url}
                      alt={rejectModalData.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <User size={22} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>
                      {rejectModalData.usn}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#cbd5e1' }}>
                      {rejectModalData.full_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '3px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {getDeptCode(rejectModalData.department)}
                    </span>
                    <span>• Sem {rejectModalData.semester} • Sec {rejectModalData.section}</span>
                    {rejectModalData.phone && <span>• 📞 {rejectModalData.phone}</span>}
                  </div>
                </div>

                <div style={{
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  fontWeight: 700,
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  whiteSpace: 'nowrap'
                }}>
                  ACTION: REJECT
                </div>
              </div>

              {/* Notice Banner */}
              <div style={{
                padding: '0.6rem 0.85rem',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.22)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, color: '#f87171' }} />
                <span>
                  <strong>HOD Authority Notice:</strong> The student will be blocked from biometric login and this decision reason will be displayed on their status check screen.
                </span>
              </div>

              {/* SECTION 1: DEFAULT REJECTION OPTIONS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Sliders size={13} style={{ color: '#38bdf8' }} />
                    Default Options of Rejection:
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Click a preset to auto-fill reason
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {REJECTION_PRESETS.map((preset) => {
                    const isSelected = selectedRejectPreset === preset.id;
                    const PresetIcon = 
                      preset.id === 'blurry_photo' ? Camera :
                      preset.id === 'face_obscured' ? EyeOff :
                      preset.id === 'multiple_faces' ? Users :
                      preset.id === 'usn_not_found' ? AlertTriangle :
                      preset.id === 'dept_sem_mismatch' ? GraduationCap :
                      preset.id === 'duplicate_reg' ? Shield : Edit3;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectRejectPreset(preset)}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isSelected 
                            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.08) 100%)' 
                            : 'rgba(255, 255, 255, 0.02)',
                          boxShadow: isSelected ? '0 0 12px rgba(239, 68, 68, 0.25)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          transition: 'all 0.18s ease'
                        }}
                      >
                        {/* Radio indicator circle */}
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #ef4444' : '2px solid rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background: isSelected ? '#ef4444' : 'transparent',
                          transition: 'all 0.15s ease'
                        }}>
                          {isSelected && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                          )}
                        </div>

                        {/* Icon */}
                        <div style={{
                          color: isSelected ? '#f87171' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PresetIcon size={16} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: isSelected ? 700 : 600,
                              color: isSelected ? '#fca5a5' : '#e2e8f0'
                            }}>
                              {preset.label}
                            </span>
                            <span style={{
                              fontSize: '0.62rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                              color: isSelected ? '#fecaca' : 'var(--text-muted)',
                              fontWeight: 600
                            }}>
                              {preset.badge}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '1px'
                          }}>
                            {preset.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: EDITABLE REASON (WRITE OR MODIFY) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Edit3 size={13} style={{ color: '#f59e0b' }} />
                    Type / Edit Reason of Rejection:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {selectedRejectPreset === 'custom' ? (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(56, 189, 248, 0.25)'
                      }}>
                        ✍️ Custom Reason Mode
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(16, 185, 129, 0.25)'
                      }}>
                        ✓ Preset Selected (Editable)
                      </span>
                    )}

                    {rejectReason && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectReason('');
                          setSelectedRejectPreset('custom');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          padding: '0 2px',
                          textDecoration: 'underline'
                        }}
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    className="form-input"
                    rows={3}
                    maxLength={250}
                    value={rejectReason}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRejectReason(val);
                      const matchingPreset = REJECTION_PRESETS.find(p => p.id !== 'custom' && p.text === val);
                      if (matchingPreset) {
                        setSelectedRejectPreset(matchingPreset.id);
                      } else {
                        setSelectedRejectPreset('custom');
                      }
                    }}
                    placeholder="Type the specific reason for rejection (e.g. Photo blurry, USN mismatch, wrong semester)..."
                    style={{
                      fontSize: '0.82rem',
                      lineHeight: '1.45',
                      resize: 'vertical',
                      minHeight: '76px',
                      background: 'rgba(10, 15, 29, 0.9)',
                      border: !rejectReason.trim() ? '1.5px solid rgba(239, 68, 68, 0.6)' : '1px solid var(--glass-border-bright)'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    💡 Displayed directly to student upon lookup or sign-in attempt
                  </span>
                  <span style={{
                    color: rejectReason.length >= 240 ? '#f87171' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600
                  }}>
                    {rejectReason.trim().length} / 250
                  </span>
                </div>
              </div>

            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setRejectModalData(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === rejectModalData.id || !rejectReason.trim()}
                onClick={handleConfirmReject}
                className="btn btn-danger btn-sm"
                style={{
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: !rejectReason.trim() ? 'rgba(239, 68, 68, 0.3)' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: !rejectReason.trim() ? 'none' : '0 2px 10px rgba(220, 38, 38, 0.4)'
                }}
              >
                {actionLoadingId === rejectModalData.id ? (
                  <>
                    <RefreshCw size={13} className="spin" /> Confirming Rejection...
                  </>
                ) : (
                  <>
                    <XCircle size={14} /> Confirm Official Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
