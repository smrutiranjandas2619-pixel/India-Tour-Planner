  import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, onAuthStateChanged, signOut } from '../services/firebase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check login session status on startup
  useEffect(() => {
    let unsubscribe = () => {};

    const checkAuth = async () => {
      // 1. Try backend session first
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Auth initialization backend check failed:", err);
      }

      // 2. If no backend session, check if there's a persisted Firebase user
      if (auth) {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const idToken = await firebaseUser.getIdToken();
              const email = firebaseUser.email;
              const name = firebaseUser.displayName || email?.split('@')[0] || "User";
              const avatar = firebaseUser.photoURL;
              const isPhone = !email && firebaseUser.phoneNumber;

              let res;
              if (isPhone) {
                res = await fetch('/api/auth/phone-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken })
                });
              } else {
                res = await fetch('/api/auth/google-login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken, email, name, avatar })
                });
              }

              if (res && res.ok) {
                const data = await res.json();
                setUser(data.user);
              } else {
                setUser(null);
              }
            } catch (err) {
              console.error("Auto-restoring Firebase session on backend failed:", err);
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        // Fallback for simulated/demo mode:
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      unsubscribe();
    };
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
      if (auth) {
        await signOut(auth);
      }
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

