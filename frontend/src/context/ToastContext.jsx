import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X, ScanFace } from 'lucide-react';
import { soundService } from '../services/soundService';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    
    // Trigger sound
    if (type === 'success') soundService.playSuccess();
    else if (type === 'error') soundService.playError();
    else if (type === 'scan') soundService.playFaceDetected();
    else soundService.playToast();

    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} style={{ color: '#34d399' }} />;
      case 'error':
        return <AlertCircle size={18} style={{ color: '#f87171' }} />;
      case 'scan':
        return <ScanFace size={18} style={{ color: '#60a5fa' }} />;
      case 'warning':
        return <Sparkles size={18} style={{ color: '#fbbf24' }} />;
      default:
        return <Info size={18} style={{ color: '#a7f3d0' }} />;
    }
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          borderLeft: '4px solid #10b981',
          background: 'rgba(6, 78, 59, 0.85)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)'
        };
      case 'error':
        return {
          borderLeft: '4px solid #ef4444',
          background: 'rgba(127, 29, 29, 0.85)',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)'
        };
      case 'scan':
        return {
          borderLeft: '4px solid #3b82f6',
          background: 'rgba(15, 23, 42, 0.9)',
          boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)'
        };
      case 'warning':
        return {
          borderLeft: '4px solid #f59e0b',
          background: 'rgba(120, 53, 15, 0.85)',
          boxShadow: '0 8px 30px rgba(245, 158, 11, 0.25)'
        };
      default:
        return {
          borderLeft: '4px solid #8b5cf6',
          background: 'rgba(30, 27, 75, 0.85)',
          boxShadow: '0 8px 30px rgba(139, 92, 246, 0.25)'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Floating Toast Portal Container */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast-item"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '12px',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.875rem',
              fontWeight: 500,
              animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              ...getTypeStyle(toast.type)
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {getIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                borderRadius: '4px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
