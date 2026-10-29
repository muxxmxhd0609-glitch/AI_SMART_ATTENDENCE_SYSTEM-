import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { DEPARTMENT_SUBJECT_CATALOG_FRONTEND, RGIT_BE_COURSES } from '../constants/courses';

export default function AnalyticsChartsModal({ isOpen, onClose, currentUser }) {
  const [selectedDept, setSelectedDept] = useState('CSE');
  const [selectedSem, setSelectedSem] = useState(1);

  useEffect(() => {
    if (isOpen && currentUser) {
      if (currentUser.department) {
        // Map long names to codes using RGIT_BE_COURSES
        const courseMatch = RGIT_BE_COURSES.find(c => c.name === currentUser.department);
        if (courseMatch) setSelectedDept(courseMatch.code);
        else if (DEPARTMENT_SUBJECT_CATALOG_FRONTEND[currentUser.department]) setSelectedDept(currentUser.department);
      }
      if (currentUser.semester || currentUser.selected_semester) {
        setSelectedSem(currentUser.semester || currentUser.selected_semester);
      }
    }
  }, [isOpen, currentUser]);

  const isAdmin = currentUser?.role === 'admin';
  const isStudent = currentUser?.role === 'student';

  if (!isOpen) return null;

  const weeklyTrend = [
    { day: 'Mon', pct: 92 },
    { day: 'Tue', pct: 88 },
    { day: 'Wed', pct: 94 },
    { day: 'Thu', pct: 85 },
    { day: 'Fri', pct: 91 },
    { day: 'Sat', pct: 89 }
  ];

  const catalog = DEPARTMENT_SUBJECT_CATALOG_FRONTEND[selectedDept] || [];
  const subjects = catalog.filter(s => (s.semester || 7) === selectedSem).slice(0, 5);
  
  const subjectStats = subjects.map((s, idx) => {
    const pct = 75 + (idx * 7) % 22 + (selectedSem % 4);
    return { code: s.code, name: s.name, pct: parseFloat(pct.toFixed(1)) };
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '650px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '0.45rem', borderRadius: 'var(--radius-sm)', color: '#60a5fa' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Academic Attendance Analytics</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Visual trend analysis & VTU compliance forecaster
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <select 
              className="form-select" 
              style={{ 
                padding: '0.3rem 1.6rem 0.3rem 0.65rem', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                height: 'auto', 
                background: '#0d1527', 
                color: '#f8fafc', 
                borderColor: 'rgba(59, 130, 246, 0.45)',
                borderRadius: '8px',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={!isAdmin}
              title={!isAdmin ? "Restricted to your department" : ""}
            >
              {Object.keys(DEPARTMENT_SUBJECT_CATALOG_FRONTEND).map(k => (
                <option key={k} value={k} style={{ background: '#0b1120', color: '#f8fafc', padding: '6px 10px' }}>
                  {k}
                </option>
              ))}
            </select>
            <select 
              className="form-select" 
              style={{ 
                padding: '0.3rem 1.6rem 0.3rem 0.65rem', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                height: 'auto', 
                background: '#0d1527', 
                color: '#f8fafc', 
                borderColor: 'rgba(59, 130, 246, 0.45)',
                borderRadius: '8px',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
              value={selectedSem}
              onChange={(e) => setSelectedSem(parseInt(e.target.value, 10))}
              disabled={isStudent}
              title={isStudent ? "Restricted to your current semester" : ""}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <option key={sem} value={sem} style={{ background: '#0b1120', color: '#f8fafc', padding: '6px 10px' }}>
                  Sem {sem}
                </option>
              ))}
            </select>
            <button onClick={onClose} className="modal-close-btn" style={{ marginLeft: '0.5rem' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Weekly Attendance Trend Graph (SVG Visual Bar Chart) */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} style={{ color: '#3b82f6' }} /> Weekly Attendance Trend (%)
              </h4>
              <span className="badge badge-success">AVG: 89.8%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '0 1rem' }}>
              {weeklyTrend.map((t) => (
                <div key={t.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#34d399' }}>{t.pct}%</span>
                  <div
                    style={{
                      width: '24px',
                      height: `${t.pct * 1.1}px`,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #10b981 100%)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Attendance Breakdown */}
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem' }}>Subject-wise Attendance Rates</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {subjectStats.length > 0 ? subjectStats.map((s) => (
                <div key={s.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.code} - {s.name}</span>
                    <span style={{ fontWeight: 700, color: s.pct < 75 ? '#ef4444' : s.pct < 85 ? '#fbbf24' : '#34d399' }}>{s.pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: s.pct < 75 ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No subject catalog data available for {selectedDept} Semester {selectedSem}.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
