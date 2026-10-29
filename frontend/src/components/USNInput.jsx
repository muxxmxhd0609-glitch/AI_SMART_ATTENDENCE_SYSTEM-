import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, CheckCircle2, Lock } from 'lucide-react';
import { getDeptBranchCode, buildRGITUsn, parseRGITUsn } from '../constants/courses';

/**
 * USNInput Component
 * Enforces the strict RGIT VTU USN structure:
 * 1RG (Fixed in mandatory grey text)
 * + YY (2-digit Year of Joining typed by student)
 * + BRANCH (2-letter Department Code auto-filled from selected department)
 * + NNN (3-digit College Allotted Roll Number typed by student, not more not less)
 * Example: 1RG24CS409
 */
export default function USNInput({
  value = '',
  onChange,
  department = 'Computer Science & Engineering',
  id = 'usn-composite-input',
  disabled = false,
  autoFocus = false,
  size = 'normal',
  showHelpText = true
}) {
  const branchCode = getDeptBranchCode(department);
  const yearInputRef = useRef(null);
  const rollInputRef = useRef(null);

  // Parse external value into year & roll
  const parsed = parseRGITUsn(value);
  const [year, setYear] = useState(parsed.year || '');
  const [roll, setRoll] = useState(parsed.roll || '');

  // Synchronize when value changes externally (e.g. student picks quick chip)
  useEffect(() => {
    const p = parseRGITUsn(value);
    setYear(p.year || '');
    setRoll(p.roll || '');
  }, [value]);

  // Synchronize when department changes externally
  useEffect(() => {
    if (year || roll) {
      const full = buildRGITUsn(year, branchCode, roll);
      if (onChange && full !== value) {
        onChange(full);
      }
    }
  }, [branchCode]);

  const handleYearChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
    setYear(raw);
    const full = buildRGITUsn(raw, branchCode, roll);
    if (onChange) onChange(full);

    // Auto-advance focus to Roll Number input once 2 digits are entered
    if (raw.length === 2 && rollInputRef.current) {
      rollInputRef.current.focus();
    }
  };

  const handleRollChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
    setRoll(raw);
    const full = buildRGITUsn(year, branchCode, raw);
    if (onChange) onChange(full);
  };

  const handleRollKeyDown = (e) => {
    // If backspacing on empty roll input, jump back to year input
    if (e.key === 'Backspace' && (!roll || roll.length === 0) && yearInputRef.current) {
      yearInputRef.current.focus();
    }
  };

  // Smart Paste Handler (e.g. user pastes full "1RG24CS409" or "24CS409")
  const handlePaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    const clean = pasted.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) return;

    e.preventDefault();
    // Match 1RG? + (YY) + (Dept)? + (NNN)
    const match = clean.match(/(?:1RG)?(\d{2})(?:[A-Z]{2})?(\d{1,3})/);
    if (match) {
      const pYear = match[1] || '';
      const pRoll = (match[2] || '').slice(0, 3);
      setYear(pYear);
      setRoll(pRoll);
      const full = buildRGITUsn(pYear, branchCode, pRoll);
      if (onChange) onChange(full);
      if (rollInputRef.current) rollInputRef.current.focus();
    } else {
      // Just extract any 2-digit or 3-digit digits
      const digits = clean.replace(/\D/g, '');
      if (digits.length >= 2) {
        const pYear = digits.slice(0, 2);
        const pRoll = digits.slice(2, 5);
        setYear(pYear);
        setRoll(pRoll);
        const full = buildRGITUsn(pYear, branchCode, pRoll);
        if (onChange) onChange(full);
      }
    }
  };

  const fullUsn = buildRGITUsn(year, branchCode, roll);
  const isComplete = fullUsn.length === 10 && year.length === 2 && roll.length === 3;

  return (
    <div style={{ width: '100%' }}>
      {/* Unified Input Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(15, 23, 42, 0.75)',
          border: isComplete ? '1.5px solid #10b981' : (fullUsn.length > 5 ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.15)'),
          borderRadius: 'var(--radius-md, 10px)',
          padding: size === 'large' ? '0.65rem 0.85rem' : '0.5rem 0.75rem',
          boxShadow: isComplete ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none',
          transition: 'all 0.2s ease',
          position: 'relative',
          flexWrap: 'nowrap'
        }}
      >
        {/* PART 1: 1RG (Fixed Mandatory in Grey Text) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            userSelect: 'none',
            flexShrink: 0
          }}
          title="Fixed mandatory college code for all Rajiv Gandhi Institute of Technology students"
        >
          <GraduationCap size={15} style={{ color: '#94a3b8' }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: size === 'large' ? '1.1rem' : '0.98rem',
              color: '#94a3b8', // Mandatory grey text
              letterSpacing: '0.05em'
            }}
          >
            1RG
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              color: '#64748b',
              fontWeight: 700,
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '1px 4px',
              borderRadius: '3px',
              textTransform: 'uppercase'
            }}
          >
            FIXED
          </span>
        </div>

        {/* PART 2: Year of Joining Input (2 Digits) */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <input
            ref={yearInputRef}
            type="text"
            id={`${id}-year`}
            inputMode="numeric"
            maxLength={2}
            disabled={disabled}
            autoFocus={autoFocus}
            value={year}
            onChange={handleYearChange}
            onPaste={handlePaste}
            placeholder="24"
            style={{
              width: size === 'large' ? '46px' : '42px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: size === 'large' ? '1.1rem' : '1rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.1)',
              border: year.length === 2 ? '1.5px solid #10b981' : '1px dashed rgba(52, 211, 153, 0.5)',
              borderRadius: '6px',
              padding: '0.35rem 0.2rem',
              outline: 'none',
              transition: 'border 0.2s ease'
            }}
            title="Year of college joining (2 digits, e.g. 24 for 2024)"
          />
        </div>

        {/* PART 3: Department Branch Code (Auto-written & Locked) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1.5px solid rgba(56, 189, 248, 0.4)',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            userSelect: 'none',
            flexShrink: 0
          }}
          title={`Auto-assigned from selected department: ${department}`}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: size === 'large' ? '1.1rem' : '0.98rem',
              color: '#38bdf8',
              letterSpacing: '0.05em'
            }}
          >
            {branchCode}
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              color: '#38bdf8',
              fontWeight: 700,
              background: 'rgba(56, 189, 248, 0.2)',
              padding: '1px 4px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <Lock size={8} /> DEPT
          </span>
        </div>

        {/* PART 4: College Roll Number Input (3 Digits Only) */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flex: 1, minWidth: '60px' }}>
          <input
            ref={rollInputRef}
            type="text"
            id={`${id}-roll`}
            inputMode="numeric"
            maxLength={3}
            disabled={disabled}
            value={roll}
            onChange={handleRollChange}
            onKeyDown={handleRollKeyDown}
            onPaste={handlePaste}
            placeholder="409"
            style={{
              width: '100%',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: size === 'large' ? '1.1rem' : '1rem',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.1)',
              border: roll.length === 3 ? '1.5px solid #f59e0b' : '1px dashed rgba(245, 158, 11, 0.5)',
              borderRadius: '6px',
              padding: '0.35rem 0.4rem',
              outline: 'none',
              letterSpacing: '0.08em',
              transition: 'border 0.2s ease'
            }}
            title="College allotted roll number (exactly 3 digits, e.g. 409 or 002)"
          />
        </div>

        {/* Complete Status Pill */}
        <div style={{ flexShrink: 0, paddingLeft: '4px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: isComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isComplete ? '#34d399' : '#94a3b8',
              border: `1px solid ${isComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isComplete ? (
              <>
                <CheckCircle2 size={12} style={{ color: '#34d399' }} /> {fullUsn}
              </>
            ) : (
              <>{fullUsn.length}/10</>
            )}
          </span>
        </div>
      </div>

      {/* Guided Breakdown Help Text */}
      {showHelpText && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px',
            marginTop: '0.35rem',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            Structure: <strong style={{ color: '#94a3b8' }}>1RG</strong> (Fixed College Prefix) +{' '}
            <strong style={{ color: '#34d399' }}>{year || 'YY'}</strong> (Joining Year) +{' '}
            <strong style={{ color: '#38bdf8' }}>{branchCode}</strong> (Auto-Dept) +{' '}
            <strong style={{ color: '#fbbf24' }}>{roll || 'NNN'}</strong> (3 Digits Roll)
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', color: isComplete ? '#34d399' : '#fbbf24', fontWeight: 600 }}>
            {isComplete ? '✓ Exact 10 Credentials' : '3 numbers only (e.g. 002, 409)'}
          </div>
        </div>
      )}
    </div>
  );
}
