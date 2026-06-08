import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAuthToken } from "../lib/api";

/* Context provider co-located with consumer hook (standard React pattern). */
/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      const next = res.data?.user ?? null;
      if (
        next &&
        typeof next === "object" &&
        next.is_admin !== true &&
        next.email_verified !== true
      ) {
        setAuthToken(null);
        setUser(null);
        return;
      }
      if (
        next &&
        typeof next === "object" &&
        next.is_admin !== true &&
        next.account_suspended === true
      ) {
        setAuthToken(null);
        setUser(null);
        return;
      }
      setUser(next);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setAuthToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    function onAuthCleared() {
      setUser(null);
    }
    window.addEventListener("ajfitness:auth-cleared", onAuthCleared);
    return () => window.removeEventListener("ajfitness:auth-cleared", onAuthCleared);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      refreshMe,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, refreshMe],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
