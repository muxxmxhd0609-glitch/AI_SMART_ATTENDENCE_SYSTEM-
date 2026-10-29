import React from 'react';
import { ShieldCheck, GraduationCap, QrCode, MapPin, X, Award, CheckCircle2 } from 'lucide-react';
import { soundService } from '../services/soundService';

export default function StudentIDCardModal({ isOpen, onClose, studentData }) {
  if (!isOpen) return null;

  const role = studentData?.role || 'student';
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';
  const isHOD = role === 'hod';
  const isFaculty = role === 'faculty';

  let passTitle = "Digital Student Smart Pass";
  if (isAdmin) passTitle = "Master System Admin Pass";
  else if (isHOD) passTitle = "Department Head (HOD) Pass";
  else if (isFaculty) passTitle = "Digital Faculty ID Pass";

  const usn = studentData?.usn || studentData?.faculty_code || studentData?.username || 'MEMBER';
  const name = studentData?.full_name || studentData?.name || 'RGIT Member';
  const dept = studentData?.department || (isAdmin ? 'Master System Administration' : 'Engineering Department');
  const section = studentData?.section || 'A';
  const sem = studentData?.semester || studentData?.selected_semester || (isFaculty ? 'Faculty' : 7);
  const pct = studentData?.attendance_pct || 88.5;
  const phone = studentData?.phone;
  const email = studentData?.email;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`RGIT_STUDENT:${usn}:${name}:${dept}:SEC_${section}`)}&color=070a12&bgcolor=ffffff`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <GraduationCap size={20} style={{ color: 'var(--primary-color)' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{passTitle}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isStudent ? 'VTU Affiliated • Biometric BiPass' : 'Authorized Personnel • Secure Access'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Holographic ID Card Graphic */}
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #0d1a33 0%, #172545 100%)',
              border: '1.5px solid rgba(59, 130, 246, 0.4)',
              boxShadow: '0 15px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Hologram Circle Accent */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '130px',
              height: '130px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* ID Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#93c5fd', letterSpacing: '0.05em' }}>
                  RAJIV GANDHI INSTITUTE OF TECHNOLOGY
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bangalore • VTU Affiliated</div>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                <ShieldCheck size={11} /> VERIFIED PASS
              </span>
            </div>

            {/* Profile Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.5rem',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                  flexShrink: 0
                }}
              >
                {name.charAt(0)}
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>{name}</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#60a5fa', fontWeight: 700 }}>
                  {isStudent ? 'USN:' : 'ID:'} {usn}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {dept} {isStudent && `• Sem ${sem} (Sec ${section})`}
                </div>
                {(phone || email) && (
                  <div style={{ fontSize: '0.68rem', color: '#93c5fd', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
                    {phone && <span>{phone}</span>} {phone && email && <span>• </span>} {email && <span>{email}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                {isStudent ? (
                  <>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={14} /> VTU Attendance: {pct}%
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Compliant with 75% Regulation
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> Official ID Verification
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Elevated clearance granted
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: 'white', padding: '4px', borderRadius: '8px' }}>
                <img src={qrUrl} alt="Pass QR" style={{ width: '60px', height: '60px', display: 'block' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
