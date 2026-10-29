import React from 'react';
import { Compass, X } from 'lucide-react';
import CampusRadar from './CampusRadar';

export default function CampusRadarModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '520px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Compass size={20} style={{ color: '#10b981' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Campus Geofence Radar</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                GPS spatial verification & perimeter check
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          <CampusRadar />
        </div>

        <div className="modal-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Radar
          </button>
        </div>
      </div>
    </div>
  );
}
