import React, { useState, useEffect } from 'react';
import { Palette, Sparkles, Volume2, VolumeX, Eye, Check, X, Sliders } from 'lucide-react';
import { soundService } from '../services/soundService';

export const THEMES = [
  {
    id: 'cyber-neon',
    name: 'Cyber Neon (2077)',
    description: 'Electric cyan neon, hyper-pink & violet obsidian',
    gradient: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 50%, #ff007f 100%)',
    primary: '#00f0ff',
    accent: '#ff007f',
    vars: {
      '--bg-primary': '#050813',
      '--bg-secondary': '#0a1024',
      '--bg-tertiary': '#101a3a',
      '--primary-gradient': 'linear-gradient(135deg, #00f0ff 0%, #a855f7 50%, #ff007f 100%)',
      '--primary-color': '#00f0ff',
      '--primary-hover': '#38bdf8',
      '--accent-purple': '#a855f7',
      '--accent-cyan': '#00f0ff',
      '--glass-glow': 'rgba(0, 240, 255, 0.28)',
      '--theme-neon': '#00f0ff',
      '--theme-glow': 'rgba(0, 240, 255, 0.35)'
    }
  },
  {
    id: 'quantum-hologram',
    name: 'Quantum Hologram',
    description: 'Deep space holographic blue & hyper-violet HUD',
    gradient: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
    primary: '#38bdf8',
    accent: '#818cf8',
    vars: {
      '--bg-primary': '#040816',
      '--bg-secondary': '#09132e',
      '--bg-tertiary': '#11224d',
      '--primary-gradient': 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
      '--primary-color': '#38bdf8',
      '--primary-hover': '#0284c7',
      '--accent-purple': '#818cf8',
      '--accent-cyan': '#38bdf8',
      '--glass-glow': 'rgba(56, 189, 248, 0.32)',
      '--theme-neon': '#38bdf8',
      '--theme-glow': 'rgba(56, 189, 248, 0.4)'
    }
  },
  {
    id: 'emerald-bio',
    name: 'Matrix Emerald',
    description: 'Hacker terminal digital rain & phosphor green',
    gradient: 'linear-gradient(135deg, #00ff88 0%, #10b981 100%)',
    primary: '#00ff88',
    accent: '#10b981',
    vars: {
      '--bg-primary': '#020a05',
      '--bg-secondary': '#05160c',
      '--bg-tertiary': '#0a2615',
      '--primary-gradient': 'linear-gradient(135deg, #00ff88 0%, #10b981 100%)',
      '--primary-color': '#00ff88',
      '--primary-hover': '#10b981',
      '--accent-purple': '#34d399',
      '--accent-cyan': '#00ff88',
      '--glass-glow': 'rgba(0, 255, 136, 0.28)',
      '--theme-neon': '#00ff88',
      '--theme-glow': 'rgba(0, 255, 136, 0.35)'
    }
  },
  {
    id: 'synthwave-outrun',
    name: 'Synthwave Outrun',
    description: 'Sunset neon orange, hot magenta & retro cyberwave',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    primary: '#f43f5e',
    accent: '#f97316',
    vars: {
      '--bg-primary': '#0e051c',
      '--bg-secondary': '#1a0a33',
      '--bg-tertiary': '#270f4d',
      '--primary-gradient': 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
      '--primary-color': '#f43f5e',
      '--primary-hover': '#fb7185',
      '--accent-purple': '#a855f7',
      '--accent-cyan': '#06b6d4',
      '--glass-glow': 'rgba(244, 63, 94, 0.3)',
      '--theme-neon': '#f43f5e',
      '--theme-glow': 'rgba(244, 63, 94, 0.35)'
    }
  },
  {
    id: 'solar-amber',
    name: 'Cosmic Starlight',
    description: 'Supernova gold, nebula amber & stellar obsidian',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ec4899 100%)',
    primary: '#fbbf24',
    accent: '#f59e0b',
    vars: {
      '--bg-primary': '#06040f',
      '--bg-secondary': '#100b24',
      '--bg-tertiary': '#191238',
      '--primary-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #ec4899 100%)',
      '--primary-color': '#fbbf24',
      '--primary-hover': '#f59e0b',
      '--accent-purple': '#c084fc',
      '--accent-cyan': '#fbbf24',
      '--glass-glow': 'rgba(251, 191, 36, 0.28)',
      '--theme-neon': '#fbbf24',
      '--theme-glow': 'rgba(251, 191, 36, 0.35)'
    }
  },
  {
    id: 'amethyst-void',
    name: 'Amethyst Void',
    description: 'Deep royal purple and twilight cyber indigo',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    primary: '#8b5cf6',
    accent: '#ec4899',
    vars: {
      '--bg-primary': '#0b0614',
      '--bg-secondary': '#120b22',
      '--bg-tertiary': '#1c1233',
      '--primary-gradient': 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      '--primary-color': '#8b5cf6',
      '--primary-hover': '#7c3aed',
      '--accent-purple': '#c084fc',
      '--accent-cyan': '#f472b6',
      '--glass-glow': 'rgba(139, 92, 246, 0.25)',
      '--theme-neon': '#8b5cf6',
      '--theme-glow': 'rgba(139, 92, 246, 0.35)'
    }
  }
];

export function applyTheme(themeId) {
  const selectedTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(selectedTheme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  document.body.className = `theme-${selectedTheme.id}`;
  document.body.setAttribute('data-theme', selectedTheme.id);
  localStorage.setItem('rgit_active_theme', selectedTheme.id);
}

export default function ThemeCustomizerModal({ isOpen, onClose }) {
  const [activeThemeId, setActiveThemeId] = useState(() => {
    return localStorage.getItem('rgit_active_theme') || 'cyber-neon';
  });
  const [isMuted, setIsMuted] = useState(() => soundService.getMuted());
  const [glowIntensity, setGlowIntensity] = useState(() => {
    return localStorage.getItem('rgit_glow_intensity') || 'high';
  });

  useEffect(() => {
    applyTheme(activeThemeId);
  }, [activeThemeId]);

  if (!isOpen) return null;

  const handleSelectTheme = (id) => {
    setActiveThemeId(id);
    applyTheme(id);
    soundService.playClick();
  };

  const handleToggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
    if (!muted) soundService.playSuccess();
  };

  const handleGlowChange = (level) => {
    setGlowIntensity(level);
    localStorage.setItem('rgit_glow_intensity', level);
    const root = document.documentElement;
    if (level === 'high') {
      root.style.setProperty('--glass-glow', 'rgba(59, 130, 246, 0.35)');
    } else if (level === 'soft') {
      root.style.setProperty('--glass-glow', 'rgba(59, 130, 246, 0.12)');
    } else {
      root.style.setProperty('--glass-glow', 'transparent');
    }
    soundService.playClick();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '500px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Palette size={20} style={{ color: 'var(--primary-color)' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Theme & UI Studio</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Customize color palette, ambient lighting & audio feedback
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem' }}>
          {/* Theme Palette Selection */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
              <Sparkles size={14} style={{ color: 'var(--primary-color)' }} /> Select Color Accent
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {THEMES.map((theme) => {
                const isActive = theme.id === activeThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? `1.5px solid ${theme.primary}` : '1px solid var(--glass-border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: theme.gradient,
                          boxShadow: `0 0 10px ${theme.primary}`
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {theme.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {theme.description}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check size={18} style={{ color: theme.primary }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sound & Audio Effects Switcher */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {isMuted ? <VolumeX size={18} style={{ color: '#f87171' }} /> : <Volume2 size={18} style={{ color: '#34d399' }} />}
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Web Audio Feedback</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Synthesized chimes for scans & actions</div>
                </div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`btn ${isMuted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              >
                {isMuted ? 'Muted' : 'Sound ON'}
              </button>
            </div>
          </div>

          {/* Ambient Glow Intensity Selector */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
              <Sliders size={14} style={{ color: 'var(--primary-color)' }} /> Ambient Glow & Blur
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {['high', 'soft', 'none'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleGlowChange(level)}
                  style={{
                    padding: '0.5rem',
                    fontSize: '0.78rem',
                    textTransform: 'capitalize',
                    borderRadius: 'var(--radius-sm)',
                    background: glowIntensity === level ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.05)',
                    color: glowIntensity === level ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {level === 'none' ? 'Minimal' : `${level} Glow`}
                </button>
              ))}
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
