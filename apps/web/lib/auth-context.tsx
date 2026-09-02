"use client";

import * as React from "react";
import { api, ApiUser } from "./api";

interface AuthContextType {
  user: ApiUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signin: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "upgrid_token";
const USER_KEY = "upgrid_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken) {
        setToken(savedToken);
      }
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signin = React.useCallback(async (username: string, password: string) => {
    const res = await api.signin(username, password);
    const jwtToken = res.jwt;

    setToken(jwtToken);
    const currentUser: ApiUser = { id: "", username };
    setUser(currentUser);

    try {
      localStorage.setItem(TOKEN_KEY, jwtToken);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const signup = React.useCallback(
    async (username: string, password: string) => {
      await api.signup(username, password);
      await signin(username, password);
    },
    [signin]
  );

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore localStorage errors
    }
    if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        signin,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
