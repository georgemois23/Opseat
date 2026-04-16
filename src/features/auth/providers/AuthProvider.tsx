import React, { createContext, useState, useEffect, useCallback, ReactNode } from "react";
import api from "@/lib/axios";
import { User } from "../types/auth.types";
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  /** True only while checking session on first app load (shows global spinner). */
  isLoading: boolean;
  /** True during login / signup API calls — does not unmount auth pages. */
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, firstname: string, lastname: string) => Promise<void>;
  logout: () => Promise<void>;
  errorMessage: string | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchUser();
      if (!cancelled) {
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      await api.post("/auth/login", { email, password });
      await fetchUser();
    } catch (err: any) {
      setErrorMessage("Invalid credentials");
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginWithGoogle = async () => {
    setErrorMessage(null);
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  const register = async (email: string, password: string, firstname: string, lastname: string) => {
    setIsAuthenticating(true);
    try {
      await api.post("/auth/signup", { email, password, first_name: firstname, last_name: lastname });
      await fetchUser();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isAuthenticating,
        login,
        loginWithGoogle,
        logout,
        errorMessage,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}