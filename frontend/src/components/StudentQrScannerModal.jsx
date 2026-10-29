import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Zap, Upload, CheckCircle2, AlertCircle, Sparkles, SwitchCamera } from 'lucide-react';
import jsQR from 'jsqr';
import { soundService } from '../services/soundService';
import confetti from 'canvas-confetti';

/**
 * Robust Attendance QR Data Parser
 * Handles:
 * - URLs: https://.../?pin=123456&subject=BCS701&section=A
 * - JSON: {"pin": "123456", "subject": "BCS701", "section": "A"}
 * - Prefixed strings: RGIT_SESSION:123456 or RGIT:123456:BCS701
 * - Raw 6-character alphanumeric or numeric PINs: 849201
 */
export function parseAttendanceQrData(rawData) {
  if (!rawData || typeof rawData !== 'string') return null;
  const str = rawData.trim();

  // 1. Try URL parsing
  try {
    if (str.startsWith('http://') || str.startsWith('https://') || str.includes('?') || str.includes('pin=')) {
      const url = str.startsWith('http') ? new URL(str) : new URL(str, window.location.origin);
      const pin = url.searchParams.get('pin') || url.searchParams.get('session_code') || url.searchParams.get('code');
      const subject = url.searchParams.get('subject') || url.searchParams.get('subject_code');
      const section = url.searchParams.get('section');
      if (pin && pin.trim().length === 6) {
        return {
          pin: pin.trim().toUpperCase(),
          subject: subject ? decodeURIComponent(subject) : null,
          section: section ? decodeURIComponent(section).toUpperCase() : null,
          raw: str
        };
      }
    }
  } catch (e) {
    // Continue
  }

  // 2. Try JSON parsing
  if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('{"') && str.includes('pin'))) {
    try {
      const parsed = JSON.parse(str);
      const pin = parsed.pin || parsed.session_code || parsed.code || parsed.sessionPin;
      if (pin && String(pin).trim().length === 6) {
        return {
          pin: String(pin).trim().toUpperCase(),
          subject: parsed.subject || parsed.subject_code || null,
          section: parsed.section ? String(parsed.section).toUpperCase() : null,
          raw: str
        };
      }
    } catch (e) {
      // Continue
    }
  }

  // 3. Try delimited prefixes: RGIT_SESSION:123456 or RGIT:123456:BCS701
  if (str.includes(':')) {
    const parts = str.split(':');
    for (let i = 0; i < parts.length; i++) {
      const token = parts[i].trim().toUpperCase();
      if (/^[A-Z0-9]{6}$/.test(token)) {
        return {
          pin: token,
          subject: parts[i + 1] ? parts[i + 1].trim() : null,
          raw: str
        };
      }
    }
  }

  // 4. Raw 6-character alphanumeric / digits
  const clean = str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length === 6) {
    return { pin: clean, raw: str };
  }

  // 5. Regex search for any 6-digit sequence in text
  const match = str.match(/\b([0-9]{6})\b/);
  if (match) {
    return { pin: match[1], raw: str };
  }

  return null;
}

export default function StudentQrScannerModal({
  isOpen,
  onClose,
  onQrDecoded,
  activeSession = null
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // default to rear camera to point at projector/screen
  const [scannedResult, setScannedResult] = useState(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [decodingProgress, setDecodingProgress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser. Please use the "Upload QR Image" option below.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check for torch capability safely
      try {
        const tracks = stream.getVideoTracks();
        if (tracks && tracks.length > 0) {
          const track = tracks[0];
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          setHasTorch(Boolean(capabilities?.torch));
        } else {
          setHasTorch(false);
        }
      } catch (e) {
        setHasTorch(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted/aborted:', playErr);
        }
        setCameraActive(true);

        // Start real-time frame scanning
        startScanningLoop();
      }
    } catch (err) {
      console.warn('QR Scanner Camera Error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setCameraError(
        isDenied
          ? 'Camera permission denied. Please allow camera access in your browser or upload a photo/screenshot of the teacher\'s QR code below.'
          : (err.message || 'Unable to access camera. You can upload a photo of the QR code.')
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setTorchOn(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    try {
      const tracks = streamRef.current.getVideoTracks();
      if (!tracks || tracks.length === 0) return;
      const track = tracks[0];
      const newTorchState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });
      setTorchOn(newTorchState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Main scanning loop: BarcodeDetector -> jsQR fallback
  const startScanningLoop = () => {
    let barcodeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    const scanFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // 1. Try native BarcodeDetector if available
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            const parsed = parseAttendanceQrData(raw);
            if (parsed && parsed.pin) {
              handleSuccessfulScan(parsed);
              return; // Stop scanning loop on success
            }
          }
        } catch (e) {
          // Fallback to jsQR below
        }
      }

      // 2. jsQR Canvas fallback
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const width = video.videoWidth;
          const height = video.videoHeight;
          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (code && code.data) {
              const parsed = parseAttendanceQrData(code.data);
              if (parsed && parsed.pin) {
                handleSuccessfulScan(parsed);
                return; // Stop scanning loop on success
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSuccessfulScan = (parsed) => {
    soundService.playSuccess();
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setScannedResult(parsed);
    stopCamera();

    // Small delay to allow the student to see the verified feedback badge
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      if (onQrDecoded) {
        onQrDecoded(parsed.pin, parsed);
      }
      onClose();
    }, 1100);
  };

  // Decode from file/image upload fallback
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDecodingProgress(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setDecodingProgress(false);
      alert('Failed to read image file. Please try uploading another image or use live camera.');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setDecodingProgress(false);
        alert('Could not parse image data. Please ensure the file is a valid JPG/PNG photo.');
      };
      img.onload = async () => {
        try {
          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0);

          // Try BarcodeDetector
          if ('BarcodeDetector' in window) {
            try {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(img);
              if (barcodes && barcodes.length > 0) {
                const parsed = parseAttendanceQrData(barcodes[0].rawValue);
                if (parsed && parsed.pin) {
                  setDecodingProgress(false);
                  handleSuccessfulScan(parsed);
                  return;
                }
              }
            } catch (err) {}
          }

          // jsQR fallback
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          setDecodingProgress(false);

          if (code && code.data) {
            const parsed = parseAttendanceQrData(code.data);
            if (parsed && parsed.pin) {
              handleSuccessfulScan(parsed);
              return;
            }
          }

          alert('Could not detect a valid classroom attendance QR code from this image. Please make sure the photo clearly shows the QR code launched by your instructor.');
        } catch (procErr) {
          console.warn('QR image decoding error:', procErr);
          setDecodingProgress(false);
          alert('Error processing image. Please try taking a closer photo of the QR code.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '480px',
          width: '92%',
          background: 'linear-gradient(135deg, rgba(10, 16, 32, 0.98) 0%, rgba(17, 24, 39, 0.96) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(37, 99, 235, 0.25)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
            }}>
              <Camera size={19} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Scan Faculty QR Code
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Point camera at teacher's screen or projector
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scanner Body */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Active Teacher Info Pill */}
          {activeSession?.active && (
            <div style={{
              padding: '0.55rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <Sparkles size={14} />
                <span>
                  Teacher Session Active: <strong>{activeSession.session?.subject_code}</strong> (Period {activeSession.session?.period_number})
                </span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Live</span>
            </div>
          )}

          {/* Camera Viewport / Scanner HUD */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '310px',
            background: '#030712',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '2px solid rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Live Video Element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: cameraActive ? 'block' : 'none'
              }}
              playsInline
              muted
            />

            {/* Hidden canvas for jsQR frame processing */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Camera Controls Overlay (Top Right inside Video) */}
            {cameraActive && !scannedResult && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '8px',
                zIndex: 10
              }}>
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    style={{
                      background: torchOn ? 'rgba(234, 179, 8, 0.85)' : 'rgba(0, 0, 0, 0.65)',
                      color: torchOn ? '#000' : '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <Zap size={13} /> {torchOn ? 'Torch On' : 'Torch'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    backdropFilter: 'blur(8px)'
                  }}
                  title="Switch between Rear & Front Camera"
                >
                  <SwitchCamera size={13} /> {facingMode === 'environment' ? 'Rear' : 'Front'}
                </button>
              </div>
            )}

            {/* Reticle / Target Scanning Box */}
            {cameraActive && !scannedResult && (
              <div style={{
                position: 'absolute',
                width: '210px',
                height: '210px',
                pointerEvents: 'none'
              }}>
                {/* 4 Glowing Corner Brackets */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '28px', height: '28px', borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '4px 0 0 0' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '28px', height: '28px', borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 4px 0 0' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '28px', height: '28px', borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8', borderRadius: '0 0 0 4px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8', borderRadius: '0 0 4px 0' }} />

                {/* Laser Sweep Beam */}
                <div style={{
                  position: 'absolute',
                  left: '4px',
                  right: '4px',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #38bdf8, #60a5fa, #38bdf8, transparent)',
                  boxShadow: '0 0 15px #38bdf8, 0 0 25px #60a5fa',
                  animation: 'scanLine 2s infinite ease-in-out'
                }} />

                {/* Center Sub-Target Crosshairs */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '32px',
                  height: '32px',
                  border: '1px dashed rgba(56, 189, 248, 0.4)',
                  borderRadius: '6px'
                }} />
              </div>
            )}

            {/* Error / Fallback State */}
            {cameraError && !scannedResult && (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <AlertCircle size={32} />
                <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.4, color: '#e2e8f0' }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button
                    onClick={startCamera}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <RefreshCw size={12} /> Retry Camera
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <Upload size={12} /> Upload QR Photo
                  </button>
                </div>
              </div>
            )}

            {/* Success Overlay after Verification */}
            {scannedResult && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(5, 46, 22, 0.94)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                color: '#f8fafc',
                animation: 'scaleIn 0.3s ease-out'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.25)',
                  border: '2px solid #34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#34d399' }}>
                  Faculty QR Code Verified!
                </h4>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  color: '#ffffff',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '6px 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(52, 211, 153, 0.4)'
                }}>
                  PIN: {scannedResult.pin}
                </div>
                {scannedResult.subject && (
                  <p style={{ fontSize: '0.78rem', color: '#a7f3d0', margin: 0 }}>
                    Subject: {scannedResult.subject}
                  </p>
                )}
                <span style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: '4px' }}>
                  Applying PIN and proceeding to Biometric Check-In...
                </span>
              </div>
            )}
          </div>

          {/* Bottom Action Ribbon: Upload Photo alternative */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            fontSize: '0.78rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Camera blurry or far away?
            </span>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary btn-sm"
              disabled={decodingProgress}
              style={{ fontSize: '0.75rem', gap: '5px' }}
            >
              {decodingProgress ? <RefreshCw size={12} className="spin" /> : <Upload size={12} />}
              <span>{decodingProgress ? 'Decoding...' : 'Upload QR Image'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
