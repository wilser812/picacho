"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, TOKEN_STORAGE_KEY, type ApiUser } from "@/lib/api";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  becomeVendor: (storeName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUser() {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<ApiUser>("/auth/me");
      setUser(me);
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: ApiUser }>("/auth/login", {
      email,
      password,
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setUser(res.user);
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: ApiUser }>("/auth/register", {
      name,
      email,
      password,
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setUser(res.user);
  }

  async function becomeVendor(storeName: string) {
    const res = await api.post<{ accessToken: string; user: ApiUser }>("/vendor/register", {
      storeName,
    });
    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, becomeVendor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
