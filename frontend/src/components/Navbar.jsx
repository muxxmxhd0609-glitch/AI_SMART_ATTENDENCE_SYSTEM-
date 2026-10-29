import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Shield, UserCheck, 
  LogOut, Clock, Smartphone, Laptop,
  Search, Palette, Volume2, VolumeX, Keyboard, Command,
  Megaphone, BarChart3
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function Navbar({ 
  currentUser, 
  onLogout, 
  onSwitchRole, 
  isMobileFrame, 
  onToggleMobileFrame,
  onOpenRegister,
  isRegistering,
  onOpenCommandPalette,
  onOpenThemeCustomizer,
  onOpenShortcuts,
  onOpenNoticeBoard,
  onOpenIDCard,
  onOpenAnalytics
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isMuted, setIsMuted] = useState(() => soundService.getMuted());

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
    if (!muted) soundService.playSuccess();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-purple" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <Shield size={12} /> MASTER PORTAL
          </span>
        );
      case 'hod':
        return (
          <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <Shield size={12} /> HOD PORTAL
          </span>
        );
      case 'faculty':
        return (
          <span className="badge badge-info">
            <UserCheck size={12} /> Faculty
          </span>
        );
      case 'student':
        return (
          <span className="badge badge-success">
            <GraduationCap size={12} /> Student
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header style={{
      background: 'rgba(10, 15, 29, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
          }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                RGIT ATTENDANCE
              </h1>
              <span style={{ fontSize: '0.6rem', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, flexShrink: 0 }}>
                v2.0 AI PRO
              </span>
            </div>
            <p className="nav-center-pill" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Rajiv Gandhi Institute of Technology, Bangalore
            </p>
          </div>
        </div>

        {/* Center: Live Clock & Campus Geofence Pin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="nav-center-pill">
          {/* Quick Search Spotlight Button */}
          <button
            onClick={onOpenCommandPalette}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Open Command Palette (Ctrl+K)"
          >
            <Search size={13} style={{ color: 'var(--primary-color)' }} />
            <span>Search & Commands</span>
            <kbd style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              Ctrl K
            </kbd>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--glass-border)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={13} style={{ color: '#60a5fa' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{currentTime}</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.78rem',
            color: '#34d399'
          }}>
            <span className="pulse-dot pulse-dot-green"></span>
            <span>RGIT Bangalore</span>
          </div>
        </div>

        {/* Right Section: Broadcast Notices, Analytics, UI Customizer, Audio, Mobile Frame Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {/* Notice Board */}
          {onOpenNoticeBoard && (
            <button
              onClick={onOpenNoticeBoard}
              className="btn btn-secondary btn-sm"
              title="Broadcast Notice Board"
              style={{ padding: '0.45rem 0.65rem', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.35)' }}
            >
              <Megaphone size={14} />
            </button>
          )}

          {/* Analytics */}
          {onOpenAnalytics && (
            <button
              onClick={onOpenAnalytics}
              className="btn btn-secondary btn-sm"
              title="Attendance Analytics & Charts"
              style={{ padding: '0.45rem 0.65rem', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.35)' }}
            >
              <BarChart3 size={14} />
            </button>
          )}

          {/* Student Pass (For Student) */}
          {onOpenIDCard && currentUser?.role === 'student' && (
            <button
              onClick={onOpenIDCard}
              className="btn btn-secondary btn-sm"
              title="Digital Student Smart ID Pass"
              style={{ fontSize: '0.75rem', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.4)' }}
            >
              <GraduationCap size={14} />
              <span>Smart Pass</span>
            </button>
          )}

          {/* Theme Studio Studio Button */}
          <button
            onClick={onOpenThemeCustomizer}
            className="btn btn-secondary btn-sm"
            title="Open Theme Studio & Accent Switcher"
            style={{ padding: '0.45rem 0.65rem' }}
          >
            <Palette size={14} style={{ color: '#ec4899' }} />
          </button>

          {/* Sound Synthesizer Mute Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="btn btn-secondary btn-sm"
            title={isMuted ? 'Unmute Audio Chimes' : 'Mute Audio Chimes'}
            style={{ padding: '0.45rem 0.65rem' }}
          >
            {isMuted ? <VolumeX size={14} style={{ color: '#ef4444' }} /> : <Volume2 size={14} style={{ color: '#34d399' }} />}
          </button>

          {/* Mobile Phone Mockup View Toggle */}
          <button
            onClick={onToggleMobileFrame}
            className="btn btn-secondary btn-sm"
            title="Toggle Android Mobile App View / Desktop View"
            style={{ fontSize: '0.75rem' }}
          >
            {isMobileFrame ? <Laptop size={14} /> : <Smartphone size={14} />}
            <span>{isMobileFrame ? 'Desktop' : 'Mobile APK'}</span>
          </button>

          {/* User Info & Logout */}
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.full_name}
                </div>
                <div>{getRoleBadge(currentUser.role)}</div>
              </div>

              <button
                onClick={onLogout}
                className="btn btn-secondary btn-sm"
                title="Log Out"
                style={{ padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
