import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { secureStorage } from "@/lib/secure-storage";

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role?: string;
  team?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: "github" | "google") => void;
  register: (data: { username: string; email: string; password: string; name: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "llmf_token";
const USER_KEY = "llmf_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const checkAuth = useCallback(async () => {
    try {
      // Try to get stored token
      const storedToken = secureStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Verify token with server
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setToken(storedToken);
        secureStorage.setItem(USER_KEY, JSON.stringify(userData));
      } else {
        // Token invalid - clear storage
        secureStorage.removeItem(TOKEN_KEY);
        secureStorage.removeItem(USER_KEY);
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      // Network error - try to use cached user data
      console.warn("Auth check failed, using cached data if available");
      const cachedUser = secureStorage.getItem(USER_KEY);
      const cachedToken = secureStorage.getItem(TOKEN_KEY);

      if (cachedUser && cachedToken) {
        try {
          setUser(JSON.parse(cachedUser));
          setToken(cachedToken);
        } catch {
          // Invalid cached data
          secureStorage.removeItem(TOKEN_KEY);
          secureStorage.removeItem(USER_KEY);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Login failed" }));
        return { success: false, error: data.error || "Invalid credentials" };
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      secureStorage.setItem(TOKEN_KEY, data.token);
      secureStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const loginWithOAuth = (provider: "github" | "google") => {
    // Redirect to OAuth flow
    window.location.href = `/api/auth/${provider}`;
  };

  const register = async (data: { username: string; email: string; password: string; name: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Registration failed" }));
        return { success: false, error: result.error || "Registration failed" };
      }

      const result = await response.json();
      setUser(result.user);
      setToken(result.token);
      secureStorage.setItem(TOKEN_KEY, result.token);
      secureStorage.setItem(USER_KEY, JSON.stringify(result.user));
      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(USER_KEY);
      setLocation("/login");
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      secureStorage.setItem(USER_KEY, JSON.stringify(updated));
    }
  };

  const refreshToken = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        secureStorage.setItem(TOKEN_KEY, data.token);
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        loginWithOAuth,
        register,
        logout,
        updateUser,
        refreshToken,
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

// Hook for making authenticated API requests
export function useAuthFetch() {
  const { token, logout, refreshToken } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // Handle token expiration
    if (response.status === 401) {
      try {
        await refreshToken();
        // Retry the request with new token
        const newToken = secureStorage.getItem(TOKEN_KEY);
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          return fetch(url, { ...options, headers, credentials: "include" });
        }
      } catch {
        logout();
      }
    }

    return response;
  };

  return authFetch;
}

// Get token for external use (WebSocket, etc.)
export function getAuthToken(): string | null {
  return secureStorage.getItem(TOKEN_KEY);
}

