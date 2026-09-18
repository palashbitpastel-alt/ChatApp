import jwt from "jsonwebtoken";
import { Role } from "@/types";

// Shared by Next.js API routes and the custom Socket.io server (server.ts),
// so it must not import anything Next-specific.
export const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production-chatapp";
export const COOKIE_NAME = "wa_session";

export interface TokenPayload {
  userId: string;
  phone: string;
  username: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
