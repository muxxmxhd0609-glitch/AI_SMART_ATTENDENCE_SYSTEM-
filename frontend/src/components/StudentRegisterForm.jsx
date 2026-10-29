import React, { useState, useRef, useEffect } from 'react';
import {
  User, CheckCircle, XCircle, Camera, Upload, AlertCircle, ArrowLeft,
  Sparkles, ShieldCheck, RefreshCw, FileText, Check, Phone, Mail, Award,
  HelpCircle, Eye, Info, Clock, AlertTriangle, Building
} from 'lucide-react';
import { api } from '../services/api';
import { 
  RGIT_BE_COURSES, getDeptCode, getDeptHodInfo, formatRGITUsn, RGIT_USN_PREFIX, 
  isValidEmail, cleanPhoneDigits, validatePhoneNumber, COUNTRY_CODE_OPTIONS,
  getDeptBranchCode, buildRGITUsn, parseRGITUsn, validateRGITUsn
} from '../constants/courses';
import USNInput from './USNInput';

export default function StudentRegisterForm({ 
  onBackToLogin, 
  initialSection = 'A', 
  initialSemester = 1,
  initialDepartment = 'B.E in Computer Science and Engineering'
}) {
  const [activeTab, setActiveTab] = useState('register'); // 'register' | 'status'

  // Form State - Department selected first, USN credentials auto-filled from branch
  const [department, setDepartment] = useState(initialDepartment || 'B.E in Computer Science and Engineering');
  const [admitYear, setAdmitYear] = useState('24');
  const [rollNumber, setRollNumber] = useState('409');
  const [usn, setUsn] = useState(() => buildRGITUsn('24', getDeptBranchCode(initialDepartment || 'B.E in Computer Science and Engineering'), '409'));
  const [fullName, setFullName] = useState('');
  const [semester, setSemester] = useState(initialSemester || 1);
  const [section, setSection] = useState(initialSection || 'A');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Resolved HOD and department code
  const currentDeptCode = getDeptCode(department);
  const currentBranchCode = getDeptBranchCode(department);
  const targetHod = getDeptHodInfo(department);

  // Department selection handler: automatically fills department branch code into USN
  const handleDepartmentChange = (newDept) => {
    setDepartment(newDept);
    const newBranch = getDeptBranchCode(newDept);
    const updatedUsn = buildRGITUsn(admitYear, newBranch, rollNumber);
    setUsn(updatedUsn);
  };

  // Admission Year handler (2 digits, e.g. 24)
  const handleYearChange = (val) => {
    const cleanY = cleanPhoneDigits(val).slice(0, 2);
    setAdmitYear(cleanY);
    setUsn(buildRGITUsn(cleanY, currentBranchCode, rollNumber));
  };

  // Roll Number handler (3 digits, e.g. 409)
  const handleRollChange = (val) => {
    const cleanR = cleanPhoneDigits(val).slice(0, 3);
    setRollNumber(cleanR);
    setUsn(buildRGITUsn(admitYear, currentBranchCode, cleanR));
  };

  // Direct USN typing handler (strictly max 10 chars, uppercase alphanumeric)
  const handleUsnDirectChange = (val) => {
    const formatted = formatRGITUsn(val);
    setUsn(formatted);
    const parsed = parseRGITUsn(formatted);
    if (parsed.year) setAdmitYear(parsed.year);
    if (parsed.roll) setRollNumber(parsed.roll);
  };

  // Photo state
  const [photoBase64, setPhotoBase64] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoMode, setPhotoMode] = useState('upload'); // 'upload' | 'camera'
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Status check state
  const [lookupUsn, setLookupUsn] = useState('1RG24CS409');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Submission UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCamRef = useRef(null);

  // Parse URL query params if any (e.g. ?section=A&semester=7)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const secParam = params.get('section');
    if (secParam) setSection(secParam.toUpperCase());
    const semParam = params.get('semester');
    if (semParam) setSemester(parseInt(semParam));
  }, []);

  // Handle Photo File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG or PNG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setPhotoBase64(b64);
      setPhotoPreview(b64);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Start Live Webcam for Passport Selfie
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Mobile browser blocks live streaming over local HTTP. Tap "📱 Phone Camera" to snap your selfie directly.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 640 },
          facingMode: 'user'
        }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      setErrorMsg('Live camera unavailable: ' + (err.message || 'Permission denied. Tap "📱 Phone Camera" below.'));
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Snapshot from Webcam
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.92);
    setPhotoBase64(b64);
    setPhotoPreview(b64);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Submit Self-Registration Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict 10-Character USN validation matching Department & College credentials
    const usnCheck = validateRGITUsn(usn, department);
    if (!usnCheck.valid) {
      setErrorMsg(usnCheck.error);
      return;
    }
    const cleanUsn = usnCheck.usn;

    if (!fullName.trim()) {
      setErrorMsg('Full name is required as per RGIT college records.');
      return;
    }

    // Strict 10-digit mobile phone number validation
    const phoneCheck = validatePhoneNumber(phone, countryCode);
    if (!phoneCheck.valid) {
      setErrorMsg(phoneCheck.error);
      return;
    }

    // Strict Email ID validation
    if (!email.trim()) {
      setErrorMsg('Student Email ID is mandatory.');
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address matching standard credentials (e.g. name@gmail.com or name@rgit.ac.in).');
      return;
    }

    if (!photoBase64) {
      setErrorMsg('Please upload or capture a clear passport-size photo for facial biometric enrollment.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.submitStudentRegistration({
        usn: cleanUsn,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: `${countryCode} ${phoneCheck.digits}`,
        department,
        semester: parseInt(semester),
        section,
        password: password.trim() || undefined,
        photo_base64: photoBase64
      });

      setSuccessData({
        usn: cleanUsn,
        fullName: fullName.trim(),
        department,
        semester: parseInt(semester),
        section,
        targetHod,
        currentDeptCode,
        message: res.message
      });
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Lookup Status by USN
  const handleLookupStatus = async (e) => {
    e.preventDefault();
    const lookupCheck = validateRGITUsn(lookupUsn);
    if (!lookupCheck.valid) {
      setLookupResult({
        status: 'ERROR',
        message: lookupCheck.error
      });
      return;
    }
    const cleanLookup = lookupCheck.usn;

    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await api.checkRegistrationStatus(cleanLookup);
      setLookupResult(res);
    } catch (err) {
      const isNetworkError = err.message === 'Failed to fetch' || err.message?.includes('NetworkError') || err.message?.includes('ERR_CONNECTION');
      setLookupResult({
        status: 'ERROR',
        message: isNetworkError
          ? '⚠️ Cannot reach the server. Make sure the backend is running on port 8000 and try again.'
          : (err.message || 'Failed to check status. Please try again.')
      });
    } finally {
      setLookupLoading(false);
    }
  };


  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      padding: '1.5rem 1rem'
    }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '1.75rem',
        marginBottom: '1.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 138, 0.25) 100%)'
      }}>
        {/* Top return button */}
        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="btn btn-secondary btn-sm"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        )}

        <div style={{
          display: 'inline-flex',
          padding: '0.6rem',
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.2)',
          color: '#60a5fa',
          marginBottom: '0.75rem'
        }}>
          <ShieldCheck size={32} />
        </div>

        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.35rem' }}>
          RGIT Student Biometric Admission Enrollment
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
          Rajiv Gandhi Institute of Technology, Bangalore • All 9 B.E Engineering Departments
        </p>

        {/* Form Mode Selector */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '1.25rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`btn btn-sm ${activeTab === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <FileText size={14} /> Self-Registration Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`btn btn-sm ${activeTab === 'status' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Clock size={14} /> Check Application Status
          </button>
        </div>
      </div>

      {/* TAB 1: SELF-REGISTRATION FORM */}
      {activeTab === 'register' && (
        <>
          {successData ? (
            /* Success confirmation card */
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle size={36} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginBottom: '0.5rem' }}>
                Registration Submitted Successfully!
              </h2>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Your details and biometric passport photo have been submitted for <strong>{successData.fullName}</strong> ({successData.usn}) in <strong>{successData.department} • Semester {successData.semester}, Section {successData.section}</strong>.
              </p>

              <div className="glass-panel" style={{
                padding: '1.1rem',
                textAlign: 'left',
                background: 'rgba(15, 23, 42, 0.7)',
                marginBottom: '1.5rem',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                border: '1.5px solid rgba(168, 85, 247, 0.35)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: '#c084fc', fontWeight: 700 }}>
                  <Building size={18} /> Department HOD Verification Process
                </div>
                <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li>Your application is assigned exclusively to <strong>{successData.targetHod?.name || 'Department HOD'} ({successData.currentDeptCode} HOD)</strong> for verification.</li>
                  <li><strong>Authority Rule:</strong> Only the Head of Department for <strong>{successData.currentDeptCode}</strong> can accept or reject this student registration.</li>
                  <li>Once accepted by your HOD, your 128-dimensional facial embedding is enrolled and you can immediately log in with your USN (<strong>{successData.usn}</strong>).</li>
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setLookupUsn(successData.usn);
                    setActiveTab('status');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Clock size={14} /> Track My Status
                </button>
                {onBackToLogin && (
                  <button
                    onClick={onBackToLogin}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    Go to Login Screen
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Active Form */
            <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '1.75rem' }}>
              {/* Instructions banner */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                marginBottom: '1.5rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)'
              }}>
                <Info size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#93c5fd' }}>Instructor Verification & Single Registration Rule:</strong>
                  <br />
                  Students may register only once. Multiple or proxy submissions for the same USN or mobile number will be automatically blocked. Please provide a clear, front-facing passport-style photo.
                </div>
              </div>

              {/* Error Banner */}
              {errorMsg && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  color: '#fca5a5'
                }}>
                  <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* SECTION 1: DEPARTMENT SELECTION FIRST & USN CREDENTIALS */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} style={{ color: 'var(--accent-blue)' }} /> 1. Department Selection &amp; University Credentials
              </h3>

              {/* STEP 1: SELECT DEPARTMENT FIRST */}
              <div style={{
                padding: '1.15rem',
                background: 'rgba(30, 41, 59, 0.45)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(59, 130, 246, 0.35)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: '#f8fafc' }}>
                    Step 1: Choose Your RGIT Department / Branch *
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    Auto-fills Branch Code: {currentBranchCode}
                  </span>
                </div>

                <div className="grid-3" style={{ gap: '0.85rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <select
                      className="form-select"
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      {RGIT_BE_COURSES.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.name} ({c.code} &bull; Code: {getDeptBranchCode(c.name)})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                      Selecting your department automatically fills the 2-letter branch code (<strong style={{ color: '#38bdf8' }}>{currentBranchCode}</strong>) into your 10-digit USN credentials.
                    </span>
                  </div>

                  <div>
                    <select
                      className="form-select"
                      value={semester}
                      onChange={(e) => setSemester(parseInt(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 2: USN CREDENTIALS (1RG FIX, 2-DIGIT YEAR, 2-LETTER DEPT AUTO-FILLED, 3-DIGIT ROLL) */}
              <div style={{
                padding: '1.15rem',
                background: 'rgba(15, 23, 42, 0.55)',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0, fontWeight: 700, color: '#f8fafc' }}>
                    Step 2: University Seat Number (USN) Credentials *
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    color: usn.length === 10 ? '#34d399' : '#fbbf24',
                    background: usn.length === 10 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 191, 36, 0.12)',
                    border: usn.length === 10 ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)'
                  }}>
                    Length: {usn.length}/10 {usn.length === 10 ? '✓ (Exact VTU Credentials)' : '(10 Digits/Chars Only)'}
                  </span>
                </div>

                <USNInput
                  value={usn}
                  onChange={(newUsn) => handleUsnDirectChange(newUsn)}
                  department={department}
                  size="large"
                  showHelpText={true}
                />
              </div>

              {/* Full Name & Section */}
              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Full Name (as per RGIT Records) *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Mohammed Muzammil"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">Class Section *</label>
                  <select
                    className="form-select"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                  </select>
                </div>
              </div>

              {/* Designated Department HOD Verification Notice Box */}
              <div style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(59, 130, 246, 0.1) 100%)',
                border: '1.5px solid rgba(168, 85, 247, 0.4)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.15)'
              }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
                      Exclusive Department Authority
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.25)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {currentDeptCode} • Semester {semester}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                    {targetHod.name} — Head of Department ({targetHod.code || currentDeptCode})
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
                    Upon form submission, your application will be routed strictly to the <strong>{currentDeptCode} Department HOD ({targetHod.name})</strong> for Semester {semester}. Only this department's HOD can accept or reject your admission.
                  </div>
                </div>
              </div>

              {/* SECTION 2: CONTACT & SECURITY */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} style={{ color: 'var(--accent-blue)' }} /> 2. Mobile Number & Login Credentials
              </h3>

              <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Student Mobile Phone Number *</label>
                    <span style={{ fontSize: '0.68rem', color: countryCode === '+91' && phone.length === 10 ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {countryCode === '+91' ? 'India: 10 Digits Only' : `${countryCode} Mobile`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-select"
                      value={countryCode}
                      onChange={(e) => {
                        setCountryCode(e.target.value);
                        setPhone('');
                      }}
                      style={{ width: '125px', flexShrink: 0, fontWeight: 600 }}
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
                      className="form-input"
                      placeholder={countryCode === '+91' ? '10-digit number (e.g. 9876543210)' : 'Phone number digits'}
                      maxLength={countryCode === '+91' ? 10 : 15}
                      value={phone}
                      onChange={(e) => {
                        // Strictly numbers only - reject all alphabets and symbols
                        const maxL = countryCode === '+91' ? 10 : 15;
                        const digitsOnly = cleanPhoneDigits(e.target.value).slice(0, maxL);
                        setPhone(digitsOnly);
                      }}
                      style={{ flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', fontWeight: 600 }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: countryCode === '+91' ? (phone.length === 10 ? '#34d399' : phone.length > 0 ? '#fbbf24' : 'var(--text-muted)') : 'var(--text-muted)' }}>
                    {countryCode === '+91'
                      ? `Mandatory 10 digits only (${phone.length}/10 digits entered). Used for official notifications.`
                      : `Used for WhatsApp/SMS notifications and duplicate account prevention.`}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Student Email ID *</label>
                    <span style={{ fontSize: '0.68rem', color: email && isValidEmail(email) ? '#34d399' : '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {email && isValidEmail(email) ? 'Valid Email Format' : 'name@domain.com'}
                    </span>
                  </div>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. student@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
                  />
                  <span style={{ fontSize: '0.72rem', color: email && !isValidEmail(email) ? '#f87171' : 'var(--text-muted)' }}>
                    {email && !isValidEmail(email)
                      ? '⚠️ Invalid email format. Must match credentials e.g. name@gmail.com'
                      : 'Personal or student email (e.g. Gmail, Yahoo, etc.).'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Choose Account Password *</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  placeholder="Set your login password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Set a secure password for portal access, or leave blank to authenticate via USN.
                </span>
              </div>

              {/* SECTION 3: PASSPORT PHOTO UPLOAD / LIVE CAPTURE */}
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={16} style={{ color: 'var(--accent-blue)' }} /> 3. Clear Passport Size Photo (For Biometric AI)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                The facial recognition engine will extract a 128-dimensional embedding from this photo. It must be clear, well-lit, and front-facing.
              </p>

              {/* Hidden Native File Input for Mobile Camera */}
              <input
                ref={mobileCamRef}
                type="file"
                accept="image/*"
                capture="user"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              {/* Photo Mode Toggle */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => mobileCamRef.current?.click()}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                >
                  <Camera size={14} /> 📱 Snap Photo with Phone Camera
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setPhotoMode('upload');
                  }}
                  className={`btn btn-sm ${photoMode === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Upload size={14} /> Upload Image File
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMode('camera');
                    startCamera();
                  }}
                  className={`btn btn-sm ${photoMode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Camera size={14} /> Live Stream
                </button>
              </div>

              {/* Upload Mode Area */}
              {photoMode === 'upload' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(59, 130, 246, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(15, 23, 42, 0.4)',
                    marginBottom: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem auto'
                  }}>
                    <Upload size={24} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.25rem' }}>
                    Click or Drag to Upload Passport Photo
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supported formats: JPG, PNG (Max 8MB) • Direct phone camera upload supported
                  </div>
                </div>
              )}

              {/* Live Camera Mode Area */}
              {photoMode === 'camera' && (
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '360px',
                  margin: '0 auto 1rem auto',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#000000',
                  border: '2px solid rgba(59, 130, 246, 0.5)'
                }}>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '320px',
                      objectFit: 'cover',
                      display: isCameraActive ? 'block' : 'none'
                    }}
                  />

                  {/* Passport Oval Guide Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '180px',
                    height: '230px',
                    border: '2px dashed #60a5fa',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    {isCameraActive ? (
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="btn btn-primary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Camera size={14} /> Snap Photo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startCamera}
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RefreshCw size={14} /> Turn Camera On
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Preview & Quality Check */}
              {photoPreview && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '1.5rem'
                }}>
                  <img
                    src={photoPreview}
                    alt="Passport Preview"
                    style={{
                      width: '80px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-sm)',
                      border: '2px solid #34d399'
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontWeight: 600, fontSize: '0.88rem' }}>
                      <CheckCircle size={16} /> Passport Photo Attached
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
                      Ready for biometric validation. Ensure your face is centered and fully visible.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoBase64(null);
                        setPhotoPreview(null);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', marginTop: '0.25rem' }}
                    >
                      Change Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Passport Photo Requirements Checklist */}
              <div style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid var(--glass-border)',
                marginBottom: '1.5rem',
                fontSize: '0.76rem',
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Biometric Acceptance Guidelines:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                    <Check size={13} /> Plain light background
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34d399' }}>
                    <Check size={13} /> Direct front-facing gaze
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                    <XCircle size={13} /> No sunglasses, caps, or masks
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}>
                    <XCircle size={13} /> No multiple persons visible
                  </div>
                </div>
              </div>

              {/* Form Action Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  borderColor: '#10b981',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" />
                    <span>Verifying Photo & Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Submit Admission Application to {currentDeptCode} HOD ({targetHod.name})</span>
                  </>
                )}
              </button>
            </form>
          )}
        </>
      )}

      {/* TAB 2: APPLICATION STATUS CHECKER */}
      {activeTab === 'status' && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} style={{ color: 'var(--accent-blue)' }} /> Track Registration Verification Status
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Enter your University Seat Number (USN) below to check if your instructor has approved your biometric account.
          </p>

          <form onSubmit={handleLookupStatus} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input
              type="text"
              required
              maxLength={10}
              className="form-input"
              placeholder="Enter 10-digit USN (e.g. 1RG24CS409)"
              style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em' }}
              value={lookupUsn}
              onChange={(e) => setLookupUsn(formatRGITUsn(e.target.value))}
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="btn btn-primary"
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              {lookupLoading ? <RefreshCw size={15} className="spin" /> : <Eye size={15} />}
              <span>Check Status</span>
            </button>
          </form>

          {/* Status Result Card */}
          {lookupResult && (
            <div className="glass-panel" style={{
              padding: '1.25rem',
              border: `1px solid ${
                lookupResult.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.4)' :
                lookupResult.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.4)' :
                lookupResult.status === 'PENDING' ? 'rgba(234, 179, 8, 0.4)' :
                'var(--glass-border)'
              }`,
              background: 'rgba(15, 23, 42, 0.7)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  USN: {lookupResult.usn}
                </span>
                <span className={`badge ${
                  lookupResult.status === 'APPROVED' ? 'badge-success' :
                  lookupResult.status === 'REJECTED' ? 'badge-danger' :
                  lookupResult.status === 'PENDING' ? 'badge-warning' :
                  'badge-info'
                }`}>
                  {lookupResult.status}
                </span>
              </div>

              {lookupResult.full_name && (
                <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Student: {lookupResult.full_name}
                </div>
              )}

              {lookupResult.department && (
                <div style={{ fontSize: '0.78rem', color: '#c084fc', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Building size={14} />
                  <span>{lookupResult.department} • Semester {lookupResult.semester || 1} (Sec {lookupResult.section || 'A'})</span>
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                {lookupResult.message}
              </p>

              {lookupResult.verified_by && (
                <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.6rem', fontWeight: 600 }}>
                  Decided By: {lookupResult.verified_by}
                </div>
              )}

              {lookupResult.status === 'REJECTED' && lookupResult.rejection_reason && (
                <div style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '0.8rem',
                  color: '#fca5a5',
                  marginBottom: '0.75rem'
                }}>
                  <strong>Department HOD Decision Note:</strong> {lookupResult.rejection_reason}
                </div>
              )}

              {lookupResult.status === 'APPROVED' && onBackToLogin && (
                <button
                  onClick={onBackToLogin}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  Proceed to Sign In
                </button>
              )}

              {lookupResult.status === 'REJECTED' && (
                <button
                  onClick={() => {
                    setUsn(lookupResult.usn);
                    setActiveTab('register');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <RefreshCw size={13} /> Re-Submit with Clear Photo
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
