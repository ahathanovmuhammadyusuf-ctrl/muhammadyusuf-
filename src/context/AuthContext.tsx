import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';

interface AuthContextType {
  user: Profile | null;
  token: string | null;
  isLoading: boolean;
  loginAsTeacher: (password?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: (password?: string) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (role: 'student' | 'teacher' | 'admin') => Promise<{ success: boolean; error?: string }>;
  directStudentLogin: (params: {
    first_name: string;
    last_name: string;
    phone: string;
  }) => Promise<{ success: boolean; error?: string }>;
  requestStudentCode: (params: {
    phone: string;
    first_name: string;
    last_name: string;
    group_id?: string;
  }) => Promise<{ success: boolean; message: string; demoCode?: string; expiresAt?: number }>;
  verifyStudentCode: (params: { phone: string; code: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRoleDemo: (role: 'student' | 'teacher' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'tp_auth_token';
const USER_KEY = 'tp_auth_user';
const EXPIRY_KEY = 'tp_auth_expiry';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on load (30-day persistence)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      const storedExpiry = localStorage.getItem(EXPIRY_KEY);

      if (storedToken && storedUser && storedExpiry) {
        const expiryTime = Number(storedExpiry);
        if (Date.now() < expiryTime) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Session expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(EXPIRY_KEY);
        }
      }
    } catch (e) {
      console.warn('Session parse error', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (authToken: string, authUser: Profile) => {
    const expiry = Date.now() + THIRTY_DAYS_MS;
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    localStorage.setItem(EXPIRY_KEY, expiry.toString());
  };

  const loginAsTeacher = async (password?: string) => {
    try {
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Kirishda xatolik yuz berdi" };
      }
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        return { success: true };
      }
      return { success: false, error: "Noma'lum javob qaytdi" };
    } catch (e: any) {
      console.error('Teacher login failed', e);
      return { success: false, error: e?.message || "O'qituvchi sifatida kirishda xatolik" };
    }
  };

  const requestStudentCode = async (params: {
    phone: string;
    first_name: string;
    last_name: string;
    group_id?: string;
  }) => {
    const res = await fetch('/api/auth/student-request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Kod so'rashda xatolik yuz berdi");
    }
    return data;
  };

  const verifyStudentCode = async (params: { phone: string; code: string }) => {
    const res = await fetch('/api/auth/student-verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Kodni tasdiqlashda xatolik' };
    }
    if (data.token && data.user) {
      saveSession(data.token, data.user);
      return { success: true };
    }
    return { success: false, error: 'Kutilmagan xatolik' };
  };

  const directStudentLogin = async (params: {
    first_name: string;
    last_name: string;
    phone: string;
  }) => {
    try {
      const res = await fetch('/api/auth/student-direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Kirishda xatolik yuz berdi' };
      }
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        return { success: true };
      }
      return { success: false, error: "Noma'lum javob qaytdi" };
    } catch (e: any) {
      return { success: false, error: e?.message || "Tizimga kirishda xatolik yuz berdi" };
    }
  };

  const loginAsAdmin = async (password?: string) => {
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || 'admin123' }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Admin sifatida kirishda xatolik' };
      }
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        return { success: true };
      }
      return { success: false, error: "Noma'lum javob qaytdi" };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Admin login muvaffaqiyatsiz' };
    }
  };

  const quickDemoLogin = async (role: 'student' | 'teacher' | 'admin') => {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Demo kirishda xatolik' };
      }
      if (data.token && data.user) {
        saveSession(data.token, data.user);
        return { success: true };
      }
      return { success: false, error: "Noma'lum javob qaytdi" };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Demo kirish amalga oshmadi' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRY_KEY);
  };

  const switchRoleDemo = (role: 'student' | 'teacher' | 'admin') => {
    quickDemoLogin(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginAsTeacher,
        loginAsAdmin,
        quickDemoLogin,
        directStudentLogin,
        requestStudentCode,
        verifyStudentCode,
        logout,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
