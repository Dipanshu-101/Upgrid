"use client";

import * as React from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
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
  const { data: session, status } = useSession();

  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Sync NextAuth OAuth sessions into local state + localStorage
  React.useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session) {
      const apiToken = (session as any).apiToken as string | undefined;
      const oauthUser: ApiUser = {
        id: session.user?.id ?? "",
        username: session.user?.name ?? session.user?.email ?? "operator",
      };

      if (apiToken) {
        setToken(apiToken);
        setUser(oauthUser);
        try {
          localStorage.setItem(TOKEN_KEY, apiToken);
          localStorage.setItem(USER_KEY, JSON.stringify(oauthUser));
        } catch {
          // Ignore localStorage errors
        }
      } else {
        // OAuth session without apiToken yet — fall back to localStorage
        try {
          const savedToken = localStorage.getItem(TOKEN_KEY);
          const savedUser = localStorage.getItem(USER_KEY);
          if (savedToken) setToken(savedToken);
          if (savedUser) setUser(JSON.parse(savedUser));
        } catch {
          // Ignore localStorage errors
        }
      }
      setIsLoading(false);
      return;
    }

    // No NextAuth session — load from localStorage (username/password auth)
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch {
      // Ignore localStorage errors
    }
    setIsLoading(false);
  }, [status, session]);

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
    // Sign out of NextAuth session if active (OAuth users)
    if (status === "authenticated") {
      nextAuthSignOut({ callbackUrl: "/signin" });
    } else if (typeof window !== "undefined") {
      window.location.href = "/signin";
    }
  }, [status]);

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
