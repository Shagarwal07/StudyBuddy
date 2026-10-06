import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [streak, setStreak] = useState(0);

  const fetchUserData = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setUser(null);
      setStreak(0);
      return;
    }
    try {
      const [userRes, streakRes] = await Promise.allSettled([
        api.get("/auth/me"),
        api.get("/streak")
      ]);
      if (userRes.status === "fulfilled" && userRes.value.data?.user) {
        setUser(userRes.value.data.user);
      }
      if (streakRes.status === "fulfilled") {
        const streakVal =
          streakRes.value.data?.currentStreak ??
          streakRes.value.data?.data?.currentStreak ??
          0;
        setStreak(streakVal);
      }
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserData();
    }
  }, [token, fetchUserData]);

  const login = (jwtToken, userData) => {
    localStorage.setItem("token", jwtToken);
    setToken(jwtToken);
    if (userData) setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("studybuddy_recent_playlist");
    localStorage.removeItem("studybuddy_recent_player");
    setToken(null);
    setUser(null);
    setStreak(0);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      streak,
      setStreak,
      login,
      logout,
      refreshUser: fetchUserData,
      isAuthenticated: !!token,
    }),
    [token, user, streak, fetchUserData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Keep the ESLint ignore rule here to keep the dev environment quiet
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      token: null,
      user: null,
      streak: 0,
      setStreak: () => {},
      login: () => {},
      logout: () => {},
      refreshUser: async () => {},
      isAuthenticated: false,
    };
  }

  return context;
}
