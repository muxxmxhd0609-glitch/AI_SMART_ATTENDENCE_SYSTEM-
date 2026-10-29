import React, { useState } from 'react';
import { Megaphone, Pin, Send, Trash2, X, Bell, AlertCircle, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/soundService';

export const INITIAL_NOTICES = [
  {
    id: 1,
    title: 'Major Project Phase-II Lab Session Rescheduled',
    department: 'Computer Science & Engineering',
    author: 'Dr. Arudra A (HOD)',
    date: '2025-10-05',
    priority: 'HIGH',
    content: 'All 7th Semester CSE Section A & B students are informed that Major Project Phase-II lab is rescheduled to CSE Lab 3 (02:30 PM - 05:00 PM).'
  },
  {
    id: 2,
    title: 'VTU 75% Attendance Compliance Deadline',
    department: 'All Departments',
    author: 'RGIT Academic Dean',
    date: '2025-10-04',
    priority: 'URGENT',
    content: 'Students with attendance below 75% must report to their respective HODs immediately to review shortage warnings.'
  },
  {
    id: 3,
    title: 'AI Smart Biometric Kiosk Self-Check-in Available',
    department: 'RGIT AI Center',
    author: 'Prof. V. K. Murthy',
    date: '2025-10-02',
    priority: 'INFO',
    content: 'Self-service biometric attendance kiosks are now active at LH-204 and LH-205 entrances. Ensure face photo is updated in portal.'
  }
];

export default function NoticeBoardModal({ isOpen, onClose, currentUser }) {
  const [notices, setNotices] = useState(() => {
    const saved = localStorage.getItem('rgit_notices');
    return saved ? JSON.parse(saved) : INITIAL_NOTICES;
  });

  const [newNotice, setNewNotice] = useState({
    title: '',
    priority: 'INFO',
    content: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleCreateNotice = (e) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) return;

    const noticeItem = {
      id: Date.now(),
      title: newNotice.title.trim(),
      department: currentUser?.department || 'Computer Science & Engineering',
      author: currentUser?.full_name || 'HOD / Faculty',
      date: new Date().toISOString().split('T')[0],
      priority: newNotice.priority,
      content: newNotice.content.trim()
    };

    const updated = [noticeItem, ...notices];
    setNotices(updated);
    localStorage.setItem('rgit_notices', JSON.stringify(updated));
    setNewNotice({ title: '', priority: 'INFO', content: '' });
    setShowAddForm(false);
    soundService.playSuccess();
  };

  const handleDeleteNotice = (id) => {
    const updated = notices.filter(n => n.id !== id);
    setNotices(updated);
    localStorage.setItem('rgit_notices', JSON.stringify(updated));
    soundService.playClick();
  };

  const isTeacherOrAdmin = currentUser?.role === 'faculty' || currentUser?.role === 'admin' || currentUser?.role === 'hod';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: '#fbbf24' }}>
              <Megaphone size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Campus Broadcast Notice Board</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official department announcements & academic alerts
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isTeacherOrAdmin && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.75rem', gap: '4px' }}
              >
                <Pin size={13} /> {showAddForm ? 'View Notices' : 'Post Announcement'}
              </button>
            )}
            <button onClick={onClose} className="modal-close-btn">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Post New Announcement Form (For Teachers/HODs) */}
          {showAddForm ? (
            <form onSubmit={handleCreateNotice} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-color)' }}>Broadcast New Notice</h4>
              <div className="form-group">
                <label className="form-label">Notice Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Session Rescheduled"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level:</label>
                <select
                  value={newNotice.priority}
                  onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
                  className="form-select"
                >
                  <option value="INFO">🔵 Normal Info</option>
                  <option value="HIGH">🟡 High Priority</option>
                  <option value="URGENT">🔴 Urgent Alert</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Content:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter detailed notice message..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                <Send size={14} /> Publish Broadcast Notice
              </button>
            </form>
          ) : null}

          {/* Notices Stream */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '420px', overflowY: 'auto' }}>
            {notices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No announcements posted yet.
              </div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: n.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.1)' : n.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${n.priority === 'URGENT' ? 'rgba(239, 68, 68, 0.3)' : n.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.3)' : 'var(--glass-border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${n.priority === 'URGENT' ? 'badge-danger' : n.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                        {n.priority}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{n.date}</span>
                    </div>

                    {isTeacherOrAdmin && (
                      <button onClick={() => handleDeleteNotice(n.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }} title="Delete notice">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.content}</p>
                  
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Posted by: <strong>{n.author}</strong> ({n.department})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
