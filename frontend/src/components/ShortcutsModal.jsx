import React from 'react';
import { Keyboard, X, Command, Sparkles } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / Cmd + K', description: 'Open Quick Command Palette spotlight search' },
    { key: 'Alt + M', description: 'Toggle Android Mobile APK Frame vs Desktop view' },
    { key: 'Alt + T', description: 'Open Theme Studio & Color Accent Customizer' },
    { key: 'Alt + S', description: 'Toggle Audio Synthesizer Mute / Unmute' },
    { key: 'Alt + R', description: 'Open Campus Geofence Radar' },
    { key: 'Esc', description: 'Close any active modal dialog or command palette' },
    { key: '?', description: 'Open this Keyboard Shortcuts cheat sheet' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Keyboard size={20} style={{ color: 'var(--primary-color)' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Keyboard Shortcuts</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Speed up your attendance workflows with hotkeys
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {shortcuts.map((sc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                  {sc.description}
                </span>
                <kbd
                  style={{
                    padding: '0.25rem 0.6rem',
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: '#60a5fa',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
