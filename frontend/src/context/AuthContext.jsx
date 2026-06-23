  import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login session status on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return { success: true };
    } else {
      let errMsg = "Invalid credentials.";
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch (e) {
        errMsg = `Server error (${res.status}). The backend server may be offline or restarting.`;
      }
      throw new Error(errMsg);
    }
  };

  const signup = async (name, email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    if (res.ok) {
      return { success: true };
    } else {
      let errMsg = "Sign up failed.";
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch (e) {
        errMsg = `Server error (${res.status}). The backend server may be offline or restarting.`;
      }
      throw new Error(errMsg);
    }
  };

  const loginWithPhone = async (name, idToken, isSignup) => {
    const endpoint = isSignup ? '/api/auth/phone-signup' : '/api/auth/phone-login';
    const body = isSignup ? { name, idToken } : { idToken };
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return { success: true };
    } else {
      let errMsg = "Verification failed.";
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
  };

  const loginWithGoogle = async (idToken, email, name, avatar) => {
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, email, name, avatar })
    });
    
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      return { success: true };
    } else {
      let errMsg = "Google login failed.";
      try {
        const err = await res.json();
        errMsg = err.detail || errMsg;
      } catch (e) {}
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        return { success: true };
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, loginWithPhone, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

