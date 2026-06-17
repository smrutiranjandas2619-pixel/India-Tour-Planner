import React, { useState, useEffect, useRef } from 'react';

const OTPVerification = ({ phoneNumber, onVerify, onResend, onChangeNumber, loading: parentLoading, error: parentError }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Auto-focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleChange = (index, value) => {
    // Only accept numeric input
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // Take the last character if multiple are entered (e.g. autocomplete)
    newOtp[index] = cleanValue.substring(cleanValue.length - 1);
    setOtp(newOtp);
    setError('');

    // Focus next input if not the last one
    if (index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Focus previous input and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) {
      setError('Please paste a valid 6-digit verification code.');
      return;
    }

    const digits = pastedData.split('');
    setOtp(digits);
    setError('');
    
    // Focus last input box
    if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      await onVerify(otpCode);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifying(false);
    }
  };

  // Trigger submission automatically when all 6 digits are typed
  useEffect(() => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      handleSubmit();
    }
  }, [otp]);

  const handleResendClick = async () => {
    if (cooldown > 0) return;
    setError('');
    try {
      await onResend();
      setCooldown(60);
      setOtp(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  const displayError = error || parentError;
  const isLoading = verifying || parentLoading;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 font-bold uppercase">Enter Verification Code</label>
        <p className="text-[11px] text-slate-400">
          We sent a 6-digit OTP code to <span className="text-white font-bold">{phoneNumber}</span>.{' '}
          <span onClick={onChangeNumber} className="text-sunsetCoral hover:underline cursor-pointer font-semibold">Change</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 6 OTP Inputs */}
        <div className="flex justify-between gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="glass-input w-11 h-12 text-center text-lg font-bold text-white focus:border-sunsetCoral rounded-xl transition duration-200"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {displayError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{displayError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || otp.join('').length < 6}
          className="w-full py-3 mt-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-md shadow-sunsetCoral/10 text-xs uppercase tracking-wider disabled:brightness-75 disabled:cursor-not-allowed"
        >
          {isLoading ? "Verifying Code..." : "Verify & Continue"}
        </button>

        <div className="text-center text-xs mt-1">
          {cooldown > 0 ? (
            <span className="text-slate-500">Resend code in <strong className="text-slate-300">{cooldown}s</strong></span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              className="text-marigoldGold font-bold hover:underline transition"
            >
              Resend Verification Code
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;
