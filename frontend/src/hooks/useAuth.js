import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // İlk yükleme — localStorage'dan oku
  useEffect(() => {
    const savedToken = localStorage.getItem("campusgame_token");
    const savedUser = localStorage.getItem("campusgame_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Backend'den doğrula
      authAPI.me()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("campusgame_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token geçersiz
          localStorage.removeItem("campusgame_token");
          localStorage.removeItem("campusgame_user");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Logout event dinle
  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("campusgame_token", newToken);
    localStorage.setItem("campusgame_user", JSON.stringify(newUser));
    return newUser;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("campusgame_token", newToken);
    localStorage.setItem("campusgame_user", JSON.stringify(newUser));
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem("campusgame_token");
    localStorage.removeItem("campusgame_user");
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem("campusgame_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
