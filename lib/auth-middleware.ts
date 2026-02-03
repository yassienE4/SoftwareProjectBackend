import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "./jwt";

// Extend Express Request to include user data
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to verify JWT token from Authorization header
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid token";
    res.status(403).json({ error: message });
  }
}

/**
 * Middleware to verify user role
 */
export function authorizeRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required roles: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
