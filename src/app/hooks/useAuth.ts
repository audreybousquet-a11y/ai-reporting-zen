/**
 * useAuth.ts — Hook d'authentification
 */
import { useState, useEffect } from "react";
import { User, login as apiLogin } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("aria_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    const resp = await apiLogin(username, password);
    if (resp.success && resp.user) {
      setUser(resp.user);
      localStorage.setItem("aria_user", JSON.stringify(resp.user));
      return null;
    }
    return resp.error || "Identifiants incorrects";
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aria_user");
  };

  return { user, loading, login, logout };
}
