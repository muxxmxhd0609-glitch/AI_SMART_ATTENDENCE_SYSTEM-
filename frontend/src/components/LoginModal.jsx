import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Shield, UserCheck, Lock, User, 
  Smartphone, AlertCircle, Eye, EyeOff, Database, CheckCircle2, ArrowRight,
  ShieldAlert, KeyRound, Layers, Sparkles, BookOpen, Building, Award, Check,
  FolderGit2, Hash, RefreshCw
} from 'lucide-react';
import { api, getDeviceUUID } from '../services/api';
import { RGIT_BE_COURSES, RGIT_HOD_ROSTER, isDeptMatch, getDeptCode, formatRGITUsn, RGIT_USN_PREFIX, validateRGITUsn } from '../constants/courses';
import USNInput from './USNInput';

// Standardized sample USN prefixes per Department
const DEPT_SAMPLE_USN = {
  CSE: '1RG24CS409',
  ECE: '1RG21EC001',
  EE: '1RG21EE001',
  BME: '1RG21BM001',
  ME: '1RG21ME001',
  CSE_AI: '1RG21AI001',
  CSE_IOT_CS_BT: '1RG21CB001',
  ISE: '1RG21IS001',
  AIML: '1RG21AM001'
};

// Department dedicated Database files
const DEPT_DB_FILE = {
  CSE: 'attendance_CSE.db',
  ECE: 'attendance_ECE.db',
  EE: 'attendance_EE.db',
  BME: 'attendance_BME.db',
  ME: 'attendance_ME.db',
  CSE_AI: 'attendance_CSE_AI.db',
  CSE_IOT_CS_BT: 'attendance_CSE_IOT_CS_BT.db',
  ISE: 'attendance_ISE.db',
  AIML: 'attendance_AIML.db'
};

export default function LoginModal({ onLoginSuccess, onOpenRegister }) {
  // Tab state: 'student' | 'teacher' | 'hod' | 'admin'
  const [activeTab, setActiveTab] = useState('student');

  // RGIT BE Course Selection State for all Logins (Separate Department context)
  const [studentCourse, setStudentCourse] = useState('B.E in Computer Science and Engineering');
  const [teacherCourse, setTeacherCourse] = useState('B.E in Computer Science and Engineering');
  const [hodCourse, setHodCourse] = useState('B.E in Computer Science and Engineering');

  // Semester Selection: strictly semesters 1 to 8 (NO 'Add Semester')
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Student Roll Number State
  const [studentRoll, setStudentRoll] = useState('1RG');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Student Password Reset / Edit Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsn, setResetUsn] = useState('');
  const [resetCredential, setResetCredential] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  // Teacher Semester Selection: strictly semesters 1 to 8 (NO 'Add Semester')
  const [teacherSemester, setTeacherSemester] = useState(1);
  const [enrolledFaculty, setEnrolledFaculty] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [selectedTeacherName, setSelectedTeacherName] = useState('');

  // Teacher Credentials State
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // Protected Department HOD Credentials State (Head of Department Portal)
  const [hodUsername, setHodUsername] = useState('hod_cse');
  const [hodPassword, setHodPassword] = useState('');
  const [showHodPassword, setShowHodPassword] = useState(false);
  const [publicHods, setPublicHods] = useState([]);

  // Master System Admin Credentials State (MOHD)
  const [adminUsername, setAdminUsername] = useState('MOHD');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deviceUuid = getDeviceUUID();

  // Helper to resolve HOD for a given department
  const resolveHodForDept = (deptIdentifier) => {
    if (!deptIdentifier) return RGIT_HOD_ROSTER[0];
    if (publicHods && publicHods.length > 0) {
      const match = publicHods.find(h => isDeptMatch(h.department, deptIdentifier));
      if (match) return match;
    }
    const fallback = RGIT_HOD_ROSTER.find(h => 
      isDeptMatch(h.courseName, deptIdentifier) || isDeptMatch(h.code, deptIdentifier)
    );
    return fallback || RGIT_HOD_ROSTER[0];
  };

  const activeHod = resolveHodForDept(hodCourse);

  // 1. Fetch public HODs on mount
  useEffect(() => {
    let isMounted = true;
    const fetchHods = async () => {
      try {
        const liveHods = await api.getPublicHods();
        if (isMounted && Array.isArray(liveHods) && liveHods.length > 0) {
          setPublicHods(liveHods);
        }
      } catch (err) {}
    };
    fetchHods();
    return () => { isMounted = false; };
  }, []);

  // 2. Sync HOD username when hodCourse or publicHods changes
  useEffect(() => {
    const resolved = resolveHodForDept(hodCourse);
    if (resolved) {
      setHodUsername(resolved.username);
    }
  }, [hodCourse, publicHods]);

  // 3. Fetch students whenever selectedSemester or studentCourse changes
  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const liveData = await api.getPublicStudentsBySemester(selectedSemester, studentCourse);
        if (isMounted && Array.isArray(liveData)) {
          setEnrolledStudents(liveData);
        }
      } catch (err) {
        if (isMounted) setEnrolledStudents([]);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    };
    fetchStudents();
    return () => { isMounted = false; };
  }, [selectedSemester, studentCourse]);

  // 4. Fetch faculty whenever teacherSemester or teacherCourse changes
  useEffect(() => {
    let isMounted = true;
    const fetchFaculty = async () => {
      setLoadingFaculty(true);
      try {
        const liveData = await api.getPublicFacultyBySemester(teacherSemester, teacherCourse);
        if (isMounted && Array.isArray(liveData)) {
          const mapped = liveData.map(f => ({
            u: f.username,
            name: f.name,
            code: f.code,
            subject: f.subject || f.department,
            department: f.department
          }));
          setEnrolledFaculty(mapped);
        }
      } catch (err) {
        if (isMounted) setEnrolledFaculty([]);
      } finally {
        if (isMounted) setLoadingFaculty(false);
      }
    };
    fetchFaculty();
    return () => { isMounted = false; };
  }, [teacherSemester, teacherCourse]);

  // User Actions: Clear options upon changing department/semester
  const handleStudentCourseChange = (newCourse) => {
    setStudentCourse(newCourse);
    setStudentRoll('1RG');
    setStudentPassword('');
    setError(null);
  };

  const handleSemesterChange = (sem) => {
    const numSem = parseInt(sem, 10);
    setSelectedSemester(numSem);
    setStudentRoll('1RG');
    setStudentPassword('');
    setError(null);
  };

  const handleTeacherCourseChange = (newCourse) => {
    setTeacherCourse(newCourse);
    setTeacherUsername('');
    setSelectedTeacherName('');
    setTeacherPassword('');
    setError(null);
  };

  const handleTeacherSemesterChange = (sem) => {
    const numSem = parseInt(sem, 10);
    setTeacherSemester(numSem);
    setTeacherUsername('');
    setSelectedTeacherName('');
    setTeacherPassword('');
    setError(null);
  };

  const handleTeacherCardSelect = (faculty) => {
    setTeacherUsername(faculty.u);
    setSelectedTeacherName(faculty.name);
    setTeacherPassword('');
    setError(null);
  };

  const handleHodCourseChange = (newCourse) => {
    setHodCourse(newCourse);
    const resolved = resolveHodForDept(newCourse);
    if (resolved) {
      setHodUsername(resolved.username);
    }
    setHodPassword('');
    setError(null);
  };

  // 1. Student Login Handler (Strict Database USN Enforcement)
  const handleStudentLogin = async (e) => {
    if (e) e.preventDefault();
    const cleanUsn = formatRGITUsn(studentRoll);
    if (!cleanUsn || cleanUsn === '1RG') {
      setError('Please type your full 10-character University Seat Number (USN), e.g. 1RG24CS409.');
      return;
    }
    const usnCheck = validateRGITUsn(cleanUsn);
    if (!usnCheck.valid) {
      setError(usnCheck.error);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.studentLogin(cleanUsn, studentPassword.trim() || null, studentCourse, selectedSemester);
      if (studentCourse) {
        data.department = studentCourse;
        data.course = studentCourse;
      }
      data.selected_semester = selectedSemester;
      data.semester = data.semester || selectedSemester;
      api.setCurrentUser(data);
      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Login failed. Only students whose USN is in the database can log in.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Teacher Login Handler (Credentials Set by HOD)
  const handleTeacherLogin = async (e) => {
    if (e) e.preventDefault();
    if (!teacherUsername.trim()) {
      setError('Please select a teacher from the list or enter your teacher username.');
      return;
    }
    if (!teacherPassword.trim()) {
      setError('Please enter the password assigned to you by your Department HOD.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.login(teacherUsername.trim(), teacherPassword.trim(), false, teacherCourse, teacherSemester);
      if (teacherCourse) {
        data.department = teacherCourse;
        data.course = teacherCourse;
      }
      data.selected_semester = teacherSemester;
      data.semester = teacherSemester;
      api.setCurrentUser(data);
      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Teacher authentication failed. Please verify credentials set by HOD.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Department HOD Login Handler (Head of Department Portal)
  const handleHodLogin = async (e) => {
    if (e) e.preventDefault();
    if (!hodUsername.trim()) {
      setError('Please select a department to resolve the HOD.');
      return;
    }
    if (!hodPassword.trim()) {
      setError('Please enter the HOD password assigned by Master Admin MOHD.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.adminLogin(hodUsername.trim(), hodPassword.trim());
      if (hodCourse) {
        data.department = hodCourse;
        data.course = hodCourse;
      }
      data.role = 'hod';
      api.setCurrentUser(data);
      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Access Denied: Only authorized RGIT Head of Department (HOD) can log in here. Please verify credentials set by Admin MOHD.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Master Admin Login Handler (Master Admin MOHD / 0609)
  const handleMasterAdminLogin = async (e) => {
    if (e) e.preventDefault();
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setError('Please enter Master Admin username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.adminLogin(adminUsername.trim(), adminPassword.trim());
      data.role = 'admin';
      data.department = 'Master System Administration';
      if (onLoginSuccess) onLoginSuccess(data);
    } catch (err) {
      setError(err.message || 'Access Denied: Invalid Master Admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetStudentPassword = async (e) => {
    if (e) e.preventDefault();
    if (!resetUsn || !resetUsn.trim()) {
      setResetError('Please enter your University Seat Number (USN).');
      return;
    }
    if (!resetCredential || !resetCredential.trim()) {
      setResetError('Please enter your registered mobile number (10 digits) or email.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 4) {
      setResetError('New password must be at least 4 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const cleanUsn = formatRGITUsn(resetUsn);
      const res = await api.resetStudentPassword({
        usn: cleanUsn,
        verification_credential: resetCredential.trim(),
        new_password: resetNewPassword.trim()
      });

      setResetSuccess(res.message || 'Password updated successfully!');
      setStudentRoll(cleanUsn);
      setStudentPassword(resetNewPassword.trim());

      setTimeout(() => {
        setShowResetModal(false);
        setResetSuccess(null);
      }, 1500);
    } catch (err) {
      setResetError(err.message || 'Password update failed. Please check credentials.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '85vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '2.25rem',
        borderRadius: 'var(--radius-xl)',
        border: activeTab === 'admin'
          ? '1px solid rgba(245, 158, 11, 0.5)'
          : activeTab === 'hod'
          ? '1px solid rgba(168, 85, 247, 0.45)'
          : activeTab === 'student'
          ? '1px solid rgba(16, 185, 129, 0.35)'
          : '1px solid var(--glass-border-bright)',
        boxShadow: activeTab === 'admin'
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(245, 158, 11, 0.25)'
          : activeTab === 'hod'
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(168, 85, 247, 0.25)'
          : activeTab === 'student'
          ? '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.15)'
          : '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(37, 99, 235, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Glow corner */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '160px',
          height: '160px',
          background: activeTab === 'student'
            ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)'
            : activeTab === 'teacher'
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)'
            : activeTab === 'hod'
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.28) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transition: 'background 0.3s ease'
        }} />

        {/* RGIT Campus Hero Banner */}
        <div style={{
          width: '100%',
          height: '110px',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: '1.2rem',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)'
        }}>
          <img
            src="/rgit_campus_hero.jpg"
            alt="Rajiv Gandhi Institute of Technology B.E Campus"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(6, 11, 25, 0.2) 0%, rgba(6, 11, 25, 0.9) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0.6rem 0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.85)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                RGIT Bangalore • B.E Programs
              </span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.85)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                VTU Affiliated
              </span>
            </div>
          </div>
        </div>

        {/* Institution Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: activeTab === 'student'
              ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
              : activeTab === 'teacher'
              ? 'var(--primary-gradient)'
              : activeTab === 'hod'
              ? 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)'
              : 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
            margin: '0 auto 0.85rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: activeTab === 'student'
              ? '0 6px 20px rgba(16, 185, 129, 0.4)'
              : activeTab === 'teacher'
              ? '0 6px 20px rgba(37, 99, 235, 0.4)'
              : activeTab === 'hod'
              ? '0 6px 20px rgba(168, 85, 247, 0.5)'
              : '0 6px 20px rgba(245, 158, 11, 0.5)',
            transition: 'all 0.3s ease'
          }}>
            {activeTab === 'student' && <GraduationCap size={30} />}
            {activeTab === 'teacher' && <UserCheck size={28} />}
            {activeTab === 'hod' && <Building size={28} />}
            {activeTab === 'admin' && <Shield size={28} />}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {activeTab === 'admin' ? 'Master Admin Portal (MOHD)' : activeTab === 'hod' ? 'Department HOD Portal' : 'RGIT B.E Campus Portal'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {activeTab === 'admin' ? 'Master System Governance • Rajiv Gandhi Institute of Technology' : 'Rajiv Gandhi Institute of Technology, Bangalore'}
          </p>
        </div>

        {/* 4-Role Tab Navigation: Student | Teacher | HOD Login | Admin Login */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.4rem',
          border: '1px solid var(--glass-border)',
          gap: '2px'
        }}>
          {/* Tab 1: Student */}
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.55rem 0.2rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'student' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              color: activeTab === 'student' ? '#34d399' : 'var(--text-muted)',
              fontWeight: activeTab === 'student' ? 700 : 500,
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'student' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <GraduationCap size={14} />
            <span>Student</span>
          </button>

          {/* Tab 2: Teacher */}
          <button
            type="button"
            onClick={() => { setActiveTab('teacher'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.55rem 0.2rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'teacher' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: activeTab === 'teacher' ? '#60a5fa' : 'var(--text-muted)',
              fontWeight: activeTab === 'teacher' ? 700 : 500,
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'teacher' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <UserCheck size={14} />
            <span>Teacher</span>
          </button>

          {/* Tab 3: HOD Login */}
          <button
            type="button"
            onClick={() => { setActiveTab('hod'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.55rem 0.2rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'hod' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
              color: activeTab === 'hod' ? '#c084fc' : 'var(--text-muted)',
              fontWeight: activeTab === 'hod' ? 700 : 500,
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'hod' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <Building size={14} />
            <span>HOD Login</span>
          </button>

          {/* Tab 4: Admin Login (MOHD) */}
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '0.55rem 0.2rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'admin' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: activeTab === 'admin' ? '#fbbf24' : 'var(--text-muted)',
              fontWeight: activeTab === 'admin' ? 700 : 500,
              fontSize: '0.74rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === 'admin' ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
            }}
          >
            <Shield size={14} />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            fontSize: '0.8rem',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            lineHeight: 1.4
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 1: STUDENT ROLL NUMBER LOGIN        */}
        {/* ======================================= */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentLogin}>
            {/* Prominent New Student Admission / Registration Banner */}
            {onOpenRegister && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.95rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(59, 130, 246, 0.12) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.45)',
                boxShadow: '0 4px 18px rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: 1 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>New Student Admission?</span>
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                        STEP 1
                      </span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#a7f3d0', marginTop: '2px', lineHeight: 1.3 }}>
                      Fill the New Register Form. Applications are routed directly to your Department HOD for approval.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenRegister(selectedSemester, studentCourse)}
                  className="btn btn-primary btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderColor: '#10b981',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.55rem 1rem',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Sparkles size={15} />
                  <span>Open New Register Form</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Step 1: Select RGIT BE Course / Department */}
            <div style={{
              marginBottom: '1.1rem',
              padding: '0.85rem',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} />
                  <span>1. Select RGIT Department / Branch:</span>
                </label>
                <span style={{ fontSize: '0.68rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  [{getDeptCode(studentCourse)}] • {DEPT_DB_FILE[getDeptCode(studentCourse)] || 'attendance.db'}
                </span>
              </div>
              <select
                className="form-select"
                value={studentCourse}
                onChange={(e) => handleStudentCourseChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090d16',
                  color: '#f8fafc',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  fontSize: '0.82rem',
                  padding: '0.55rem'
                }}
              >
                {RGIT_BE_COURSES.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Semester (Strictly 1 to 8 - NO Add Sem) */}
            <div style={{
              marginBottom: '1.1rem',
              padding: '0.85rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} />
                  <span>2. Select Semester (1 – 8):</span>
                </label>
                <span style={{
                  fontSize: '0.68rem',
                  color: '#34d399',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  {getDeptCode(studentCourse)} • Semester {selectedSemester} DB
                </span>
              </div>

              {/* 8-Semester Quick Selector Buttons (1 to 8) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                  const isSelected = selectedSemester === semNum;
                  return (
                    <button
                      key={semNum}
                      type="button"
                      onClick={() => handleSemesterChange(semNum)}
                      style={{
                        padding: '0.45rem 0.2rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid var(--glass-border)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#34d399' : 'var(--text-muted)',
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        boxShadow: isSelected ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none'
                      }}
                    >
                      <span>Sem {semNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Type Student Roll Number / USN */}
            <div className="form-group" style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#f8fafc', marginBottom: 0 }}>
                  3. Student USN Credentials *
                </label>
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                  1RG (Fixed) + Year + {getDeptCode(studentCourse)} + Roll (3 digits)
                </span>
              </div>

              <USNInput
                value={studentRoll}
                onChange={(val) => setStudentRoll(val)}
                department={studentCourse}
                size="large"
                showHelpText={true}
              />
            </div>

            {/* Enrolled Students Chips for Quick Selection */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Or pick from {getDeptCode(studentCourse)} Sem {selectedSemester} database:
                </span>
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>
                  {loadingStudents ? 'Fetching...' : `${enrolledStudents.length} Students`}
                </span>
              </div>
              {loadingStudents ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Loading database records...
                </div>
              ) : enrolledStudents.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {enrolledStudents.map(s => (
                    <button
                      key={s.usn}
                      type="button"
                      onClick={() => setStudentRoll(s.usn)}
                      style={{
                        background: studentRoll === s.usn ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        border: studentRoll === s.usn ? '1px solid #10b981' : '1px solid var(--glass-border)',
                        padding: '0.4rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.73rem', fontWeight: 700, color: studentRoll === s.usn ? '#34d399' : 'var(--text-primary)' }}>
                          {s.usn}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {s.name} ({s.sec || `Sem ${selectedSemester}`})
                        </div>
                      </div>
                      {studentRoll === s.usn && <CheckCircle2 size={13} style={{ color: '#34d399', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  No students pre-seeded for {getDeptCode(studentCourse)} Sem {selectedSemester}. You can type your USN above directly or Self-Register.
                </div>
              )}
            </div>

            {/* Step 4: Password */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 0, fontWeight: 600 }}>
                  4. Student Account Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#34d399', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                >
                  {showStudentPassword ? 'Hide' : 'Show'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showStudentPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter student password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                borderColor: '#10b981',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                fontWeight: 700
              }}
            >
              <GraduationCap size={18} />
              <span>{loading ? 'Verifying with Database...' : 'Sign In with Roll Number'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Self Registration link */}
            {onOpenRegister && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => onOpenRegister(selectedSemester, studentCourse)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderColor: 'rgba(16, 185, 129, 0.4)',
                    color: '#34d399'
                  }}
                >
                  <UserCheck size={14} /> New Student? Fill Register Form
                </button>
              </div>
            )}
          </form>
        )}

        {/* ======================================= */}
        {/* TAB 2: TEACHER LOGIN                    */}
        {/* ======================================= */}
        {activeTab === 'teacher' && (
          <form onSubmit={handleTeacherLogin}>
            {/* Step 1: Select RGIT BE Course / Department */}
            <div style={{
              marginBottom: '1.1rem',
              padding: '0.85rem',
              background: 'rgba(59, 130, 246, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} />
                  <span>1. Select RGIT Department / Branch:</span>
                </label>
                <span style={{ fontSize: '0.68rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  [{getDeptCode(teacherCourse)}] • {DEPT_DB_FILE[getDeptCode(teacherCourse)] || 'attendance.db'}
                </span>
              </div>
              <select
                className="form-select"
                value={teacherCourse}
                onChange={(e) => handleTeacherCourseChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090d16',
                  color: '#f8fafc',
                  borderColor: 'rgba(59, 130, 246, 0.4)',
                  fontSize: '0.82rem',
                  padding: '0.55rem'
                }}
              >
                {RGIT_BE_COURSES.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Select Semester (Strictly 1 to 8 - NO Add Sem) */}
            <div style={{
              marginBottom: '1.1rem',
              padding: '0.85rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} />
                  <span>2. Select Semester (1 – 8):</span>
                </label>
                <span style={{
                  fontSize: '0.68rem',
                  color: '#60a5fa',
                  fontWeight: 600,
                  background: 'rgba(59, 130, 246, 0.12)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  {getDeptCode(teacherCourse)} • Sem {teacherSemester} Faculty
                </span>
              </div>

              {/* 8-Semester Quick Selector Buttons (1 to 8) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.35rem'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                  const isSelected = teacherSemester === semNum;
                  return (
                    <button
                      key={semNum}
                      type="button"
                      onClick={() => handleTeacherSemesterChange(semNum)}
                      style={{
                        padding: '0.45rem 0.2rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--glass-border)',
                        background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#60a5fa' : 'var(--text-muted)',
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.35)' : 'none'
                      }}
                    >
                      <span>Sem {semNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Select Teacher from Filtered Roster */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.74rem', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                  3. Select Teacher ({getDeptCode(teacherCourse)} • Sem {teacherSemester}):
                </span>
                <span style={{ fontSize: '0.68rem', color: '#60a5fa', fontWeight: 600 }}>
                  {loadingFaculty ? 'Fetching...' : `${enrolledFaculty.length} Available`}
                </span>
              </div>
              {loadingFaculty ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Loading faculty records...
                </div>
              ) : enrolledFaculty.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
                  {enrolledFaculty.map(f => {
                    const isSelected = teacherUsername.toLowerCase() === f.u.toLowerCase() ||
                                       (selectedTeacherName && selectedTeacherName.toLowerCase() === f.name.toLowerCase());
                    return (
                      <button
                        key={f.code || f.u}
                        type="button"
                        onClick={() => handleTeacherCardSelect(f)}
                        style={{
                          background: isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--glass-border)',
                          padding: '0.55rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                        }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            color: isSelected ? '#60a5fa' : '#f8fafc',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {f.name}
                          </div>
                          <div style={{
                            fontSize: '0.68rem',
                            color: isSelected ? '#93c5fd' : 'var(--text-muted)',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#60a5fa' }}>{f.u}</span>
                            <span style={{ marginLeft: '4px' }}>• {f.subject?.split('(')[0] || f.code}</span>
                          </div>
                        </div>
                        {isSelected && <UserCheck size={16} style={{ color: '#60a5fa', flexShrink: 0, marginLeft: '4px' }} />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  No teachers specifically registered for {getDeptCode(teacherCourse)} Sem {teacherSemester}. You can type teacher username below directly.
                </div>
              )}
            </div>

            {/* Teacher Username Display / Input */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>
                Teacher Login Username *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Select a teacher above or type username"
                  value={teacherUsername}
                  onChange={(e) => setTeacherUsername(e.target.value)}
                  required
                  style={{ paddingLeft: '2.4rem' }}
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Step 4: Password Assigned by HOD */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>
                  4. Password Assigned by HOD *
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#60a5fa', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                >
                  {showTeacherPassword ? 'Hide password' : 'Show password'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showTeacherPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your teacher password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.6rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showTeacherPassword ? '#60a5fa' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showTeacherPassword ? 'Hide password' : 'Show password'}
                >
                  {showTeacherPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Enter the confidential login password assigned by your Department HOD.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                marginTop: '0.5rem',
                background: 'var(--primary-gradient)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35)',
                fontWeight: 700
              }}
            >
              <UserCheck size={16} />
              <span>{loading ? 'Authenticating...' : `Sign In as ${selectedTeacherName || teacherUsername || 'Teacher'}`}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* ======================================= */}
        {/* TAB 3: HOD PORTAL LOGIN (DEPARTMENT HEADS) */}
        {/* ======================================= */}
        {activeTab === 'hod' && (
          <form onSubmit={handleHodLogin}>
            {/* Step 1: Select Department */}
            <div style={{
              marginBottom: '1.1rem',
              padding: '0.85rem',
              background: 'rgba(168, 85, 247, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen size={15} />
                  <span>1. Select Department:</span>
                </label>
                <span style={{ fontSize: '0.68rem', color: '#c084fc', background: 'rgba(168, 85, 247, 0.18)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  [{getDeptCode(hodCourse)}] • {DEPT_DB_FILE[getDeptCode(hodCourse)] || 'attendance.db'}
                </span>
              </div>
              <select
                className="form-select"
                value={hodCourse}
                onChange={(e) => handleHodCourseChange(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090d16',
                  color: '#f8fafc',
                  borderColor: 'rgba(168, 85, 247, 0.4)',
                  fontSize: '0.82rem',
                  padding: '0.55rem'
                }}
              >
                {RGIT_BE_COURSES.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick 9-Department Switch Chips */}
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                QUICK SWITCH DEPARTMENT HOD:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {RGIT_BE_COURSES.map(c => {
                  const isCurrent = isDeptMatch(c.name, hodCourse);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleHodCourseChange(c.name)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: isCurrent ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isCurrent ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                        color: isCurrent ? '#c084fc' : 'var(--text-muted)',
                        fontSize: '0.7rem',
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {c.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Dedicated HOD Identity Card for the Selected Department */}
            <div style={{
              padding: '0.9rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(126, 34, 206, 0.08) 100%)',
              border: '1.5px solid rgba(168, 85, 247, 0.45)',
              marginBottom: '1.1rem',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                  2. Department Head for {getDeptCode(hodCourse)}
                </span>
                <span style={{ fontSize: '0.65rem', background: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff', padding: '1px 7px', borderRadius: '6px', fontWeight: 600 }}>
                  DB: {DEPT_DB_FILE[getDeptCode(hodCourse)]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)'
                }}>
                  <Building size={22} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                    {activeHod?.full_name || activeHod?.name || 'Department HOD'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#c084fc', marginTop: '1px' }}>
                    Head of Department • {hodCourse}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#e9d5ff', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    HOD Username: <strong style={{ color: '#c084fc' }}>{activeHod?.username || hodUsername}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* HOD Username (Readonly / Preset) */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#f8fafc' }}>
                HOD Login Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={hodUsername}
                  onChange={(e) => setHodUsername(e.target.value)}
                  style={{ paddingLeft: '2.4rem', borderColor: 'rgba(168, 85, 247, 0.35)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
                <Building size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#c084fc' }} />
              </div>
            </div>

            {/* Step 3: Password Assigned by Admin MOHD */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 600, color: '#f8fafc' }}>
                  3. Password Assigned by Admin MOHD *
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#c084fc', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setShowHodPassword(!showHodPassword)}
                >
                  {showHodPassword ? 'Hide password' : 'Show password'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showHodPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter Department HOD password"
                  value={hodPassword}
                  onChange={(e) => setHodPassword(e.target.value)}
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.6rem', borderColor: 'rgba(168, 85, 247, 0.35)' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#c084fc' }} />
                <button
                  type="button"
                  onClick={() => setShowHodPassword(!showHodPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showHodPassword ? '#c084fc' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showHodPassword ? 'Hide password' : 'Show password'}
                >
                  {showHodPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Enter the confidential login credentials assigned for your department.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                borderColor: '#a855f7',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
                fontWeight: 700
              }}
            >
              <Building size={16} />
              <span>{loading ? 'Verifying HOD Authority...' : `Authenticate as HOD (${getDeptCode(hodCourse)})`}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* ======================================= */}
        {/* TAB 4: MASTER ADMIN LOGIN (MOHD / 0609) */}
        {/* ======================================= */}
        {activeTab === 'admin' && (
          <form onSubmit={handleMasterAdminLogin}>
            {/* Master Admin Overview Card */}
            <div style={{
              padding: '0.9rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem'
            }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}>
                <Shield size={20} />
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fef3c7', lineHeight: 1.45 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <strong style={{ color: '#fbbf24', fontSize: '0.84rem' }}>MASTER SYSTEM ADMINISTRATOR</strong>
                  <span style={{ fontSize: '0.62rem', background: 'rgba(245, 158, 11, 0.25)', color: '#fbbf24', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                    ROOT PRIVILEGE
                  </span>
                </div>
                Full jurisdiction across all 9 RGIT B.E departments. Admin MOHD can create department HODs, set/reset HOD passwords, and govern the institution.
              </div>
            </div>

            {/* Master Admin Identification Box */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.04)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Authorized Master Administrator:</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  User: <strong>MOHD</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAdminUsername('MOHD');
                  setError(null);
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                <span>Fill Username</span>
              </button>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" style={{ fontWeight: 600, color: '#f8fafc' }}>
                Master Admin Username *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Enter admin username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  style={{ paddingLeft: '2.4rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24' }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Authorized Master Administrator account username.
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0, fontWeight: 600, color: '#f8fafc' }}>
                  Master Administrator Password *
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#fbbf24', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  {showAdminPassword ? 'Hide password' : 'Show password'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Enter Master Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{ paddingLeft: '2.4rem', paddingRight: '2.6rem', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#fbbf24' }} />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: showAdminPassword ? '#fbbf24' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Authorized security credential required for institutional root access.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
                borderColor: '#f59e0b',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
                color: '#ffffff',
                fontWeight: 700
              }}
            >
              <Shield size={16} />
              <span>{loading ? 'Authenticating Master Admin...' : 'Sign In as Master Admin (MOHD)'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Anti-Proxy Device Binding Hardware Indicator */}
        <div style={{
          marginTop: '1.5rem',
          padding: '0.65rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <Smartphone size={14} style={{ color: activeTab === 'admin' ? '#ef4444' : '#34d399' }} />
          <span>Device UUID: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{deviceUuid}</strong></span>
        </div>

        {/* Student Password Reset / Edit Modal */}
        {showResetModal && (
          <div className="modal-backdrop" style={{ zIndex: 1200 }}>
            <div className="modal-card" style={{ maxWidth: '480px', width: '92%' }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}>
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                      Edit Student Password
                    </h3>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                      Reset your login password using registered credentials
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.6rem' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetStudentPassword}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {resetError && (
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
                      <AlertCircle size={15} /> {resetError}
                    </div>
                  )}

                  {resetSuccess && (
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
                      <CheckCircle2 size={15} /> {resetSuccess}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      1. Student USN (University Seat Number) *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 1RG21CS001"
                      value={resetUsn}
                      onChange={(e) => setResetUsn(e.target.value.toUpperCase())}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      2. Registered Phone Number OR Email *
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="Registered 10-digit mobile or email ID"
                      value={resetCredential}
                      onChange={(e) => setResetCredential(e.target.value)}
                    />
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Security check: Must match the mobile number or email ID on your student record.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>
                        3. New Password *
                      </label>
                      <span
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        style={{ fontSize: '0.7rem', color: '#34d399', cursor: 'pointer', userSelect: 'none' }}
                      >
                        {showResetNewPassword ? 'Hide' : 'Show'}
                      </span>
                    </div>
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      className="form-input"
                      placeholder="Enter new student password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      4. Confirm New Password *
                    </label>
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      className="form-input"
                      placeholder="Confirm new student password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="btn btn-secondary btn-sm"
                    disabled={resetLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      borderColor: '#10b981',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {resetLoading ? (
                      <>
                        <RefreshCw size={13} className="spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
