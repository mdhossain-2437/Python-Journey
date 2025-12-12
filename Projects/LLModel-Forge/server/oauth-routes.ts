import { Router, Request, Response } from "express";
import { generateToken } from "./auth";
import { storage } from "./storage";
import { randomUUID } from "crypto";

const router = Router();

// OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:5000";

// ==================== GitHub OAuth ====================

router.get("/github", (_req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(501).json({ error: "GitHub OAuth not configured" });
  }

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/github/callback`,
    scope: "user:email",
    state: randomUUID(),
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get("/github/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.redirect("/login?error=oauth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect("/login?error=oauth_failed");
    }

    // Get user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    });

    const githubUser = await userResponse.json();

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail?.email || `${githubUser.login}@github.local`;
    }

    // Find or create user
    let user = await storage.getUserByEmail(email);

    if (!user) {
      user = await storage.createUser({
        username: githubUser.login,
        email,
        password: randomUUID(), // Random password for OAuth users
        name: githubUser.name || githubUser.login,
        role: "ML Engineer",
        team: "Data Science",
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    });

    // Redirect with token
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`/?token=${token}`);
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.redirect("/login?error=oauth_failed");
  }
});

// ==================== Google OAuth ====================

router.get("/google", (_req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(501).json({ error: "Google OAuth not configured" });
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state: randomUUID(),
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.redirect("/login?error=oauth_failed");
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.redirect("/login?error=oauth_failed");
    }

    // Get user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userResponse.json();

    // Find or create user
    let user = await storage.getUserByEmail(googleUser.email);

    if (!user) {
      user = await storage.createUser({
        username: googleUser.email.split("@")[0],
        email: googleUser.email,
        password: randomUUID(),
        name: googleUser.name || googleUser.email.split("@")[0],
        role: "ML Engineer",
        team: "Data Science",
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`/?token=${token}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect("/login?error=oauth_failed");
  }
});

// Token refresh endpoint
router.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "llmodel-forge-secret-key");

    const newToken = generateToken({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      name: decoded.name,
    });

    res.cookie("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ token: newToken });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;

