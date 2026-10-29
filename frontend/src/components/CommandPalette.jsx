import React, { useState, useEffect } from 'react';
import { 
  Search, Command, Camera, Shield, GraduationCap, 
  UserCheck, Smartphone, Palette, Radio, FileText, 
  Volume2, X, ArrowRight, CornerDownLeft 
} from 'lucide-react';
import { soundService } from '../services/soundService';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigateTab, 
  onSwitchRole, 
  onToggleMobileFrame,
  onOpenThemeCustomizer,
  onOpenRadar,
  onOpenScanModal
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: 'scan',
      title: 'Take Biometric Scan (Webcam)',
      category: 'Attendance',
      icon: Camera,
      badge: 'Live Scanner',
      handler: () => { if (onOpenScanModal) onOpenScanModal(); }
    },
    {
      id: 'radar',
      title: 'Open Campus Radar & GPS Check',
      category: 'Navigation',
      icon: Radio,
      badge: 'GPS Geofence',
      handler: () => { if (onOpenRadar) onOpenRadar(); }
    },
    {
      id: 'theme',
      title: 'Open Theme Studio & Sound FX',
      category: 'Preferences',
      icon: Palette,
      badge: 'UI Accent',
      handler: () => { if (onOpenThemeCustomizer) onOpenThemeCustomizer(); }
    },
    {
      id: 'mobile',
      title: 'Toggle Mobile APK / Desktop View',
      category: 'View Mode',
      icon: Smartphone,
      badge: 'Shortcut',
      handler: () => { if (onToggleMobileFrame) onToggleMobileFrame(); }
    },
    {
      id: 'role-student',
      title: 'Switch to Student View (Demo)',
      category: 'Role Switch',
      icon: GraduationCap,
      badge: 'Student',
      handler: () => { if (onSwitchRole) onSwitchRole('student'); }
    },
    {
      id: 'role-faculty',
      title: 'Switch to Faculty View (Demo)',
      category: 'Role Switch',
      icon: UserCheck,
      badge: 'Faculty',
      handler: () => { if (onSwitchRole) onSwitchRole('faculty'); }
    },
    {
      id: 'role-admin',
      title: 'Switch to HOD / Admin View',
      category: 'Role Switch',
      icon: Shield,
      badge: 'Admin',
      handler: () => { if (onSwitchRole) onSwitchRole('admin'); }
    }
  ];

  const filteredActions = actions.filter(
    (action) =>
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
        soundService.playClick();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
        soundService.playClick();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].handler();
          onClose();
          soundService.playSuccess();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '620px',
          background: 'rgba(10, 15, 29, 0.95)',
          border: '1px solid var(--glass-border-bright)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 30px var(--glass-glow)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <Search size={20} style={{ color: 'var(--primary-color)' }} />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-heading)'
            }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Action List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
          {filteredActions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No matching commands found for "{query}"
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const Icon = action.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    action.handler();
                    onClose();
                    soundService.playSuccess();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSelected ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSelected ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {action.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {action.category}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.68rem', textTransform: 'none' }}>
                      {action.badge}
                    </span>
                    {isSelected && <CornerDownLeft size={14} style={{ color: 'var(--primary-color)' }} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          style={{
            padding: '0.65rem 1.25rem',
            borderTop: '1px solid var(--glass-border)',
            background: 'rgba(7, 10, 18, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Command size={11} /> + K Quick Access
          </div>
        </div>
      </div>
    </div>
  );
}
