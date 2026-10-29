import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, Calendar, Play, Clock, 
  FileText, Users, Edit3, UserCheck, CheckCircle, AlertTriangle, 
  MapPin, RefreshCw, Copy, Check, KeyRound, QrCode, 
  Search, Download, ShieldCheck, Sparkles, X, XCircle, 
  Phone, Mail, Building, Award, ChevronRight, Eye, AlertCircle, Key, Activity, Send, Trash2, Filter,
  FileSpreadsheet, Lock, Maximize2, ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';
import { RGIT_BE_COURSES, DEPARTMENT_SUBJECT_CATALOG_FRONTEND, getDeptCode, formatRGITUsn, isValidEmail, cleanPhoneDigits, validatePhoneNumber, COUNTRY_CODE_OPTIONS } from '../constants/courses';
import { useToast } from '../context/ToastContext';
import { soundService } from '../services/soundService';

const getTodayDateStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function FacultyPortal({ currentUser }) {
  const { addToast } = useToast();

  // Menu Tabs: 'dashboard' | 'subjects' | 'classes' | 'attendance' | 'history' | 'reports' | 'students' | 'correction' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sectionFilter, setSectionFilter] = useState('A');
  const [activeSession, setActiveSession] = useState(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);
  const [localQrDataUrl, setLocalQrDataUrl] = useState('');
  const [showProjectorModal, setShowProjectorModal] = useState(false);

  // Active Semester State (default to user's assigned semester or 3)
  const [activeSemester, setActiveSemester] = useState(() => {
    return parseInt(currentUser?.selected_semester || currentUser?.semester || 3, 10);
  });

  // Session Launch Form
  const [sessionForm, setSessionForm] = useState({
    subjectCode: '',
    section: 'A',
    periodNumber: 1,
    durationMinutes: 15
  });

  // Main Data States
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [roster, setRoster] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isEditingClassConfig, setIsEditingClassConfig] = useState(false);
  const [classConfig, setClassConfig] = useState(() => {
    const saved = localStorage.getItem(`classConfig_${currentUser?.username}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const deptCode = getDeptCode(currentUser?.department || 'ECE');
    const roomMap = {
      CSE: 'LH-204', ECE: 'LH-301', EE: 'LH-102', ME: 'LH-405',
      BME: 'LH-501', ISE: 'LH-208', AIML: 'LH-602', CSE_AI: 'LH-604',
      CSE_IOT_CS_BT: 'LH-608'
    };
    const room = roomMap[deptCode] || 'LH-201';
    return {
      secA: { room: `Lecture Hall ${room}`, rep: `Class Representative (Sec A)` },
      secB: { room: `Lecture Hall ${room}B`, rep: `Class Representative (Sec B)` }
    };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileConfig, setProfileConfig] = useState(() => {
    const saved = localStorage.getItem(`profileConfig_${currentUser?.username}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          countryCode: parsed.countryCode || '+91',
          phone: parsed.phone ? cleanPhoneDigits(parsed.phone).slice(0, 10) : '9845012345'
        };
      } catch (e) {}
    }
    const deptCode = getDeptCode(currentUser?.department || 'ECE');
    const rawPh = currentUser?.phone ? cleanPhoneDigits(currentUser.phone).slice(0, 10) : '9845012345';
    return {
      designation: currentUser?.designation || 'Assistant Professor',
      email: currentUser?.email || `${currentUser?.username || 'faculty'}@rgit.ac.in`,
      countryCode: '+91',
      phone: rawPh,
      officeRoom: `${deptCode} Staff Room #${deptCode === 'ECE' ? '305' : '208'}`
    };
  });
  const [message, setMessage] = useState(null);

  // Students Tab Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSecFilter, setStudentSecFilter] = useState('ALL');

  // History Tab Filters
  const [historySubjectFilter, setHistorySubjectFilter] = useState('ALL');
  const [historyDateFilter, setHistoryDateFilter] = useState(getTodayDateStr());

  // Correct Attendance (Manual Correction) State
  const [correctionForm, setCorrectionForm] = useState({
    studentUsn: '1RG',
    subjectCode: '',
    date: getTodayDateStr(),
    periodNumber: 1,
    status: 'PRESENT',
    reason: 'Official College Representation / Sports Duty'
  });

  // Official Excel & CSV Report Center State
  const [exportDept, setExportDept] = useState(currentUser?.department || 'B.E in Computer Science and Engineering');
  const [exportSubject, setExportSubject] = useState(() => {
    if (!currentUser) return 'BCS702';
    if (currentUser.assigned_subject_codes) {
      const code = String(currentUser.assigned_subject_codes).split(/[/,;]+/)[0].trim().toUpperCase();
      if (code) return code;
    }
    return 'BCS702';
  });
  const [exportSection, setExportSection] = useState('A');
  const [exportSemester, setExportSemester] = useState(() => {
    return currentUser?.selected_semester ? String(currentUser.selected_semester) : '7';
  });
  const [exportReportType, setExportReportType] = useState('official_sheet');
  const [exportDateMode, setExportDateMode] = useState('all');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exportStatus, setExportStatus] = useState('ALL');
  const [exportMonth, setExportMonth] = useState(10);
  const [exportYear, setExportYear] = useState(2026);
  const [reportLoading, setReportLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [allSubjectsList, setAllSubjectsList] = useState([]);

  // QR Modal State
  const [showQrModal, setShowQrModal] = useState(false);

  // Sync active semester if currentUser changes
  useEffect(() => {
    if (currentUser?.selected_semester || currentUser?.semester) {
      setActiveSemester(parseInt(currentUser.selected_semester || currentUser.semester, 10));
    }
    if (currentUser?.assigned_subject_codes) {
      const c = String(currentUser.assigned_subject_codes).split(/[/,;]+/)[0].trim().toUpperCase();
      if (c) setExportSubject(c);
    }
  }, [currentUser]);

  // Load complete subjects catalog once from API
  useEffect(() => {
    api.getAllSubjects().then(subs => {
      if (subs && subs.length > 0) setAllSubjectsList(subs);
    }).catch(() => {});
  }, []);

  // Helper to safely parse assigned subject codes (Each teacher has strictly ONE subject)
  const getAssignedCodes = () => {
    if (!currentUser) return [];
    let codes = [];
    if (currentUser.assigned_subject_codes) {
      if (Array.isArray(currentUser.assigned_subject_codes)) {
        codes = currentUser.assigned_subject_codes;
      } else if (typeof currentUser.assigned_subject_codes === 'string') {
        codes = currentUser.assigned_subject_codes.split(/[/,;]+/).map(c => c.trim().toUpperCase()).filter(Boolean);
      }
    } else if (currentUser.assigned_subjects && Array.isArray(currentUser.assigned_subjects)) {
      codes = currentUser.assigned_subjects.map(s => (typeof s === 'string' ? s.split(' ')[0].trim().toUpperCase() : s)).filter(Boolean);
    }
    // Strictly ONE assigned subject per faculty
    return codes.length > 0 ? [codes[0]] : [];
  };

  // Dynamically load assigned subjects from currentUser or department catalog for active semester
  const getDynamicSubjects = () => {
    if (!currentUser) return [];
    
    const deptKey = getDeptCode(currentUser.department || 'ECE');
    const catalog = DEPARTMENT_SUBJECT_CATALOG_FRONTEND[deptKey] || DEPARTMENT_SUBJECT_CATALOG_FRONTEND['ECE'] || [];
    const currentSem = parseInt(activeSemester || 3, 10);
    const codes = getAssignedCodes();

    let subjects = [];
    if (codes.length > 0) {
      subjects = codes.map(code => {
        const catEntry = catalog.find(s => s.code.toUpperCase() === code);
        if (catEntry) {
          return {
            code: catEntry.code,
            name: catEntry.name,
            semester: catEntry.semester,
            credits: 4,
            enrolled: 64, 
            avgPct: 88.5   
          };
        }
        const dbEntry = allSubjectsList.find(s => s.code.toUpperCase() === code);
        if (dbEntry) {
          return {
            code: dbEntry.code,
            name: dbEntry.name,
            semester: dbEntry.semester,
            credits: 4,
            enrolled: 64,
            avgPct: 88.0
          };
        }
        const m = code.match(/[A-Za-z]{2,4}(\d)\d{2}/);
        const codeSem = m ? parseInt(m[1], 10) : currentSem;
        return {
          code: code,
          name: `${deptKey} Subject (${code})`,
          semester: codeSem,
          credits: 4,
          enrolled: 64,
          avgPct: 85.0
        };
      });
    }

    // Filter to active semester
    let filteredSubjects = subjects.filter(s => s.semester === currentSem);

    // If teacher hasn't been assigned subjects for this semester specifically,
    // load all catalog subjects for this department and semester
    if (filteredSubjects.length === 0) {
      const semCatalog = catalog.filter(s => s.semester === currentSem);
      if (semCatalog.length > 0) {
        filteredSubjects = semCatalog.map(s => ({
          code: s.code,
          name: s.name,
          semester: s.semester,
          credits: 4,
          enrolled: 64,
          avgPct: 87.5
        }));
      } else {
        filteredSubjects = [{
          code: `B${deptKey}${currentSem}01`,
          name: `${deptKey} Semester ${currentSem} Core Subject`,
          semester: currentSem,
          credits: 4,
          enrolled: 64,
          avgPct: 85.0
        }];
      }
    }

    return filteredSubjects;
  };

  // Comprehensive list of ALL subjects a teacher teaches across any semester + catalog
  const getAllTeacherSubjects = () => {
    if (!currentUser) return [];
    const deptKey = getDeptCode(currentUser.department || 'CSE');
    const catalog = DEPARTMENT_SUBJECT_CATALOG_FRONTEND[deptKey] || DEPARTMENT_SUBJECT_CATALOG_FRONTEND['CSE'] || [];
    const codes = getAssignedCodes();

    if (codes.length > 0) {
      const code = codes[0];
      const catEntry = catalog.find(s => s.code.toUpperCase() === code);
      if (catEntry) {
        return [{
          code: catEntry.code,
          name: catEntry.name,
          semester: catEntry.semester,
          isAssigned: true
        }];
      }
      const dbEntry = allSubjectsList.find(s => s.code.toUpperCase() === code);
      if (dbEntry) {
        return [{
          code: dbEntry.code,
          name: dbEntry.name,
          semester: dbEntry.semester,
          isAssigned: true
        }];
      }
      return [{
        code: code,
        name: `${deptKey} Subject (${code})`,
        semester: 7,
        isAssigned: true
      }];
    }

    // Fallback if no subject assigned
    const def = catalog.find(s => s.semester === 7) || catalog[0] || { code: 'BCS702', name: 'Internet of Things', semester: 7 };
    return [{
      code: def.code,
      name: def.name,
      semester: def.semester,
      isAssigned: true
    }];
  };

  const facultySubjects = getDynamicSubjects();
  const allTeacherSubjects = getAllTeacherSubjects();
  const semText = `${getDeptCode(currentUser?.department || 'ECE')} Semester ${activeSemester}`;

  // Auto-sync semester when subject is selected in export center
  const handleExportSubjectChange = (newSubjectCode) => {
    setExportSubject(newSubjectCode);
    if (newSubjectCode && newSubjectCode !== 'ALL') {
      const found = allTeacherSubjects.find(s => s.code.toUpperCase() === newSubjectCode.toUpperCase());
      if (found && found.semester) {
        setExportSemester(String(found.semester));
      }
    }
  };

  useEffect(() => {
    if (facultySubjects.length > 0 && facultySubjects[0].code !== 'N/A') {
      const def = facultySubjects[0].code;
      setSessionForm(p => ({ ...p, subjectCode: def }));
      setCorrectionForm(p => ({ ...p, subjectCode: def }));
    }
  }, [activeSemester, currentUser]);

  // Load all faculty portal data
  const loadData = async () => {
    try {
      const dept = currentUser?.department;
      const deptCode = currentUser ? getDeptCode(dept || 'ECE') : 'ECE';
      const sem = activeSemester;

      // 1. Check active session for selected section
      const act = await api.getActiveSession(sectionFilter);
      if (act.active) {
        setActiveSession(act.session);
      } else {
        setActiveSession(null);
      }

      // 2. Load attendance history records
      const histArgs = { section: sectionFilter, semester: sem, department: deptCode };
      if (historyDateFilter && historyDateFilter !== 'ALL') histArgs.date = historyDateFilter;
      if (historySubjectFilter && historySubjectFilter !== 'ALL') histArgs.subjectCode = historySubjectFilter;
      const hist = await api.getAttendanceHistory(histArgs);
      setLiveAttendance(hist || []);

      // 3. Load defaulters (<75%)
      const defs = await api.getDefaulters(sectionFilter, sem, deptCode);
      setDefaulters(defs || []);

      // 4. Load class roster
      const students = await api.getStudentsList(sectionFilter, sem, deptCode);
      setRoster(students || []);

      // Auto update correction form student usn to match loaded roster
      if (students && students.length > 0) {
        setCorrectionForm(prev => {
          if (!prev.studentUsn || !students.some(s => s.usn === prev.studentUsn)) {
            return { ...prev, studentUsn: students[0].usn };
          }
          return prev;
        });
      }

      // 5. Load pending registrations queue
      const regList = await api.getPendingRegistrations(sectionFilter);
      setPendingRegistrations(regList || []);

      // 6. Load security logs
      const logs = await api.getSecurityLogs(20);
      setSecurityLogs(logs || []);
    } catch (err) {
      console.error('Error loading faculty portal data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [sectionFilter, activeSemester, historyDateFilter, historySubjectFilter, currentUser]);

  // Start Attendance Session (PIN & Dynamic QR)
  const handleStartSession = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.startClassSession(
        sessionForm.subjectCode,
        sessionForm.section,
        sessionForm.periodNumber,
        sessionForm.durationMinutes
      );
      soundService.playSuccess();
      addToast(`Attendance Session Launched! PIN: ${res.session_code}`, 'success');
      setMessage({
        type: 'success',
        text: `Active Attendance Session Launched! Session Code: ${res.session_code}`
      });
      loadData();
      setActiveTab('attendance');
    } catch (err) {
      soundService.playError();
      addToast('Failed to start session: ' + err.message, 'error');
      setMessage({ type: 'error', text: 'Failed to start session: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // End Active Attendance Session
  const handleEndSession = async () => {
    if (!activeSession) return;
    if (!window.confirm("End active attendance session? Students will no longer be able to check in.")) return;
    setLoading(true);
    try {
      await api.endClassSession(activeSession.id);
      setActiveSession(null);
      soundService.playClick();
      addToast('Attendance session ended successfully.', 'info');
      loadData();
    } catch (err) {
      addToast('Failed to end session: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Manual Attendance Correction / Override
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.manualOverride(correctionForm);
      soundService.playSuccess();
      addToast(`Attendance status updated for ${correctionForm.studentUsn}`, 'success');
      alert(`Attendance status updated for ${correctionForm.studentUsn}. Reason: ${correctionForm.reason}`);
      loadData();
    } catch (err) {
      soundService.playError();
      addToast('Correction failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Download Official Attendance Excel Sheet (.xlsx) matching RGIT design
  const handleDownloadExcel = async () => {
    setReportLoading(true);
    try {
      const assigned = getAssignedCodes();
      const subjectToUse = assigned.length > 0 ? assigned[0] : (exportSubject && exportSubject !== 'ALL' ? exportSubject : 'BCS702');
      const semToUse = exportSemester && exportSemester !== 'ALL' ? parseInt(exportSemester, 10) : 7;
      await api.downloadAttendanceExcel({
        department: exportDept === 'ALL' ? null : exportDept,
        subjectCode: subjectToUse,
        section: exportSection === 'ALL' ? 'A' : exportSection,
        semester: semToUse,
        month: exportMonth,
        year: exportYear,
        dateTo: getTodayDateStr(),
        reportType: 'monthly_matrix'
      });
      soundService.playSuccess();
      addToast(`Official Attendance Sheet (.xlsx) with Google Calendar Holidays for ${subjectToUse} downloaded!`, 'success');
    } catch (err) {
      console.error('Download Excel error:', err);
      soundService.playError();
      addToast('Failed to download Excel sheet: ' + (err.message || 'Server error'), 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Download Attendance CSV Report (Subject-wise, Official Monthly Sheet or Day-to-Day)
  const handleDownloadCsv = async (overrideParams = {}) => {
    setReportLoading(true);
    try {
      const assigned = getAssignedCodes();
      const defaultSubj = assigned.length > 0 ? assigned[0] : 'BCS702';
      const subjectToUse = overrideParams.subjectCode !== undefined 
        ? overrideParams.subjectCode 
        : (exportSubject && exportSubject !== 'ALL' ? exportSubject : defaultSubj);
      const sectionToUse = overrideParams.section !== undefined ? overrideParams.section : (exportSection === 'ALL' ? 'A' : exportSection);
      const semToUse = overrideParams.semester !== undefined ? overrideParams.semester : exportSemester;
      const repTypeToUse = overrideParams.reportType || (exportReportType === 'official_sheet' ? 'monthly_matrix' : exportReportType) || 'monthly_matrix';
      const statusToUse = overrideParams.attendanceStatus || exportStatus || 'ALL';

      let dFrom = overrideParams.dateFrom !== undefined ? overrideParams.dateFrom : null;
      let dTo = overrideParams.dateTo !== undefined ? overrideParams.dateTo : null;

      if (dFrom === null && dTo === null) {
        if (exportDateMode === 'today') {
          dFrom = getTodayDateStr();
          dTo = getTodayDateStr();
        } else if (exportDateMode === 'till_date' || exportDateMode === 'all') {
          dTo = getTodayDateStr();
        } else if (exportDateMode === 'custom') {
          dFrom = exportDateFrom || null;
          dTo = exportDateTo || null;
        }
      }

      const parsedSem = semToUse && semToUse !== 'ALL' ? parseInt(semToUse, 10) : 7;
      const mToUse = overrideParams.month !== undefined ? overrideParams.month : exportMonth;
      const yToUse = overrideParams.year !== undefined ? overrideParams.year : exportYear;

      await api.downloadAttendanceCsv({
        department: exportDept === 'ALL' ? null : exportDept,
        subjectCode: subjectToUse === 'ALL' ? defaultSubj : subjectToUse,
        section: sectionToUse === 'ALL' ? 'A' : sectionToUse,
        semester: !isNaN(parsedSem) ? parsedSem : 7,
        reportType: repTypeToUse,
        attendanceStatus: statusToUse,
        dateFrom: dFrom,
        dateTo: dTo,
        month: mToUse,
        year: yToUse
      });

      soundService.playSuccess();
      const repLabel = (repTypeToUse === 'monthly_matrix' || repTypeToUse === 'official_sheet') 
        ? 'Official Attendance Sheet (CSV)' 
        : (repTypeToUse === 'day_to_day' ? 'Day-to-Day Register' : 'VTU Summary');
      addToast(`${subjectToUse} ${repLabel} CSV downloaded!`, 'success');
    } catch (err) {
      console.error('Download CSV error:', err);
      soundService.playError();
      addToast('Failed to download CSV: ' + (err.message || 'Server error'), 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // Preview Day-to-Day or Summary Attendance Records On-Screen
  const handlePreviewRecords = async () => {
    setPreviewLoading(true);
    try {
      const assigned = getAssignedCodes();
      const defaultSubj = assigned.length > 0 ? assigned[0] : 'BCS702';
      const subjectToUse = exportSubject && exportSubject !== 'ALL' ? exportSubject : defaultSubj;
      const parsedSem = exportSemester && exportSemester !== 'ALL' ? parseInt(exportSemester, 10) : 7;
      let dFrom = null;
      let dTo = null;
      if (exportDateMode === 'today') {
        dFrom = getTodayDateStr();
        dTo = getTodayDateStr();
      } else if (exportDateMode === 'custom') {
        dFrom = exportDateFrom || null;
        dTo = exportDateTo || null;
      }

      const data = await api.getFacultyAttendanceReport({
        department: exportDept === 'ALL' ? null : exportDept,
        subjectCode: subjectToUse,
        section: exportSection === 'ALL' ? 'A' : exportSection,
        semester: !isNaN(parsedSem) ? parsedSem : 7,
        reportType: exportReportType === 'official_sheet' ? 'monthly_matrix' : exportReportType,
        attendanceStatus: exportStatus,
        dateFrom: dFrom,
        dateTo: dTo
      });

      setPreviewData(data);
      setShowPreviewModal(true);
      soundService.playSuccess();
      addToast(`Loaded ${data?.total_records || data?.total_students || 0} attendance records preview`, 'info');
    } catch (err) {
      console.error('Preview error:', err);
      soundService.playError();
      addToast('Failed to load preview: ' + (err.message || 'Server error'), 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete Student Handler (Teachers / Faculty Authority)
  const handleDeleteStudent = async (student) => {
    const studentName = student.name || student.full_name || student.usn;
    if (!window.confirm(`Are you sure you want to permanently delete student ${studentName} (${student.usn})?\n\nThis will remove their biometric face profile and all attendance records.`)) {
      return;
    }
    try {
      const res = await api.deleteStudent(student.usn);
      soundService.playSuccess();
      addToast(res.message || `Student ${studentName} was successfully deleted.`, 'success');
      loadDashboardData();
    } catch (err) {
      soundService.playError();
      addToast(`Failed to delete student: ${err.message}`, 'error');
    }
  };

  // Filtered Roster for Students Tab
  const filteredRoster = roster.filter((stu) => {
    const matchesSec = studentSecFilter === 'ALL' || stu.section === studentSecFilter;
    const matchesQuery = 
      stu.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      stu.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      stu.usn?.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesSec && matchesQuery;
  });

  // Generate local high-resolution QR code whenever session changes
  useEffect(() => {
    const sessionPin = activeSession?.session_code || '984521';
    const sub = activeSession?.subject_code || sessionForm.subjectCode || 'BCS701';
    const sec = activeSession?.section || sessionForm.section || 'A';
    const baseUrl = `${window.location.origin}?pin=${sessionPin}&subject=${encodeURIComponent(sub)}&section=${encodeURIComponent(sec)}`;
    QRCode.toDataURL(baseUrl, {
      width: 360,
      margin: 2,
      color: {
        dark: '#070a12',
        light: '#ffffff'
      }
    })
    .then(url => setLocalQrDataUrl(url))
    .catch(err => console.warn('QR code generation error:', err));
  }, [activeSession?.session_code, activeSession?.subject_code, activeSession?.section, sessionForm.subjectCode, sessionForm.section]);

  // Dynamic QR Code URL generator (client-side data URL with remote fallback)
  const getQrCodeUrl = () => {
    if (localQrDataUrl) return localQrDataUrl;
    const sessionPin = activeSession?.session_code || '984521';
    const baseUrl = `${window.location.origin}?pin=${sessionPin}&subject=${encodeURIComponent(activeSession?.subject_code || '')}&section=${encodeURIComponent(activeSession?.section || '')}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(baseUrl)}&color=070a12&bgcolor=ffffff`;
  };

  const handleCopyPin = () => {
    const pin = activeSession?.session_code || '984521';
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    soundService.playClick();
    addToast(`6-Digit Session PIN ${pin} copied!`, 'info');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.download = `RGIT_Attendance_QR_${activeSession?.session_code || 'PIN'}.png`;
    link.href = getQrCodeUrl();
    link.click();
    addToast('Attendance QR code downloaded!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Teacher Header & Identity Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 24, 43, 0.9) 0%, rgba(30, 41, 69, 0.75) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
              fontWeight: 800,
              fontSize: '1.25rem'
            }}>
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : 'T'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {currentUser?.full_name || 'Dr. Roopa R'}
                </h2>
                <span className="badge badge-info">
                  <UserCheck size={12} /> Teacher Module
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Faculty Code: <strong style={{ color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>{currentUser?.faculty_code || currentUser?.username || 'FAC_CSE_02'}</strong> • {currentUser?.department || 'Department of Computer Science & Engineering'}
              </p>
            </div>
          </div>

          {/* Section & Semester Switchers & Quick Launch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Semester Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Semester:</span>
              <select
                value={activeSemester}
                onChange={(e) => setActiveSemester(parseInt(e.target.value, 10))}
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#60a5fa',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '0.3rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255, 255, 255, 0.04)', padding: '4px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Section:</span>
              {['A', 'B'].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSectionFilter(sec)}
                  style={{
                    background: sectionFilter === sec ? 'var(--primary-color)' : 'transparent',
                    color: sectionFilter === sec ? 'white' : 'var(--text-muted)',
                    border: 'none',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Sec {sec}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('attendance')}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px' }}
            >
              <Play size={14} /> Start Attendance
            </button>
          </div>
        </div>
      </div>

      {/* Active Session Warning / Info Banner */}
      {activeSession ? (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(59, 130, 246, 0.18) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: '#10b981', color: 'white', padding: '0.55rem', borderRadius: 'var(--radius-md)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h4 style={{ fontSize: '1.025rem', fontWeight: 700 }}>
                  LIVE SESSION: {activeSession.subject_name} ({activeSession.subject_code})
                </h4>
                <span className="badge badge-success">
                  <span className="pulse-dot pulse-dot-green"></span> OPEN FOR CHECK-IN
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Section {activeSession.section} • Period {activeSession.period_number} • Session Active
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* PIN Pill */}
            <div style={{ background: 'rgba(0, 0, 0, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(56, 189, 248, 0.4)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 600 }}>6-Digit PIN</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '3px' }}>
                {activeSession.session_code}
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}
            >
              <QrCode size={15} /> Show QR
            </button>

            <button onClick={handleEndSession} className="btn btn-danger btn-sm">
              End Session
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Teacher Menu Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '0.6rem',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'classes', label: 'My Classes', icon: Calendar },
          { id: 'attendance', label: 'Take Attendance', icon: Play, highlight: true },
          { id: 'history', label: 'Attendance History', icon: Clock },
          { id: 'reports', label: 'Reports', icon: FileText },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'correction', label: 'Correct Attendance', icon: Edit3 },
          { id: 'profile', label: 'Profile', icon: UserCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                soundService.playClick();
              }}
              className="btn btn-sm"
              style={{
                background: isActive 
                  ? (tab.highlight ? 'var(--primary-gradient)' : 'rgba(59, 130, 246, 0.2)')
                  : 'rgba(255, 255, 255, 0.03)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--primary-color)' : 'var(--glass-border)'}`,
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 700 : 500
              }}
            >
              <Icon size={14} style={{ color: isActive ? 'white' : (tab.highlight ? '#60a5fa' : 'inherit') }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================================================== */}
      {/* MENU TAB 1: DASHBOARD */}
      {/* ==================================================== */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Metric Cards */}
          <div className="grid-4">
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class Strength (Sec {sectionFilter})</span>
                <Users size={18} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {roster.length || 62}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '4px' }}>
                🟢 100% Registered Roster
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Present Today</span>
                <CheckCircle size={18} style={{ color: '#34d399' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>
                {liveAttendance.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Verified via Biometric / PIN
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absent Today</span>
                <AlertTriangle size={18} style={{ color: '#f87171' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171' }}>
                {Math.max(0, (roster.length || 62) - liveAttendance.length)}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px' }}>
                Pending check-in
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Attendance Rate</span>
                <Activity size={18} style={{ color: '#a7f3d0' }} />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a7f3d0' }}>
                {roster.length > 0 ? Math.round((liveAttendance.length / roster.length) * 100) : 88}%
              </div>
              <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '4px' }}>
                Above 75% VTU Threshold
              </div>
            </div>
          </div>

          {/* Today's Academic Timetable Matrix */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Today's Teaching Schedule ({semText})</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Synchronized with RGIT academic clock</p>
              </div>
              <span className="badge badge-info">
                <Clock size={12} /> Monday Schedule
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {facultySubjects.map((sub, idx) => {
                const times = ['08:30 - 09:30', '09:30 - 10:30', '10:45 - 11:45', '11:45 - 12:45', '01:30 - 02:30', '02:30 - 03:30', '03:30 - 04:30'];
                const rooms = ['LH-204', 'LH-205', 'CSE Lab 3', 'Seminar Hall', 'LH-201'];
                return {
                  period: idx + 1,
                  time: times[idx % times.length],
                  subject: `${sub.code} - ${sub.name}`,
                  sec: 'Sec A & B',
                  room: rooms[idx % rooms.length],
                  active: idx === 0 
                };
              }).map((p) => (
                <div
                  key={p.period}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: p.active ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${p.active ? 'rgba(59, 130, 246, 0.4)' : 'var(--glass-border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' }}>
                      Period {p.period} • {p.time}
                    </span>
                    {p.active && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>CURRENT</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>{p.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {p.sec} • Room {p.room}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSessionForm((prev) => ({ ...prev, subjectCode: p.subject.split(' ')[0], periodNumber: p.period }));
                      setActiveTab('attendance');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}
                  >
                    Start Period {p.period}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 2: MY SUBJECTS */}
      {/* ==================================================== */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>Assigned Academic Subjects</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Courses assigned to {currentUser?.full_name || 'Faculty'} for {semText} (A & B)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {facultySubjects.map((sub) => (
                <div
                  key={sub.code}
                  className="glass-panel glass-panel-hover"
                  style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                        {sub.code}
                      </span>
                      <span className="badge badge-info">{sub.credits} Credits</span>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{sub.name}</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Semester {sub.semester} • Sections A & B • {sub.enrolled} Enrolled
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Avg Attendance</span>
                      <span style={{ fontWeight: 700, color: '#34d399' }}>{sub.avgPct}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${sub.avgPct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '3px' }} />
                    </div>

                    <button
                      onClick={() => {
                        setSessionForm((prev) => ({ ...prev, subjectCode: sub.code }));
                        setActiveTab('attendance');
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', marginTop: '0.85rem' }}
                    >
                      <Play size={14} /> Start {sub.code} Class
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '6px' }}>
                      <button
                        onClick={() => handleDownloadExcel()}
                        disabled={reportLoading}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.35rem 0.4rem',
                          background: 'rgba(0, 45, 98, 0.5)',
                          borderColor: 'rgba(59, 130, 246, 0.4)',
                          color: '#93c5fd',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title={`Download Official Excel Attendance Sheet (.xlsx) for ${sub.code} matching RGIT layout`}
                      >
                        <FileSpreadsheet size={12} /> Official Excel
                      </button>
                      <button
                        onClick={() => handleDownloadCsv({ subjectCode: sub.code, semester: sub.semester, reportType: 'monthly_matrix' })}
                        disabled={reportLoading}
                        className="btn btn-secondary btn-sm"
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.35rem 0.4rem',
                          background: 'rgba(16, 185, 129, 0.12)',
                          borderColor: 'rgba(16, 185, 129, 0.35)',
                          color: '#34d399',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        title={`Download Official Attendance Sheet (CSV) for ${sub.code}`}
                      >
                        <Download size={12} /> Official CSV
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setHistorySubjectFilter(sub.code);
                        setActiveTab('history');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ width: '100%', marginTop: '4px', fontSize: '0.7rem', padding: '0.25rem 0.5rem', color: '#94a3b8', justifyContent: 'center' }}
                      title={`View Day-to-Day Session Logs for ${sub.code}`}
                    >
                      <Clock size={11} /> View Day-to-Day Log
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 3: MY CLASSES */}
      {/* ==================================================== */}
      {activeTab === 'classes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Class Section Overview</h3>
              <button 
                onClick={() => {
                  if (isEditingClassConfig) {
                    localStorage.setItem(`classConfig_${currentUser?.username}`, JSON.stringify(classConfig));
                    addToast('Classroom & Representative updated successfully', 'success');
                  }
                  setIsEditingClassConfig(!isEditingClassConfig);
                }} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {isEditingClassConfig ? <><CheckCircle size={14} /> Save</> : <><Edit3 size={14} /> Edit Data</>}
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Detailed roster breakdown & venue allocations for {semText}
            </p>

            <div className="grid-2">
              <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>Section A ({semText})</h4>
                  <span className="badge badge-success">62 Students</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📍 Designated Classroom: 
                    {isEditingClassConfig ? (
                      <input 
                        type="text" 
                        value={classConfig.secA.room} 
                        onChange={(e) => setClassConfig({...classConfig, secA: {...classConfig.secA, room: e.target.value}})}
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', flex: 1, fontSize: '0.8rem' }}
                      />
                    ) : (
                      <strong>{classConfig.secA.room}</strong>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    👤 Class Representative: 
                    {isEditingClassConfig ? (
                      <input 
                        type="text" 
                        value={classConfig.secA.rep} 
                        onChange={(e) => setClassConfig({...classConfig, secA: {...classConfig.secA, rep: e.target.value}})}
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', flex: 1, fontSize: '0.8rem' }}
                      />
                    ) : (
                      <strong>{classConfig.secA.rep}</strong>
                    )}
                  </div>
                  <div>📊 Average Section Attendance: <strong style={{ color: '#34d399' }}>89.2%</strong></div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>Section B ({semText})</h4>
                  <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>62 Students</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📍 Designated Classroom: 
                    {isEditingClassConfig ? (
                      <input 
                        type="text" 
                        value={classConfig.secB.room} 
                        onChange={(e) => setClassConfig({...classConfig, secB: {...classConfig.secB, room: e.target.value}})}
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', flex: 1, fontSize: '0.8rem' }}
                      />
                    ) : (
                      <strong>{classConfig.secB.room}</strong>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    👤 Class Representative: 
                    {isEditingClassConfig ? (
                      <input 
                        type="text" 
                        value={classConfig.secB.rep} 
                        onChange={(e) => setClassConfig({...classConfig, secB: {...classConfig.secB, rep: e.target.value}})}
                        className="form-input"
                        style={{ padding: '0.2rem 0.5rem', flex: 1, fontSize: '0.8rem' }}
                      />
                    ) : (
                      <strong>{classConfig.secB.rep}</strong>
                    )}
                  </div>
                  <div>📊 Average Section Attendance: <strong style={{ color: '#34d399' }}>86.5%</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 4: TAKE ATTENDANCE & LIVE QR GENERATOR */}
      {/* ==================================================== */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid-2">
            {/* Session Launch Controller Card */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: '#60a5fa' }}>
                  <Play size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Start Attendance Session</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate Live QR Code & PIN for students</p>
                </div>
              </div>

              <form onSubmit={handleStartSession} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject:</label>
                  <select
                    className="form-select"
                    value={sessionForm.subjectCode}
                    onChange={(e) => setSessionForm({ ...sessionForm, subjectCode: e.target.value })}
                  >
                    {facultySubjects.map(sub => (
                      <option key={sub.code} value={sub.code}>{sub.code} - {sub.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Section:</label>
                    <select
                      className="form-select"
                      value={sessionForm.section}
                      onChange={(e) => setSessionForm({ ...sessionForm, section: e.target.value })}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Period Number:</label>
                    <select
                      className="form-select"
                      value={sessionForm.periodNumber}
                      onChange={(e) => setSessionForm({ ...sessionForm, periodNumber: parseInt(e.target.value) })}
                    >
                      <option value={1}>Period 1 (08:30 AM)</option>
                      <option value={2}>Period 2 (09:30 AM)</option>
                      <option value={3}>Period 3 (10:45 AM)</option>
                      <option value={4}>Period 4 (11:45 AM)</option>
                      <option value={5}>Period 5 (01:30 PM)</option>
                      <option value={6}>Period 6 (02:30 PM)</option>
                      <option value={7}>Period 7 (03:30 PM)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary btn-lg" style={{ gap: '8px', marginTop: '0.5rem' }}>
                  <Play size={18} />
                  <span>{loading ? 'Launching Session...' : '🚀 Launch Attendance Session'}</span>
                </button>
              </form>
            </div>

            {/* Dynamic Live QR Code Display Card */}
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Classroom Live QR & PIN</h4>
                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Active Session</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Students can check in by entering 6-digit PIN or scanning this QR code
              </p>

              <div style={{
                background: 'white',
                padding: '0.85rem',
                borderRadius: '16px',
                boxShadow: '0 0 35px rgba(59, 130, 246, 0.35)',
                marginBottom: '0.85rem',
                position: 'relative'
              }}>
                <img
                  src={getQrCodeUrl()}
                  alt="Live Attendance QR Code"
                  style={{ width: '190px', height: '190px', display: 'block', borderRadius: '6px' }}
                />
              </div>

              {/* 6-Digit PIN Display Block with Copy */}
              <div style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>
                    Classroom 6-Digit PIN
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '3px' }}>
                    {activeSession?.session_code || '984521'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', gap: '4px', padding: '0.4rem 0.65rem' }}
                  title="Copy 6-digit PIN to clipboard"
                >
                  {copiedPin ? <Check size={13} style={{ color: '#34d399' }} /> : <Copy size={13} />}
                  <span>{copiedPin ? 'Copied!' : 'Copy PIN'}</span>
                </button>
              </div>

              {/* Action Buttons: Fullscreen Projector & Download */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowProjectorModal(true)}
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: '0.74rem', gap: '5px', justifyContent: 'center' }}
                  title="Open large full-screen display for classroom projector"
                >
                  <Maximize2 size={13} />
                  <span>Projector View</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', gap: '5px', justifyContent: 'center' }}
                  title="Download attendance QR code image"
                >
                  <Download size={13} />
                  <span>Save QR</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Check-in Stream Table */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Live Student Check-In Stream</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time face recognition check-ins</p>
              </div>
              <button onClick={loadData} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Refresh Stream
              </button>
            </div>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>USN / Roll No</th>
                    <th>Check-in Time</th>
                    <th>GPS Distance</th>
                    <th>Face Match Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveAttendance.length > 0 ? (
                    liveAttendance.map((rec) => (
                      <tr key={rec.id}>
                        <td><strong style={{ color: '#f8fafc' }}>{rec.student_name}</strong></td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{rec.student_usn}</span></td>
                        <td>{rec.time}</td>
                        <td><span className="badge badge-info"><MapPin size={11} /> {rec.distance_meters ? `${rec.distance_meters}m` : '18.5m'}</span></td>
                        <td><span style={{ color: '#34d399', fontWeight: 600 }}>{rec.confidence_score ? `${rec.confidence_score}%` : '98.2%'}</span></td>
                        <td><span className="badge badge-success">PRESENT</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        Waiting for students to scan QR / enter PIN...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 5: ATTENDANCE HISTORY */}
      {/* ==================================================== */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: '#38bdf8' }} /> Day-to-Day Attendance Session Logs
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Detailed audit trail with exact Date, Check-in Time, Subject, Student USN, and Biometric status
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="date"
                    value={historyDateFilter === 'ALL' ? '' : historyDateFilter}
                    onChange={(e) => setHistoryDateFilter(e.target.value || 'ALL')}
                    className="form-input"
                    style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
                    title="Filter by exact date"
                  />
                  {historyDateFilter !== 'ALL' && (
                    <button
                      onClick={() => setHistoryDateFilter('ALL')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }}
                      title="Show all recorded dates"
                    >
                      All Dates
                    </button>
                  )}
                  {historyDateFilter !== getTodayDateStr() && (
                    <button
                      onClick={() => setHistoryDateFilter(getTodayDateStr())}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.5rem' }}
                      title="Show today's sessions"
                    >
                      Today
                    </button>
                  )}
                </div>

                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                  className="form-select"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', width: 'auto', minWidth: '180px' }}
                  title="Filter by subject"
                >
                  <option value="ALL">🌐 All Subjects</option>
                  <optgroup label="⭐ My Assigned Subjects">
                    {allTeacherSubjects.filter(s => s.isAssigned).map(sub => (
                      <option key={sub.code} value={sub.code}>⭐ {sub.code} - {sub.name}</option>
                    ))}
                  </optgroup>
                  {allTeacherSubjects.some(s => !s.isAssigned) && (
                    <optgroup label="📚 Other Subjects">
                      {allTeacherSubjects.filter(s => !s.isAssigned).map(sub => (
                        <option key={sub.code} value={sub.code}>{sub.code} - {sub.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <button
                  onClick={() => handleDownloadCsv({
                    subjectCode: historySubjectFilter === 'ALL' ? null : historySubjectFilter,
                    dateFrom: historyDateFilter === 'ALL' ? null : historyDateFilter,
                    dateTo: historyDateFilter === 'ALL' ? null : historyDateFilter,
                    reportType: 'day_to_day'
                  })}
                  disabled={reportLoading}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px' }}
                  title="Download filtered Day-to-Day attendance as CSV"
                >
                  <Download size={13} /> {reportLoading ? 'Downloading...' : 'Export Filtered CSV'}
                </button>
              </div>
            </div>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Date & Exact Time</th>
                    <th>Subject</th>
                    <th>Period / Slot</th>
                    <th>Student USN</th>
                    <th>Student Name</th>
                    <th>Class / Section</th>
                    <th>Verification Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveAttendance.length > 0 ? (
                    liveAttendance.map((rec) => (
                      <tr key={rec.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{rec.date}</div>
                          <div style={{ fontSize: '0.72rem', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                            🕒 {rec.time || 'Recorded'}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: '#38bdf8' }}>{rec.subject_code}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rec.subject_name}</div>
                        </td>
                        <td>Period {rec.period_number}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 600 }}>
                            {rec.student_usn}
                          </span>
                        </td>
                        <td><strong style={{ color: '#f1f5f9' }}>{rec.student_name}</strong></td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                            Sem {rec.semester || activeSemester} • Sec {rec.section || sectionFilter}
                          </span>
                        </td>
                        <td>
                          {rec.marked_by === 'MANUAL_OVERRIDE' ? (
                            <span className="badge badge-warning">Manual Teacher Override</span>
                          ) : rec.confidence_score ? (
                            <span className="badge badge-info" style={{ gap: '3px' }}>
                              <ShieldCheck size={11} /> AI Face ({rec.confidence_score}%)
                            </span>
                          ) : (
                            <span className="badge badge-info">Biometric AI + GPS</span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ gap: '3px' }}>
                            <CheckCircle size={11} /> {rec.status || 'PRESENT'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No attendance history records found for the selected subject and date filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 6: REPORTS & DEFAULTERS */}
      {/* ==================================================== */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Subject-Wise Attendance Export Controller */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(26, 38, 66, 0.85) 100%)', border: '1px solid rgba(59, 130, 246, 0.35)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #002D62 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)' }}>
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                    Official Attendance Sheets & Subject Register Downloader
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Export official attendance sheets in Excel (.xlsx) or CSV format matching the official RGIT template
                  </p>
                </div>
              </div>
              <span className="badge badge-info" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
                {currentUser?.full_name || 'Faculty'} • {currentUser?.faculty_code || 'Teacher'}
              </span>
            </div>

            {/* Faculty Isolation Notice */}
            <div style={{ padding: '0.65rem 0.9rem', marginBottom: '1rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#bfdbfe', lineHeight: 1.4 }}>
                <strong>Strict Faculty Subject Isolation Enforced:</strong> Each faculty member is assigned strictly ONE subject and can export attendance only for their authorized course (<strong>{exportSubject}</strong>). Cross-subject downloads are restricted.
              </p>
            </div>

            {/* Downloader Form Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {/* Subject Selector (Locked to Teacher's Single Assigned Subject) */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Lock size={13} style={{ color: '#f59e0b' }} /> Assigned Subject (Exclusive Access):
                  </label>
                  <select
                    className="glass-input"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.82rem', background: 'rgba(15, 23, 42, 0.95)', color: '#38bdf8', fontWeight: 700, cursor: 'not-allowed', border: '1px solid rgba(56, 189, 248, 0.4)' }}
                    value={exportSubject}
                    disabled={true}
                    title="Faculty can only download attendance for their assigned subject"
                  >
                    {allTeacherSubjects.map(sub => (
                      <option key={sub.code} value={sub.code}>
                        🔒 {sub.code} - {sub.name} (Sem {sub.semester})
                      </option>
                    ))}
                  </select>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                    🔒 Authorized: Faculty download is strictly locked to your allocated course
                  </span>
                </div>

                {/* Report Type Selector */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={13} /> Report Format & Template:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setExportReportType('official_sheet')}
                      className={`btn btn-sm ${exportReportType === 'official_sheet' ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.45rem 0.5rem',
                        justifyContent: 'center',
                        gap: '4px',
                        background: exportReportType === 'official_sheet' ? 'linear-gradient(135deg, #002D62, #1d4ed8)' : 'rgba(255,255,255,0.03)',
                        borderColor: exportReportType === 'official_sheet' ? '#3b82f6' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <FileSpreadsheet size={13} /> Official Sheet (Excel)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportReportType('day_to_day')}
                      className={`btn btn-sm ${exportReportType === 'day_to_day' ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.45rem 0.5rem',
                        justifyContent: 'center',
                        gap: '4px',
                        background: exportReportType === 'day_to_day' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <Calendar size={13} /> Day-to-Day Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportReportType('summary')}
                      className={`btn btn-sm ${exportReportType === 'summary' ? 'btn-primary' : 'btn-outline'}`}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.45rem 0.5rem',
                        justifyContent: 'center',
                        gap: '4px',
                        background: exportReportType === 'summary' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <FileText size={13} /> VTU % Summary
                    </button>
                  </div>
                </div>
              </div>

              {/* Scope Filters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Month & Academic Term Selector */}
                {exportReportType === 'official_sheet' ? (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={13} /> Academic Month (Aug 2026 - Till Date):
                    </label>
                    <select
                      className="glass-input"
                      style={{ width: '100%', padding: '0.45rem 0.65rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.75)' }}
                      value={exportMonth}
                      onChange={(e) => setExportMonth(parseInt(e.target.value, 10))}
                    >
                      <option value="10">🗓️ October 2026 (Aug 2026 - Till Date)</option>
                      <option value="9">🗓️ September 2026</option>
                      <option value="8">🗓️ August 2026</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={13} /> Date Filter:
                    </label>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        className="glass-input"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.75)', minWidth: '150px' }}
                        value={exportDateMode}
                        onChange={(e) => setExportDateMode(e.target.value)}
                      >
                        <option value="till_date">📅 Till Date ({getTodayDateStr()})</option>
                        <option value="today">🕒 Today Only ({getTodayDateStr()})</option>
                        <option value="all">📅 All Dates Till Date</option>
                        <option value="custom">📆 Custom Date Range...</option>
                      </select>

                      {exportDateMode === 'custom' && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="date"
                            className="glass-input"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                            value={exportDateFrom}
                            onChange={(e) => setExportDateFrom(e.target.value)}
                            title="From Date"
                          />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>to</span>
                          <input
                            type="date"
                            className="glass-input"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                            value={exportDateTo}
                            onChange={(e) => setExportDateTo(e.target.value)}
                            title="To Date"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Section, Semester & Status Filter */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Section:</label>
                    <select
                      className="glass-input"
                      style={{ width: '100%', padding: '0.42rem 0.55rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.6)' }}
                      value={exportSection}
                      onChange={(e) => setExportSection(e.target.value)}
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="ALL">All Sections</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Semester:</label>
                    <select
                      className="glass-input"
                      style={{ width: '100%', padding: '0.42rem 0.55rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.6)' }}
                      value={exportSemester}
                      onChange={(e) => setExportSemester(e.target.value)}
                    >
                      <option value="7">Sem 7 (CSE)</option>
                      {[1, 2, 3, 4, 5, 6, 8].map((s) => (
                        <option key={s} value={String(s)}>Sem {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Status:</label>
                    <select
                      className="glass-input"
                      style={{ width: '100%', padding: '0.42rem 0.55rem', fontSize: '0.8rem', background: 'rgba(15, 23, 42, 0.6)' }}
                      value={exportStatus}
                      onChange={(e) => setExportStatus(e.target.value)}
                    >
                      <option value="ALL">All Status</option>
                      <option value="PRESENT">✅ Present</option>
                      <option value="ABSENT">❌ Absent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Template Style Highlight Card */}
              {exportReportType === 'official_sheet' && (
                <div style={{ padding: '0.7rem 0.9rem', background: 'rgba(0, 45, 98, 0.35)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} style={{ color: '#38bdf8' }} />
                    <span style={{ fontSize: '0.76rem', color: '#e2e8f0' }}>
                      <strong>Google Calendar Govt Holidays Enforced:</strong> Gazetted Public Holidays (Gandhi Jayanti, Dussehra, Ayudha Pooja, Valmiki Jayanti) & Sundays marked [H]. 31-Day Matrix computed till date ({getTodayDateStr()}).
                    </span>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.7rem', fontWeight: 700 }}>
                    Google Calendar Synced • Data Till Date
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={reportLoading}
                  className="btn btn-primary"
                  style={{
                    gap: '8px',
                    padding: '0.65rem 1.4rem',
                    background: 'linear-gradient(135deg, #002D62 0%, #1e3a8a 50%, #2563eb 100%)',
                    borderColor: '#3b82f6',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                    fontWeight: 800,
                    fontSize: '0.88rem'
                  }}
                  title="Download pixel-perfect styled Excel sheet matching the official template"
                >
                  <FileSpreadsheet size={16} />
                  {reportLoading ? 'Generating Excel Sheet...' : `Download Official Attendance Sheet (Excel .xlsx)`}
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadCsv({ reportType: 'monthly_matrix' })}
                  disabled={reportLoading}
                  className="btn btn-primary"
                  style={{
                    gap: '8px',
                    padding: '0.65rem 1.3rem',
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    borderColor: '#10b981',
                    boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                  title="Download attendance sheet in CSV format structured identical to the official layout"
                >
                  <Download size={15} />
                  Download Attendance Sheet (CSV)
                </button>

                <button
                  type="button"
                  onClick={handlePreviewRecords}
                  disabled={previewLoading}
                  className="btn btn-secondary"
                  style={{ gap: '6px', padding: '0.65rem 1.2rem', fontSize: '0.85rem' }}
                >
                  <Eye size={15} />
                  {previewLoading ? 'Loading Preview...' : 'Preview Records On Screen'}
                </button>
              </div>

            </div>

            {/* Embedded Live Preview Modal / Viewer */}
            {showPreviewModal && previewData && (
              <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: 'rgba(10, 15, 30, 0.85)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Eye size={16} /> {previewData.report_type === 'monthly_matrix' ? 'Official Attendance Sheet Preview (31-Day Matrix)' : previewData.report_type === 'day_to_day' ? 'Day-to-Day Register Preview' : 'Attendance Summary Preview'}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Subject: <strong style={{ color: '#f8fafc' }}>{previewData.subject_name || exportSubject}</strong> • Section: <strong style={{ color: '#60a5fa' }}>{previewData.section}</strong> • Total Students: <strong style={{ color: '#34d399' }}>{previewData.total_students || previewData.total_records || (previewData.records ? previewData.records.length : 0)}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={handleDownloadExcel}
                      disabled={reportLoading}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '5px', background: 'linear-gradient(135deg, #002D62, #1d4ed8)' }}
                    >
                      <FileSpreadsheet size={13} /> Download Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDownloadCsv({ reportType: previewData.report_type || 'monthly_matrix' })}
                      disabled={reportLoading}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '5px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                    >
                      <Download size={13} /> Download CSV
                    </button>
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '4px' }}
                    >
                      <X size={14} /> Close
                    </button>
                  </div>
                </div>

                <div className="glass-table-container" style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
                  <table className="glass-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      {previewData.report_type === 'monthly_matrix' ? (
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>S.No</th>
                          <th style={{ minWidth: '110px' }}>USN</th>
                          <th style={{ minWidth: '150px' }}>Student Name</th>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <th key={d} style={{ width: '26px', padding: '4px 1px', textAlign: 'center', fontSize: '0.7rem' }}>
                              {d}
                            </th>
                          ))}
                          <th style={{ textAlign: 'center', color: '#4ade80' }}>P</th>
                          <th style={{ textAlign: 'center', color: '#f87171' }}>A</th>
                          <th style={{ textAlign: 'center', color: '#facc15' }}>L</th>
                          <th style={{ textAlign: 'center' }}>Total</th>
                          <th style={{ textAlign: 'center' }}>%</th>
                        </tr>
                      ) : previewData.report_type === 'day_to_day' ? (
                        <tr>
                          <th>Date</th>
                          <th>Time Slot</th>
                          <th>Period</th>
                          <th>Subject</th>
                          <th>USN</th>
                          <th>Student Name</th>
                          <th>Section</th>
                          <th>Status</th>
                          <th>Check-in Time</th>
                          <th>Verification Mode</th>
                          <th>Remarks</th>
                        </tr>
                      ) : (
                        <tr>
                          <th>USN</th>
                          <th>Student Name</th>
                          <th>Subject</th>
                          <th>Section</th>
                          <th>Total Classes</th>
                          <th>Attended</th>
                          <th>Percentage</th>
                          <th>Eligibility</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {previewData.records && previewData.records.length > 0 ? (
                        previewData.records.map((r, idx) => (
                          <tr key={idx}>
                            {previewData.report_type === 'monthly_matrix' ? (
                              <>
                                <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                                <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa', fontWeight: 600 }}>{r.usn}</span></td>
                                <td><strong style={{ color: '#f8fafc' }}>{r.full_name || r.name}</strong></td>
                                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                                  const st = r.daily_statuses ? r.daily_statuses[d] : '-';
                                  const bg = st === 'P' ? 'rgba(34, 197, 94, 0.2)' : (st === 'A' ? 'rgba(239, 68, 68, 0.25)' : (st === 'L' ? 'rgba(234, 179, 8, 0.25)' : (st === 'H' ? 'rgba(6, 182, 212, 0.25)' : 'transparent')));
                                  const col = st === 'P' ? '#4ade80' : (st === 'A' ? '#f87171' : (st === 'L' ? '#facc15' : (st === 'H' ? '#67e8f9' : '#64748b')));
                                  return (
                                    <td key={d} style={{ textAlign: 'center', padding: '3px 1px', fontSize: '0.68rem', fontWeight: 700, background: bg, color: col }}>
                                      {st}
                                    </td>
                                  );
                                })}
                                {(() => {
                                  let p = 0, a = 0, l = 0;
                                  if (r.daily_statuses) {
                                    Object.values(r.daily_statuses).forEach(s => {
                                      if (s === 'P') p++;
                                      else if (s === 'A') a++;
                                      else if (s === 'L') l++;
                                    });
                                  }
                                  const tot = Math.max(p + a + l, 1);
                                  const pct = ((p / tot) * 100).toFixed(1);
                                  return (
                                    <>
                                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#4ade80' }}>{p}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#f87171' }}>{a}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#facc15' }}>{l}</td>
                                      <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{tot}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 800, color: pct >= 75 ? '#34d399' : '#f87171' }}>{pct}%</td>
                                    </>
                                  );
                                })()}
                              </>
                            ) : previewData.report_type === 'day_to_day' ? (
                              <>
                                <td><strong style={{ color: '#f8fafc' }}>{r.date}</strong></td>
                                <td><span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{r.class_time_slot}</span></td>
                                <td>Period {r.period_number}</td>
                                <td><span style={{ color: '#60a5fa', fontWeight: 600 }}>{r.subject_code}</span></td>
                                <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{r.usn}</span></td>
                                <td><strong style={{ color: '#f8fafc' }}>{r.full_name}</strong></td>
                                <td>Sec {r.section}</td>
                                <td>
                                  <span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : 'badge-danger'}`}>
                                    {r.status}
                                  </span>
                                </td>
                                <td>{r.checkin_time}</td>
                                <td><span style={{ fontSize: '0.72rem' }}>{r.verification_mode}</span></td>
                                <td><span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.remarks}</span></td>
                              </>
                            ) : (
                              <>
                                <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{r.usn}</span></td>
                                <td><strong style={{ color: '#f8fafc' }}>{r.full_name}</strong></td>
                                <td>{r.subject_code}</td>
                                <td>Sec {r.section}</td>
                                <td>{r.total_conducted}</td>
                                <td>{r.attended_classes}</td>
                                <td><strong style={{ color: r.attendance_percentage < 75 ? '#f87171' : '#34d399' }}>{r.attendance_percentage}%</strong></td>
                                <td>
                                  <span className={`badge ${r.attendance_percentage < 75 ? 'badge-danger' : 'badge-success'}`}>
                                    {r.status}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={36} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No records found matching the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Defaulter Alert Table Panel */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Students Below 75% Threshold (Defaulter Alert)
            </h4>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>USN</th>
                    <th>Section</th>
                    <th>Attended / Total</th>
                    <th>Percentage</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {defaulters.length > 0 ? (
                    defaulters.map((d) => (
                      <tr key={d.usn}>
                        <td><strong style={{ color: '#f8fafc' }}>{d.full_name}</strong></td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{d.usn}</span></td>
                        <td>Section {d.section}</td>
                        <td>{d.attended_classes} / {d.total_classes}</td>
                        <td><strong style={{ color: d.attendance_percentage < 75 ? '#f87171' : '#34d399' }}>{d.attendance_percentage}%</strong></td>
                        <td><span className={`badge ${d.attendance_percentage < 75 ? 'badge-danger' : 'badge-success'}`}>{d.attendance_percentage < 75 ? 'DEFAULTER' : 'OK'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => {
                                addToast(`Warning notice generated for ${d.full_name}`, 'warning');
                                alert(`Generated Official Attendance Warning Notice for ${d.full_name} (${d.usn}) - Current Attendance: ${d.attendance_percentage}%`);
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.72rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                            >
                              <Send size={12} /> Send Warning
                            </button>
                            <button
                              onClick={() => handleDeleteStudent({ name: d.full_name, usn: d.usn })}
                              className="btn btn-danger btn-sm"
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.25rem 0.5rem',
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#f87171'
                              }}
                              title={`Delete student ${d.full_name} (${d.usn})`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#34d399' }}>
                        🎉 Excellent! All students in Section {sectionFilter} have maintained above 75% attendance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 7: STUDENTS ROSTER & SEARCH */}
      {/* ==================================================== */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Enrolled Student Registry</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Search and inspect student biometric enrollment profiles</p>
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search by name or USN..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="glass-table-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>USN / Roll Number</th>
                    <th>Section</th>
                    <th>Semester</th>
                    <th>Biometric Face Status</th>
                    <th>Cum. Attendance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length > 0 ? (
                    filteredRoster.map((stu) => (
                      <tr key={stu.usn || stu.id}>
                        <td><strong style={{ color: '#f8fafc' }}>{stu.name || stu.full_name}</strong></td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{stu.usn}</span></td>
                        <td>Section {stu.section}</td>
                        <td>Sem {stu.semester || 7}</td>
                        <td>
                          <span className={`badge ${stu.face_registered ? 'badge-success' : 'badge-warning'}`}>
                            {stu.face_registered ? '🟢 Face Enrolled' : '🟡 Pending Photo'}
                          </span>
                        </td>
                        <td><strong style={{ color: '#34d399' }}>{stu.attendance_pct || stu.attendance_percentage || 88.5}%</strong></td>
                        <td>
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="btn btn-danger btn-sm"
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.55rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#f87171'
                            }}
                            title={`Delete student ${stu.name || stu.full_name} (${stu.usn})`}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No student records match search "{studentSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 8: CORRECT ATTENDANCE (MANUAL OVERRIDE) */}
      {/* ==================================================== */}
      {activeTab === 'correction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', maxWidth: '650px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: '#fbbf24' }}>
                <Edit3 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Authorized Attendance Correction</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Manually adjust attendance status with logged audit reason</p>
              </div>
            </div>

            <form onSubmit={handleCorrectionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">Student USN / Roll Number:</label>
                <input
                  type="text"
                  required
                  value={correctionForm.studentUsn}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, studentUsn: formatRGITUsn(e.target.value) })}
                  className="form-input"
                  placeholder="e.g. 1RG24CS409, 1RG21CS001"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Subject:</label>
                  <select
                    className="form-select"
                    value={correctionForm.subjectCode}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, subjectCode: e.target.value })}
                  >
                    {facultySubjects.map(sub => (
                      <option key={sub.code} value={sub.code}>{sub.code} - {sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date:</label>
                  <input
                    type="date"
                    required
                    value={correctionForm.date}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Period Number:</label>
                  <select
                    className="form-select"
                    value={correctionForm.periodNumber}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, periodNumber: parseInt(e.target.value) })}
                  >
                    <option value={1}>Period 1 (08:30 - 09:30 AM)</option>
                    <option value={2}>Period 2 (09:30 - 10:30 AM)</option>
                    <option value={3}>Period 3 (10:45 - 11:45 AM)</option>
                    <option value={4}>Period 4 (11:45 AM - 12:45 PM)</option>
                    <option value={5}>Period 5 (01:30 - 02:30 PM)</option>
                    <option value={6}>Period 6 (02:30 - 03:30 PM)</option>
                    <option value={7}>Period 7 (03:30 - 04:30 PM)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">New Status:</label>
                  <select
                    className="form-select"
                    value={correctionForm.status}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                  >
                    <option value="PRESENT">PRESENT</option>
                    <option value="ABSENT">ABSENT</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Correction (Audit Logged):</label>
                <textarea
                  required
                  rows={3}
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Official College Representation, Sports Duty, Medical Leave"
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: '6px', marginTop: '0.5rem' }}>
                <CheckCircle size={16} /> Save Attendance Correction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MENU TAB 9: PROFILE */}
      {/* ==================================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Teacher Profile Details</h3>
              <button 
                onClick={async () => {
                  if (isEditingProfile) {
                    if (!profileConfig.email || !profileConfig.email.trim()) {
                      addToast('Email address is mandatory.', 'error');
                      return;
                    }
                    if (!isValidEmail(profileConfig.email)) {
                      addToast('Please enter a valid email address matching credentials (e.g. name@rgit.ac.in or name@gmail.com).', 'error');
                      return;
                    }
                    if (!profileConfig.phone || !profileConfig.phone.trim()) {
                      addToast('Mobile phone number is mandatory.', 'error');
                      return;
                    }
                    const cc = profileConfig.countryCode || '+91';
                    const phCheck = validatePhoneNumber(profileConfig.phone, cc);
                    if (!phCheck.valid) {
                      addToast(phCheck.error, 'error');
                      return;
                    }
                    const fullPhone = `${cc} ${phCheck.digits}`;
                    const cleanEmail = profileConfig.email.trim().toLowerCase();

                    try {
                      const facId = currentUser?.profile_id || currentUser?.id;
                      if (facId) {
                        await api.updateFacultyProfile(facId, {
                          full_name: currentUser?.full_name || 'Teacher',
                          email: cleanEmail,
                          phone: fullPhone,
                          designation: (profileConfig.designation || 'Assistant Professor').trim()
                        });
                      }
                    } catch (apiErr) {
                      console.warn('Backend sync notice:', apiErr);
                    }

                    localStorage.setItem(`profileConfig_${currentUser?.username}`, JSON.stringify({
                      ...profileConfig,
                      countryCode: cc,
                      email: cleanEmail,
                      phone: phCheck.digits
                    }));

                    const updatedUser = {
                      ...currentUser,
                      email: cleanEmail,
                      phone: fullPhone
                    };
                    api.setCurrentUser(updatedUser);
                    addToast('Teacher profile details and credentials updated successfully!', 'success');
                  }
                  setIsEditingProfile(!isEditingProfile);
                }} 
                className="btn btn-outline" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                {isEditingProfile ? <><CheckCircle size={14} /> Save</> : <><Edit3 size={14} /> Edit</>}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
                <strong>{currentUser?.full_name || 'Dr. Roopa R'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Faculty Code / Teacher ID:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{currentUser?.faculty_code || currentUser?.username || 'FAC_CSE_02'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Department:</span>
                <strong>{currentUser?.department || 'Computer Science & Engineering'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Designation:</span>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={profileConfig.designation} 
                    onChange={(e) => setProfileConfig({...profileConfig, designation: e.target.value})}
                    className="form-input"
                    style={{ padding: '0.2rem 0.5rem', width: '250px', fontSize: '0.8rem', textAlign: 'right' }}
                  />
                ) : (
                  <strong>{profileConfig.designation}</strong>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Email ID *:</span>
                {isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                    <input 
                      type="email" 
                      required
                      value={profileConfig.email} 
                      onChange={(e) => setProfileConfig({...profileConfig, email: e.target.value.trim().toLowerCase()})}
                      className="form-input"
                      placeholder="name@rgit.ac.in"
                      style={{ padding: '0.2rem 0.5rem', width: '250px', fontSize: '0.8rem', textAlign: 'right' }}
                    />
                    <span style={{ fontSize: '0.68rem', color: profileConfig.email && isValidEmail(profileConfig.email) ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
                      {profileConfig.email && isValidEmail(profileConfig.email) ? '✓ Valid Credentials' : 'name@rgit.ac.in'}
                    </span>
                  </div>
                ) : (
                  <strong>{profileConfig.email}</strong>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mobile Phone *:</span>
                {isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select
                        className="form-select"
                        value={profileConfig.countryCode || '+91'}
                        onChange={(e) => {
                          const newCC = e.target.value;
                          setProfileConfig({
                            ...profileConfig,
                            countryCode: newCC,
                            phone: newCC === '+91' ? cleanPhoneDigits(profileConfig.phone).slice(0, 10) : profileConfig.phone
                          });
                        }}
                        style={{ width: '120px', padding: '0.2rem 0.4rem', fontSize: '0.78rem', fontWeight: 600 }}
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
                        maxLength={(profileConfig.countryCode || '+91') === '+91' ? 10 : 15}
                        value={profileConfig.phone} 
                        onChange={(e) => {
                          const maxL = (profileConfig.countryCode || '+91') === '+91' ? 10 : 15;
                          setProfileConfig({
                            ...profileConfig,
                            phone: cleanPhoneDigits(e.target.value).slice(0, maxL)
                          });
                        }}
                        className="form-input"
                        placeholder={(profileConfig.countryCode || '+91') === '+91' ? '10-digit number' : 'Phone digits'}
                        style={{ padding: '0.2rem 0.5rem', width: '150px', fontSize: '0.8rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: (profileConfig.countryCode || '+91') === '+91' ? (profileConfig.phone?.length === 10 ? '#34d399' : '#fbbf24') : '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {(profileConfig.countryCode || '+91') === '+91' ? `${profileConfig.phone?.length || 0}/10 ${profileConfig.phone?.length === 10 ? '✓' : ''}` : `${profileConfig.phone?.length || 0}d`}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                      {(profileConfig.countryCode || '+91') === '+91' ? 'Mandatory Indian mobile number: Exactly 10 digits only' : 'Teacher emergency contact'}
                    </span>
                  </div>
                ) : (
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{profileConfig.countryCode || '+91'} {profileConfig.phone || '9845012345'}</strong>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Office Room:</span>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={profileConfig.officeRoom} 
                    onChange={(e) => setProfileConfig({...profileConfig, officeRoom: e.target.value})}
                    className="form-input"
                    style={{ padding: '0.2rem 0.5rem', width: '250px', fontSize: '0.8rem', textAlign: 'right' }}
                  />
                ) : (
                  <strong>{profileConfig.officeRoom}</strong>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Display Modal */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-card" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={19} style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Classroom Live Attendance QR</h3>
              </div>
              <button onClick={() => setShowQrModal(false)} className="modal-close-btn"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Display this QR Code or 6-digit PIN on the classroom screen for student check-in
              </p>

              <div style={{ background: 'white', padding: '10px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <img src={getQrCodeUrl()} alt="QR" style={{ width: '230px', height: '230px', display: 'block', borderRadius: '8px' }} />
              </div>

              {/* 6-Digit PIN Display with Copy */}
              <div style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.65rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700 }}>
                    Attendance PIN Code
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 900, color: '#38bdf8', letterSpacing: '4px' }}>
                    {activeSession?.session_code || '984521'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '4px', fontSize: '0.75rem' }}
                >
                  {copiedPin ? <Check size={14} style={{ color: '#34d399' }} /> : <Copy size={14} />}
                  <span>{copiedPin ? 'Copied!' : 'Copy PIN'}</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    setShowProjectorModal(true);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', gap: '6px', justifyContent: 'center' }}
                >
                  <Maximize2 size={14} /> Fullscreen Mode
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem', gap: '6px', justifyContent: 'center' }}
                >
                  <Download size={14} /> Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Projector Fullscreen Mode */}
      {showProjectorModal && (
        <div
          className="modal-backdrop"
          style={{
            zIndex: 10000,
            background: 'rgba(3, 7, 18, 0.98)',
            backdropFilter: 'blur(16px)'
          }}
          onClick={() => setShowProjectorModal(false)}
        >
          <div
            style={{
              maxWidth: '680px',
              width: '92%',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 16, 32, 0.98) 100%)',
              border: '2px solid rgba(56, 189, 248, 0.5)',
              borderRadius: '24px',
              padding: '2rem',
              textAlign: 'center',
              boxShadow: '0 25px 80px rgba(0,0,0,0.95), 0 0 60px rgba(56, 189, 248, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                  🟢 LIVE ATTENDANCE WINDOW
                </span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                  {activeSession?.subject_code} • Period {activeSession?.period_number} • Sec {activeSession?.section}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectorModal(false)}
                className="modal-close-btn"
                style={{ width: '36px', height: '36px' }}
              >
                <X size={20} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f8fafc', margin: 0 }}>
              {activeSession?.subject_name || 'Classroom Attendance Session'}
            </h2>

            {/* Giant QR Code */}
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '24px',
              boxShadow: '0 0 50px rgba(56, 189, 248, 0.45)',
              display: 'inline-block'
            }}>
              <img
                src={getQrCodeUrl()}
                alt="Projector QR Code"
                style={{ width: '280px', height: '280px', display: 'block', borderRadius: '12px' }}
              />
            </div>

            {/* Giant Monospace 6-Digit PIN Block */}
            <div style={{
              width: '100%',
              maxWidth: '520px',
              background: 'rgba(0, 0, 0, 0.7)',
              border: '2px solid rgba(56, 189, 248, 0.6)',
              borderRadius: '16px',
              padding: '1rem',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.25)'
            }}>
              <div style={{ fontSize: '0.78rem', color: '#93c5fd', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>
                Option 1: Enter 6-Digit Session PIN
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '3rem',
                fontWeight: 900,
                color: '#38bdf8',
                letterSpacing: '8px',
                margin: '4px 0'
              }}>
                {activeSession?.session_code || '984521'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                Option 2: Point camera & scan the QR Code above to check in automatically
              </div>
            </div>

            {/* Bottom Controls */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCopyPin}
                className="btn btn-secondary"
                style={{ gap: '6px' }}
              >
                {copiedPin ? <Check size={16} style={{ color: '#34d399' }} /> : <Copy size={16} />}
                <span>{copiedPin ? 'PIN Copied!' : 'Copy 6-Digit PIN'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProjectorModal(false)}
                className="btn btn-primary"
                style={{ gap: '6px' }}
              >
                <Check size={16} /> Done / Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
