export const phoneLoginApi = async (idToken) => {
  const res = await fetch('/api/auth/phone-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  if (!res.ok) {
    let errMsg = "Verification failed.";
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return await res.json();
};

export const phoneSignupApi = async (name, idToken) => {
  const res = await fetch('/api/auth/phone-signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, idToken })
  });
  if (!res.ok) {
    let errMsg = "Registration failed.";
    try {
      const err = await res.json();
      errMsg = err.detail || errMsg;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return await res.json();
};
