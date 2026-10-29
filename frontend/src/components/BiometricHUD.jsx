import React, { useEffect, useState } from 'react';
import { Scan, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';
import { soundService } from '../services/soundService';

export default function BiometricHUD({ isScanning = true, confirmedFrames = 0, targetFrames = 5, studentName = null, confidence = 98.4 }) {
  const [scanPulse, setScanPulse] = useState(0);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(() => {
      setScanPulse((prev) => (prev + 1) % 100);
      if (Math.random() > 0.6) {
        soundService.playScanBeep();
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isScanning]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1rem',
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      {/* Laser Scanning Line */}
      {isScanning && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, #3b82f6 30%, #60a5fa 50%, #3b82f6 70%, transparent 100%)',
            boxShadow: '0 0 15px #3b82f6, 0 0 30px #60a5fa',
            animation: 'scanLine 2.4s ease-in-out infinite'
          }}
        />
      )}

      {/* Futuristic Corner Reticles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ width: '28px', height: '28px', borderTop: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa' }} />
        <div style={{ width: '28px', height: '28px', borderTop: '3px solid #60a5fa', borderRight: '3px solid #60a5fa' }} />
      </div>

      {/* Center Target Box / Face Frame indicator */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '220px',
          height: '240px',
          border: isScanning ? '1px stroke rgba(59, 130, 246, 0.4)' : '2px solid #10b981',
          borderRadius: '16px',
          boxShadow: isScanning ? '0 0 20px rgba(59, 130, 246, 0.25)' : '0 0 30px rgba(16, 185, 129, 0.5)'
        }}
      >
        {/* Animated Corner Brackets on Target */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '16px', height: '16px', borderTop: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '16px', height: '16px', borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '16px', height: '16px', borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6' }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderBottom: '3px solid #3b82f6', borderRight: '3px solid #3b82f6' }} />

        {/* Target Info Badge */}
        {studentName && (
          <div
            style={{
              position: 'absolute',
              bottom: '-35px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(6, 78, 59, 0.95)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} />
            {studentName} ({confidence}% Match)
          </div>
        )}
      </div>

      {/* Bottom Telemetry HUD Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
        <div style={{ width: '28px', height: '28px', borderBottom: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa' }} />
        
        {/* Live HUD telemetry info */}
        <div
          style={{
            background: 'rgba(7, 10, 18, 0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}>
            <Activity size={12} /> 128D VECTOR
          </div>
          <div>FRAME: {confirmedFrames}/{targetFrames}</div>
          <div style={{ color: '#34d399' }}>FAR &lt; 0.001</div>
        </div>

        <div style={{ width: '28px', height: '28px', borderBottom: '3px solid #60a5fa', borderRight: '3px solid #60a5fa' }} />
      </div>
    </div>
  );
}
