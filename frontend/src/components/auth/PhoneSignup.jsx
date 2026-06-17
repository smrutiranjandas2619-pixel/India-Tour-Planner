import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from '../../services/firebase';
import OTPVerification from './OTPVerification';

const PhoneSignup = () => {
  const { loginWithPhone } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [formattedPhone, setFormattedPhone] = useState('');

  // Clean up reCAPTCHA verifier if any on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.error("Error clearing Recaptcha:", e);
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const validatePhone = (num) => {
    const cleanNum = num.replace(/[^\d+]/g, '');
    
    if (/^\+91\d{10}$/.test(cleanNum)) {
      return cleanNum;
    }
    
    if (/^\d{10}$/.test(cleanNum)) {
      return `+91${cleanNum}`;
    }
    
    if (/^91\d{10}$/.test(cleanNum)) {
      return `+${cleanNum}`;
    }
    
    return null;
  };

  const setupRecaptcha = () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response) => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      }
    } catch (err) {
      console.error("reCAPTCHA configuration error:", err);
      setError("Failed to initialize verification system. Please try again.");
    }
  };

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    const validNum = validatePhone(phone.trim());
    if (!validNum) {
      setError('Please enter a valid 10-digit mobile number.');
      setLoading(false);
      return;
    }

    setFormattedPhone(validNum);

    const isDemoMode = !auth || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('here');
    if (isDemoMode) {
      setTimeout(() => {
        setConfirmationResult({
          confirm: async (code) => {
            if (code === '123456') {
              return {
                user: {
                  getIdToken: async () => `simulated_dummy_token:${validNum}`
                }
              };
            } else {
              throw new Error('Invalid verification code. Enter 123456 to test successfully in Demo Mode.');
            }
          }
        });
        setLoading(false);
      }, 1000);
      return;
    }

    setupRecaptcha();

    try {
      const appVerifier = window.recaptchaVerifier;
      if (!appVerifier) {
        throw new Error("Verification container not found. Try refreshing the page.");
      }
      const confirmation = await signInWithPhoneNumber(auth, validNum, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err) {
      console.error("SMS Send Error:", err);
      let friendlyMessage = err.message;
      if (err.code === 'auth/invalid-phone-number') {
        friendlyMessage = 'The phone number you entered is invalid. Use a 10-digit number.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many requests. Please wait a while before trying again.';
      }
      setError(friendlyMessage || 'Unable to send OTP. Please check your connection and configuration.');
      
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    if (!confirmationResult) {
      throw new Error('Verification session has expired. Please request a new OTP.');
    }

    const userCredential = await confirmationResult.confirm(otpCode);
    const idToken = await userCredential.user.getIdToken();
    
    // Call backend endpoint to verify token, check/create user, and set session
    await loginWithPhone(name.trim(), idToken, true);
    
    // Success, redirect to dashboard
    navigate('/dashboard');
    window.location.reload();
  };

  if (confirmationResult) {
    return (
      <OTPVerification
        phoneNumber={formattedPhone}
        onVerify={handleVerifyOTP}
        onResend={handleSendOTP}
        onChangeNumber={() => setConfirmationResult(null)}
        loading={loading}
        error={error}
      />
    );
  }

  const isDemoMode = !auth || !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('here');

  return (
    <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
      {isDemoMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] rounded-xl flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold">
            <i className="fa-solid fa-triangle-exclamation text-[10px]"></i>
            <span>DEVELOPER DEMO MODE ACTIVE</span>
          </div>
          <p className="text-slate-400 font-medium leading-normal">Firebase credentials are not configured. You can test using any mobile number and verification code <strong className="text-white font-bold">123456</strong>.</p>
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setError('');
            setName(e.target.value);
          }}
          required
          placeholder="Your Full Name"
          className="glass-input p-3 text-xs w-full"
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number (India)</label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">+91</span>
          <input
            type="tel"
            value={phone.startsWith('+91') ? phone.slice(3) : phone}
            onChange={(e) => {
              setError('');
              setPhone(e.target.value);
            }}
            required
            placeholder="Enter 10-digit mobile number"
            className="glass-input pl-11 pr-3 py-3 text-xs w-full"
            disabled={loading}
          />
        </div>
        <p className="text-[9px] text-slate-500">e.g. 9876543210 (prefixed with +91 automatically)</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !phone.trim() || !name.trim()}
        className="w-full py-3 mt-1 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-md shadow-sunsetCoral/10 text-xs uppercase tracking-wider disabled:brightness-75 disabled:cursor-not-allowed"
      >
        {loading ? "Sending Verification OTP..." : "Get OTP Verification Code"}
      </button>
    </form>
  );
};

export default PhoneSignup;
