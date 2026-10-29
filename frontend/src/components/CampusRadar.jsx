import React, { useState, useEffect } from 'react';
import { Compass, ShieldCheck, AlertTriangle, Navigation, MapPin } from 'lucide-react';
import { RGIT_LOCATION, api } from '../services/api';

export default function CampusRadar({ _userLocation, _radiusMeters = 250, onLocationChange }) {
  const [distance, setDistance] = useState(15.2);
  const [isInside, setIsInside] = useState(true);
  const [simMode, setSimMode] = useState('inside'); // 'inside' | 'outside' | 'live'
  const [statusMsg, setStatusMsg] = useState('Inside RGIT Campus Perimeter');

  // RGIT Coordinates
  const rgitLat = RGIT_LOCATION.latitude;
  const rgitLon = RGIT_LOCATION.longitude;

  // Handle location mode switches
  const handleModeChange = (mode) => {
    setSimMode(mode);
    if (mode === 'inside') {
      // 18m from RGIT center
      const lat = rgitLat + 0.00012;
      const lon = rgitLon + 0.00010;
      if (onLocationChange) onLocationChange({ lat, lon, distance: 18.5, isInside: true, mode: 'inside' });
      setDistance(18.5);
      setIsInside(true);
      setStatusMsg('Inside RGIT Campus (18.5m from center) — Geofence Verified');
    } else if (mode === 'outside') {
      // 420m away from RGIT center
      const lat = rgitLat + 0.0035;
      const lon = rgitLon + 0.0030;
      if (onLocationChange) onLocationChange({ lat, lon, distance: 420.0, isInside: false, mode: 'outside' });
      setDistance(420.0);
      setIsInside(false);
      setStatusMsg('Outside RGIT Campus (420m away) — Attendance Locked');
    } else if (mode === 'live') {
      if (navigator.geolocation) {
        setStatusMsg('Acquiring high-accuracy campus GPS coordinates...');
        const onGeoSuccess = async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          try {
            const res = await api.checkGeofence(latitude, longitude, accuracy);
            const dist = res.distance_meters || 0;
            const inside = res.is_inside;
            setDistance(dist);
            setIsInside(inside);
            setStatusMsg(res.message);
            if (onLocationChange) onLocationChange({ lat: latitude, lon: longitude, distance: dist, isInside: inside, mode: 'live', accuracy });
          } catch (err) {
            setStatusMsg('Failed to check live geofence: ' + err.message);
          }
        };

        const onGeoError = (err) => {
          console.warn('High-accuracy GPS failed, trying standard cellular/wifi position:', err);
          navigator.geolocation.getCurrentPosition(
            onGeoSuccess,
            (fallbackErr) => {
              setStatusMsg('GPS location unavailable: ' + (fallbackErr.message || err.message));
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
          );
        };

        navigator.geolocation.getCurrentPosition(
          onGeoSuccess,
          onGeoError,
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
      } else {
        setStatusMsg('Geolocation API is not supported on this device/browser.');
      }
    }
  };

  useEffect(() => {
    // Initial inside RGIT position
    handleModeChange('inside');
  }, []);

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: isInside ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            padding: '0.45rem',
            borderRadius: 'var(--radius-sm)',
            color: isInside ? '#34d399' : '#f87171'
          }}>
            <Compass size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>RGIT Campus Radar</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lat 13.033090, Lon 77.597786</p>
          </div>
        </div>

        <div className={`badge ${isInside ? 'badge-success' : 'badge-danger'}`}>
          <span className={`pulse-dot ${isInside ? 'pulse-dot-green' : 'pulse-dot-red'}`}></span>
          {isInside ? 'Inside Geofence' : 'Perimeter Breach'}
        </div>
      </div>

      {/* Radar Graphic */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        background: 'radial-gradient(circle at center, #0d1a33 0%, #060913 70%)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Animated Radar Sweep */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 310deg, rgba(59, 130, 246, 0.25) 360deg)',
          borderRadius: '50%',
          animation: 'radarSweep 4s linear infinite',
          pointerEvents: 'none'
        }} />

        {/* Concentric distance rings */}
        <div style={{
          position: 'absolute',
          width: '70px',
          height: '70px',
          border: '1px dashed rgba(59, 130, 246, 0.4)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'absolute',
          width: '170px',
          height: '170px',
          border: isInside ? '2px solid rgba(16, 185, 129, 0.5)' : '2px dashed rgba(239, 68, 68, 0.5)',
          borderRadius: '50%',
          boxShadow: isInside ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(239, 68, 68, 0.2)'
        }} />

        {/* RGIT Campus Center Pin */}
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 5
        }}>
          <div style={{
            background: 'var(--primary-gradient)',
            color: 'white',
            padding: '4px',
            borderRadius: '50%',
            boxShadow: '0 0 12px #3b82f6'
          }}>
            <MapPin size={16} />
          </div>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#93c5fd', marginTop: '2px' }}>RGIT CORE</span>
        </div>

        {/* Student Dot (Relative Position) */}
        <div style={{
          position: 'absolute',
          transform: isInside ? 'translate(25px, -20px)' : 'translate(75px, -65px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 10
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: isInside ? '#10b981' : '#ef4444',
            boxShadow: isInside ? '0 0 12px #10b981' : '0 0 12px #ef4444'
          }} />
          <span style={{
            fontSize: '0.68rem',
            background: 'rgba(0,0,0,0.7)',
            padding: '1px 6px',
            borderRadius: '4px',
            border: '1px solid var(--glass-border)',
            color: isInside ? '#34d399' : '#f87171',
            whiteSpace: 'nowrap'
          }}>
            You ({distance.toFixed(1)}m)
          </span>
        </div>
      </div>

      {/* Geofence Status Information */}
      <div style={{
        marginTop: '0.85rem',
        padding: '0.65rem 0.85rem',
        background: isInside ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
        border: `1px solid ${isInside ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.8rem',
        color: isInside ? '#6ee7b7' : '#fca5a5'
      }}>
        {isInside ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
        <span>{statusMsg}</span>
      </div>

      {/* Simulation / Real GPS Toggle Bar */}
      <div style={{ marginTop: '0.85rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          GPS Test Simulation Bar:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
          <button
            onClick={() => handleModeChange('inside')}
            className="btn btn-sm"
            style={{
              background: simMode === 'inside' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${simMode === 'inside' ? 'var(--success)' : 'var(--glass-border)'}`,
              color: simMode === 'inside' ? '#34d399' : 'var(--text-secondary)',
              fontSize: '0.75rem'
            }}
          >
            🟢 Inside (18m)
          </button>
          <button
            onClick={() => handleModeChange('outside')}
            className="btn btn-sm"
            style={{
              background: simMode === 'outside' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${simMode === 'outside' ? 'var(--danger)' : 'var(--glass-border)'}`,
              color: simMode === 'outside' ? '#f87171' : 'var(--text-secondary)',
              fontSize: '0.75rem'
            }}
          >
            🔴 Outside (420m)
          </button>
          <button
            onClick={() => handleModeChange('live')}
            className="btn btn-sm"
            style={{
              background: simMode === 'live' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${simMode === 'live' ? 'var(--primary-color)' : 'var(--glass-border)'}`,
              color: simMode === 'live' ? '#60a5fa' : 'var(--text-secondary)',
              fontSize: '0.75rem'
            }}
          >
            <Navigation size={12} /> Live Device GPS
          </button>
        </div>
      </div>
    </div>
  );
}
