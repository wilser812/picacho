import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, loadToken, saveToken, clearToken, type ApiUser } from "../lib/api";
import { registerForPushNotifications } from "../lib/notifications";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.get<ApiUser>("/auth/me");
        setUser(me);
        registerForPushNotifications();
      } catch {
        await clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: ApiUser }>("/auth/login", {
      email,
      password,
    });
    await saveToken(res.accessToken);
    setUser(res.user);
    registerForPushNotifications();
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<{ accessToken: string; user: ApiUser }>("/auth/register", {
      name,
      email,
      password,
    });
    await saveToken(res.accessToken);
    setUser(res.user);
    registerForPushNotifications();
  }

  async function logout() {
    await clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
