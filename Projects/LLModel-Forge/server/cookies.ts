/**
 * Cookie & Session Configuration
 *
 * Enterprise-grade cookie management with:
 * - Secure cookie settings
 * - CSRF protection
 * - Session management
 * - Remember me functionality
 */

import { CookieOptions, Request, Response } from "express";

// Cookie names
export const COOKIE_NAMES = {
  SESSION: "llmf_session",
  TOKEN: "llmf_token",
  REFRESH_TOKEN: "llmf_refresh",
  CSRF: "llmf_csrf",
  REMEMBER_ME: "llmf_remember",
  PREFERENCES: "llmf_prefs",
} as const;

// Base cookie options
const BASE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

// Cookie configurations
export const COOKIE_CONFIG = {
  // Session cookie - expires when browser closes
  session: {
    ...BASE_COOKIE_OPTIONS,
    maxAge: undefined, // Session cookie
  } as CookieOptions,

  // Auth token - 7 days
  token: {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  } as CookieOptions,

  // Refresh token - 30 days
  refreshToken: {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  } as CookieOptions,

  // Remember me - 90 days
  rememberMe: {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  } as CookieOptions,

  // CSRF token - accessible by client JS
  csrf: {
    ...BASE_COOKIE_OPTIONS,
    httpOnly: false, // Need to read in JS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  } as CookieOptions,

  // User preferences - 1 year
  preferences: {
    ...BASE_COOKIE_OPTIONS,
    httpOnly: false, // Client may need to read
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  } as CookieOptions,
};

/**
 * Cookie Helper Class
 */
export class CookieManager {
  constructor(private req: Request, private res: Response) {}

  /**
   * Set auth token cookie
   */
  setToken(token: string, rememberMe: boolean = false): void {
    const options = rememberMe ? COOKIE_CONFIG.rememberMe : COOKIE_CONFIG.token;
    this.res.cookie(COOKIE_NAMES.TOKEN, token, options);
  }

  /**
   * Set refresh token cookie
   */
  setRefreshToken(refreshToken: string): void {
    this.res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, COOKIE_CONFIG.refreshToken);
  }

  /**
   * Get token from cookie
   */
  getToken(): string | undefined {
    return this.req.cookies?.[COOKIE_NAMES.TOKEN];
  }

  /**
   * Get refresh token from cookie
   */
  getRefreshToken(): string | undefined {
    return this.req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN];
  }

  /**
   * Clear auth cookies
   */
  clearAuth(): void {
    this.res.clearCookie(COOKIE_NAMES.TOKEN, { path: "/" });
    this.res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: "/" });
    this.res.clearCookie(COOKIE_NAMES.REMEMBER_ME, { path: "/" });
    this.res.clearCookie(COOKIE_NAMES.SESSION, { path: "/" });
  }

  /**
   * Set CSRF token
   */
  setCSRF(token: string): void {
    this.res.cookie(COOKIE_NAMES.CSRF, token, COOKIE_CONFIG.csrf);
  }

  /**
   * Get CSRF token
   */
  getCSRF(): string | undefined {
    return this.req.cookies?.[COOKIE_NAMES.CSRF];
  }

  /**
   * Set user preferences
   */
  setPreferences(prefs: Record<string, any>): void {
    this.res.cookie(COOKIE_NAMES.PREFERENCES, JSON.stringify(prefs), COOKIE_CONFIG.preferences);
  }

  /**
   * Get user preferences
   */
  getPreferences(): Record<string, any> | null {
    const prefs = this.req.cookies?.[COOKIE_NAMES.PREFERENCES];
    if (!prefs) return null;
    try {
      return JSON.parse(prefs);
    } catch {
      return null;
    }
  }
}

/**
 * Create cookie manager middleware helper
 */
export function getCookieManager(req: Request, res: Response): CookieManager {
  return new CookieManager(req, res);
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * CSRF Validation Middleware
 */
export function validateCSRF(req: Request, res: Response, next: Function) {
  // Skip for GET, HEAD, OPTIONS
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Skip for API routes that use Bearer tokens
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const cookieToken = req.cookies?.[COOKIE_NAMES.CSRF];
  const headerToken = req.headers["x-csrf-token"] as string;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: "Invalid CSRF token" });
    return;
  }

  next();
}

/**
 * Session configuration for express-session
 */
export const SESSION_CONFIG = {
  name: COOKIE_NAMES.SESSION,
  secret: process.env.SESSION_SECRET || "llmodel-forge-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiration on each request
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  } as CookieOptions,
};

export default CookieManager;

