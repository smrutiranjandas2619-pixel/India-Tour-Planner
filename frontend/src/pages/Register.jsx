import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PhoneSignup from '../components/auth/PhoneSignup';
import { auth, GoogleAuthProvider, signInWithPopup } from '../services/firebase';

const Register = () => {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'phone'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
      // Seamless redirect directly to login view without blocking alert!
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Sign Up Failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartySignup = async () => {
    setError('');
    setLoading(true);
    try {
      if (auth) {
        const providerInstance = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, providerInstance);
        const idToken = await result.user.getIdToken();
        const userEmail = result.user.email;
        const userName = result.user.displayName;
        const userAvatar = result.user.photoURL;
        
        await loginWithGoogle(idToken, userEmail, userName, userAvatar);
        navigate('/dashboard');
        window.location.reload();
      } else {
        // Fallback to Simulated Mode but ASK for their details so it's not "Google Traveler"!
        const userEmail = prompt("Firebase Client SDK is in Demo Mode.\n\nEnter your email to simulate signing up with Google:", email || "name@domain.com");
        if (!userEmail) {
          setLoading(false);
          return;
        }
        const userName = prompt("Enter your display name for your profile:", userEmail.split('@')[0]);
        if (!userName) {
          setLoading(false);
          return;
        }
        
        await loginWithGoogle("simulated_dummy_token:google", userEmail.trim(), userName.trim());
        navigate('/dashboard');
        window.location.reload();
      }
    } catch (err) {
      console.error("Google Auth failed:", err);
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex items-center justify-center min-h-[65vh] w-full p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md p-6 md:p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-white">Create Account</h2>
          <p className="text-xs text-slate-400">Start planning custom optimized day-wise itineraries across India</p>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-[rgba(255,255,255,0.06)] mb-2 relative">
          <button 
            type="button"
            onClick={() => { setActiveTab('email'); setError(''); }}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 relative ${activeTab === 'email' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Email
            {activeTab === 'email' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sunsetCoral to-marigoldGold"></span>
            )}
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('phone'); setError(''); }}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 relative ${activeTab === 'phone' ? 'text-white font-extrabold' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Phone
            {activeTab === 'phone' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-sunsetCoral to-marigoldGold"></span>
            )}
          </button>
        </div>

        {activeTab === 'email' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => { setError(''); setName(e.target.value); }}
                required 
                className="glass-input p-3 text-xs w-full" 
                placeholder="Your Name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => { setError(''); setEmail(e.target.value); }}
                required 
                className="glass-input p-3 text-xs w-full" 
                placeholder="name@domain.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => { setError(''); setPassword(e.target.value); }}
                required 
                className="glass-input p-3 text-xs w-full" 
                placeholder="Min 6 characters"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-sunsetCoral to-marigoldGold text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition shadow-md shadow-sunsetCoral/10 text-xs uppercase tracking-wider disabled:brightness-75"
            >
              {loading ? "PERSISTING ACCOUNT SECURELY..." : "Create Free Account"}
            </button>
          </form>
        ) : (
          <PhoneSignup />
        )}

        {/* Third Party Divider */}
        <div className="flex items-center gap-3 my-1">
          <span className="h-[1px] bg-slate-800 flex-grow"></span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">OR</span>
          <span className="h-[1px] bg-slate-800 flex-grow"></span>
        </div>

        <button 
          onClick={handleThirdPartySignup}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 border border-[rgba(255,255,255,0.06)] hover:bg-slate-800 active:scale-[0.98] rounded-xl text-xs font-bold text-white transition disabled:brightness-75"
        >
          <i className="fa-brands fa-google text-rose-400"></i> Sign Up with Google
        </button>

        <div className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-sunsetCoral font-bold hover:underline">Log In Here</Link>
        </div>

        {/* Container for Firebase Invisible reCAPTCHA */}
        <div id="recaptcha-container"></div>
      </div>
    </section>
  );
};

export default Register;
