import React, { useState } from 'react';
import { 
  Sparkles, Palette, Command, Radio, Keyboard, 
  Volume2, VolumeX, Megaphone, GraduationCap, BarChart3, X 
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function FloatingSpeedDial({
  onOpenThemeCustomizer,
  onOpenCommandPalette,
  onOpenRadar,
  onOpenShortcuts,
  onOpenNoticeBoard,
  onOpenIDCard,
  onOpenAnalytics
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundService.getMuted());

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    soundService.playClick();
  };

  const handleToggleSound = (e) => {
    e.stopPropagation();
    const muted = soundService.toggleMute();
    setIsMuted(muted);
    if (!muted) soundService.playSuccess();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px'
      }}
    >
      {/* Radial Speed Dial Options */}
      {isOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'flex-end',
            animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Action 1: Notice Board */}
          {onOpenNoticeBoard && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNoticeBoard();
                soundService.playClick();
              }}
              className="fab-child-btn"
              title="Broadcast Notice Board"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--glass-border-bright)',
                color: 'var(--text-main)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <Megaphone size={16} style={{ color: '#fbbf24' }} />
              <span>Notice Board</span>
            </button>
          )}

          {/* Action 2: Analytics Charts */}
          {onOpenAnalytics && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenAnalytics();
                soundService.playClick();
              }}
              className="fab-child-btn"
              title="Analytics Charts"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--glass-border-bright)',
                color: 'var(--text-main)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <BarChart3 size={16} style={{ color: '#60a5fa' }} />
              <span>Attendance Analytics</span>
            </button>
          )}

          {/* Action 3: Student Pass */}
          {onOpenIDCard && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenIDCard();
                soundService.playClick();
              }}
              className="fab-child-btn"
              title="Digital Student Pass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--glass-border-bright)',
                color: 'var(--text-main)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <GraduationCap size={16} style={{ color: '#34d399' }} />
              <span>Digital Smart ID</span>
            </button>
          )}

          {/* Action 4: Theme Studio */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenThemeCustomizer();
              soundService.playClick();
            }}
            className="fab-child-btn"
            title="Theme Studio"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--text-main)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Palette size={16} style={{ color: '#ec4899' }} />
            <span>Theme Studio</span>
          </button>

          {/* Action 5: Command Palette */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCommandPalette();
              soundService.playClick();
            }}
            className="fab-child-btn"
            title="Command Palette (Ctrl+K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--text-main)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Command size={16} style={{ color: '#3b82f6' }} />
            <span>Command Palette</span>
          </button>

          {/* Action 6: Campus Radar */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenRadar();
              soundService.playClick();
            }}
            className="fab-child-btn"
            title="Campus Radar & GPS Geofence"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--text-main)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Radio size={16} style={{ color: '#10b981' }} />
            <span>Campus Radar</span>
          </button>

          {/* Action 7: Toggle Mute */}
          <button
            onClick={handleToggleSound}
            className="fab-child-btn"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--text-main)',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            {isMuted ? <VolumeX size={16} style={{ color: '#ef4444' }} /> : <Volume2 size={16} style={{ color: '#34d399' }} />}
            <span>{isMuted ? 'Audio Muted' : 'Audio Active'}</span>
          </button>
        </div>
      )}

      {/* Main Trigger FAB */}
      <button
        onClick={toggleOpen}
        title="Quick AI Studio Actions"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--primary-gradient)',
          border: 'none',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 30px rgba(37, 99, 235, 0.5), 0 0 20px var(--glass-glow)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isOpen ? 'rotate(45deg)' : 'scale(1)'
        }}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </button>
    </div>
  );
}
