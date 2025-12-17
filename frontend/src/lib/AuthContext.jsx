import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (_token, _user) => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const t = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const uRaw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      setToken(t);
      setUser(uRaw ? JSON.parseSafe?.(uRaw) ?? (() => { try { return JSON.parse(uRaw); } catch { return uRaw; } })() : null);
    } catch {
      setToken(null);
      setUser(null);
    }
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") {
        try {
          const t = localStorage.getItem("token");
          const uRaw = localStorage.getItem("user");
          setToken(t);
          setUser(uRaw ? (() => { try { return JSON.parse(uRaw); } catch { return uRaw; } })() : null);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (newToken, newUser) => {
    try {
      localStorage.setItem("token", newToken);
      if (newUser !== undefined) {
        const toStore = typeof newUser === "string" ? newUser : JSON.stringify(newUser);
        localStorage.setItem("user", toStore);
      }
    } catch {}
    setToken(newToken);
    setUser(newUser ?? null);
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
