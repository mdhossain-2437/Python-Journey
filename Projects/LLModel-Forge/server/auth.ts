import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "llmodel-forge-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
  };
}

export function generateToken(user: { id: string; username: string; email: string; name: string }): string {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): { id: string; username: string; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const user = await storage.getUser(decoded.id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
  };

  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = await storage.getUser(decoded.id);
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
        };
      }
    }
  }

  next();
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

