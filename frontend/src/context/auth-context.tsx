"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, UserResponse, TokenResponse } from "@/lib/api";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, companyName?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Restore user session on mount
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await api.get<UserResponse>("/auth/me");
        setUser(currentUser);
      } catch (err) {
        console.error("Session restore failed", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<TokenResponse>("/auth/login", {
        username: email, // standard login field
        password,
      }, false);

      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    fullName: string,
    companyName?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await api.post<UserResponse>("/auth/signup", {
        email,
        password,
        full_name: fullName,
        company_name: companyName || null,
      }, false);

      // Auto login after successful signup
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Signup failed. Email might already be taken.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
