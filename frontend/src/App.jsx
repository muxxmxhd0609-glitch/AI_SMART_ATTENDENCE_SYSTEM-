import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentPortal from './components/StudentPortal';
import FacultyPortal from './components/FacultyPortal';
import AdminPortal from './components/AdminPortal';
import LoginModal from './components/LoginModal';
import StudentRegisterForm from './components/StudentRegisterForm';
import ThemeCustomizerModal, { applyTheme } from './components/ThemeCustomizerModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import FloatingSpeedDial from './components/FloatingSpeedDial';
import CampusRadarModal from './components/CampusRadarModal';
import NoticeBoardModal from './components/NoticeBoardModal';
import StudentIDCardModal from './components/StudentIDCardModal';
import AnalyticsChartsModal from './components/AnalyticsChartsModal';
import { ToastProvider } from './context/ToastContext';
import { getCurrentUser, api } from './services/api';
import { soundService } from './services/soundService';
import { Battery, Wifi, Signal } from 'lucide-react';

// React Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Error:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('rgit_user_data');
    localStorage.removeItem('rgit_auth_token');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: '#070a12',
          color: '#f8fafc',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            padding: '2.5rem',
            background: '#0d1322',
            borderRadius: '24px',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f87171', marginBottom: '0.75rem' }}>
              Application Session Recovered
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.75rem', lineHeight: '1.5' }}>
              {this.state.error?.message || 'A transient UI state error occurred. Click reset below to clear cached session and open the application.'}
            </p>
            <button
              onClick={this.handleReset}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                color: 'white',
                padding: '0.8rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              🔄 Reset Session & Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSemester, setRegisterSemester] = useState(1);
  const [registerDepartment, setRegisterDepartment] = useState('B.E in Electronics and Communication');

  // UI/UX Modal States
  const [isThemeCustomizerOpen, setIsThemeCustomizerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isNoticeBoardOpen, setIsNoticeBoardOpen] = useState(false);
  const [isIDCardOpen, setIsIDCardOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    // Apply saved theme on boot
    const activeTheme = localStorage.getItem('rgit_active_theme') || 'cyber-neon';
    applyTheme(activeTheme);

    // Check if URL has registration campaign parameter (?register=true or #/register)
    const params = new URLSearchParams(window.location.search);
    if (params.get('register') === 'true' || window.location.hash.includes('register')) {
      setIsRegistering(true);
      const semParam = params.get('semester');
      if (semParam) setRegisterSemester(parseInt(semParam));
      const deptParam = params.get('department') || params.get('dept');
      if (deptParam) setRegisterDepartment(deptParam);
    }

    // Capture scanned classroom attendance session PIN from teacher's QR code
    const pinParam = params.get('pin') || params.get('session_code') || params.get('code');
    if (pinParam && pinParam.trim().length === 6) {
      sessionStorage.setItem('rgit_scanned_pin', pinParam.trim().toUpperCase());
    }

    // Check existing stored session
    try {
      const user = getCurrentUser();
      if (user && user.role) {
        setCurrentUser(user);
      } else if (user) {
        // Default role fallback if missing
        user.role = 'student';
        setCurrentUser(user);
      }
    } catch (e) {
      localStorage.removeItem('rgit_user_data');
    }
    setLoading(false);
  }, []);

  // Global Keyboard Hotkey Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K -> Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      // Alt+M -> Toggle Mobile Frame View
      else if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMobileFrame((prev) => !prev);
        soundService.playClick();
      }
      // Alt+T -> Open Theme Studio
      else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsThemeCustomizerOpen((prev) => !prev);
        soundService.playClick();
      }
      // Alt+S -> Toggle Audio Sound
      else if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        soundService.toggleMute();
      }
      // Alt+R -> Open Campus Radar
      else if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsRadarOpen((prev) => !prev);
        soundService.playClick();
      }
      // ? Key -> Open Shortcuts Modal (when not typing in an input)
      else if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    soundService.playClick();
  };

  const handleSwitchRole = (targetRole) => {
    // Perform seamless demo role switch
    const mockUsers = {
      student: { id: 33, role: 'student', full_name: 'Mohammed Muzammil', roll_number: '1RG24CS409', usn: '1RG24CS409', department: 'B.E in Computer Science and Engineering', section: 'A', semester: 7, selected_semester: 7 },
      faculty: { id: 15, role: 'faculty', full_name: 'Prof. Bhagyashri Wakde', department: 'B.E in Computer Science and Engineering', faculty_code: 'bhagyashri', semester: 7, selected_semester: 7, assigned_subject_codes: ['BCS701', 'BCS702', 'BCS703'], assigned_subjects: ['BCS701 - Cloud Computing & Virtualization', 'BCS702 - Internet of Things (IoT)', 'BCS703 - Cryptography & Network Security'] },
      admin: { id: 1, role: 'hod', full_name: 'Dr. Arudra A (HOD CSE)', department: 'B.E in Computer Science and Engineering', username: 'hod_cse' }
    };
    if (mockUsers[targetRole]) {
      api.setStoredUser(mockUsers[targetRole]);
      setCurrentUser(mockUsers[targetRole]);
      soundService.playSuccess();
    } else {
      handleLogout();
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: 'var(--primary-color)',
          borderRadius: '50%',
          animation: 'radarSweep 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
          Initializing RGIT AI Smart Attendance Ecosystem...
        </p>
      </div>
    );
  }

  // Student Self-Registration Form View
  if (isRegistering) {
    return (
      <div className="app-container">
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          onSwitchRole={handleSwitchRole}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
          onOpenRegister={() => {
            setIsRegistering(false);
            const url = new URL(window.location);
            url.searchParams.delete('register');
            window.history.replaceState({}, '', url);
          }}
          isRegistering={true}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
        <main className="main-content">
          <StudentRegisterForm
            initialSemester={registerSemester}
            initialDepartment={registerDepartment}
            onBackToLogin={() => {
              setIsRegistering(false);
              const url = new URL(window.location);
              url.searchParams.delete('register');
              url.searchParams.delete('department');
              url.searchParams.delete('dept');
              url.searchParams.delete('semester');
              window.history.replaceState({}, '', url);
            }}
          />
        </main>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="app-container">
        <LoginModal
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            soundService.playSuccess();
          }}
          onOpenRegister={(sem, dept) => {
            if (sem) setRegisterSemester(sem);
            if (dept) setRegisterDepartment(dept);
            setIsRegistering(true);
          }}
        />
      </div>
    );
  }

  // Normalize role string safely
  const userRole = (currentUser.role || 'student').toLowerCase();
  const isStudentRole = userRole === 'student';
  const isFacultyRole = userRole === 'faculty' || userRole === 'teacher';
  const isAdminRole = userRole === 'admin' || userRole === 'hod';

  // Main Authenticated Workspace View
  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        onOpenRegister={() => setIsRegistering(true)}
        isRegistering={false}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenNoticeBoard={() => setIsNoticeBoardOpen(true)}
        onOpenIDCard={() => setIsIDCardOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* Main Content Area */}
      {isMobileFrame ? (
        /* Android Phone Frame Preview Mode */
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '1.5rem 1rem',
          minHeight: 'calc(100vh - 70px)',
          background: 'radial-gradient(circle at center, rgba(16, 24, 43, 0.85) 0%, #060913 100%)'
        }}>
          {/* Smartphone Bezel */}
          <div style={{
            width: '393px',
            height: 'min(820px, calc(100vh - 120px))',
            background: 'var(--bg-primary)',
            borderRadius: '44px',
            border: '7px solid #1e293b',
            boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.95), 0 0 40px var(--glass-glow), inset 0 0 0 1px rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Phone Notch / Dynamic Island */}
            <div style={{
              background: '#070a12',
              padding: '0.55rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              zIndex: 20,
              flexShrink: 0
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>09:41</span>
              {/* Dynamic Camera Punch Hole */}
              <div style={{
                width: '60px',
                height: '14px',
                background: '#000000',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e293b' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Signal size={11} />
                <Wifi size={11} />
                <Battery size={13} />
              </div>
            </div>

            {/* Scrollable Mobile Screen Body */}
            <div
              className="mobile-frame-body"
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.1) transparent'
              }}
            >
              {isStudentRole && <StudentPortal currentUser={currentUser} />}
              {isFacultyRole && <FacultyPortal currentUser={currentUser} />}
              {isAdminRole && <AdminPortal currentUser={currentUser} />}
              {!isStudentRole && !isFacultyRole && !isAdminRole && <StudentPortal currentUser={currentUser} />}
            </div>

            {/* Android Navigation Gesture Bar */}
            <div style={{
              height: '22px',
              background: '#070a12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{ width: '90px', height: '3px', background: 'rgba(255, 255, 255, 0.25)', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      ) : (
        /* Full Desktop Responsive Layout */
        <main className="main-content">
          {isStudentRole && <StudentPortal currentUser={currentUser} />}
          {isFacultyRole && <FacultyPortal currentUser={currentUser} />}
          {isAdminRole && <AdminPortal currentUser={currentUser} />}
          {!isStudentRole && !isFacultyRole && !isAdminRole && <StudentPortal currentUser={currentUser} />}
        </main>
      )}

      {/* Global Interactive Speed Dial Menu */}
      <FloatingSpeedDial
        onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenRadar={() => setIsRadarOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenNoticeBoard={() => setIsNoticeBoardOpen(true)}
        onOpenIDCard={() => setIsIDCardOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
      />

      {/* UI Studio & Modals */}
      <ThemeCustomizerModal
        isOpen={isThemeCustomizerOpen}
        onClose={() => setIsThemeCustomizerOpen(false)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSwitchRole={handleSwitchRole}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
        onOpenThemeCustomizer={() => setIsThemeCustomizerOpen(true)}
        onOpenRadar={() => setIsRadarOpen(true)}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <CampusRadarModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
      />

      <NoticeBoardModal
        isOpen={isNoticeBoardOpen}
        onClose={() => setIsNoticeBoardOpen(false)}
        currentUser={currentUser}
      />

      <StudentIDCardModal
        isOpen={isIDCardOpen}
        onClose={() => setIsIDCardOpen(false)}
        studentData={currentUser}
      />

      <AnalyticsChartsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        currentUser={currentUser}
      />

      {/* Global Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--glass-border)',
        background: 'rgba(7, 10, 18, 0.8)'
      }}>
        RGIT AI Smart Attendance Ecosystem (v2.0 PRO) • Rajiv Gandhi Institute of Technology, Bangalore • Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)' }}>Ctrl+K</kbd> for Commands
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

