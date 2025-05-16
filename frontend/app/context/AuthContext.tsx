"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  email: string;
  skin_tone?: string;
  preferences?: {
    gender?: string;
    occasion?: string;
    footwear?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (
    gender: string,
    occasion: string,
    footwear: string
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchUserData(storedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // If we can't fetch user data, clear the stored token
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      setUser({ email });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const googleLogin = async (token: string) => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/google-auth",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        }
      );

      if (!response.ok) {
        throw new Error("Google login failed");
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      await fetchUserData(data.access_token);
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem("token", data.access_token);
      setUser({ email });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  const updatePreferences = async (
    gender: string,
    occasion: string,
    footwear: string
  ) => {
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ gender, occasion, footwear }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              preferences: { gender, occasion, footwear },
            }
          : null
      );
    } catch (error) {
      console.error("Update preferences error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserData(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        googleLogin,
        logout,
        updatePreferences,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
