import jwt, { JwtPayload, SignOptions, VerifyOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "example_secret_key";

export interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: {
  id: number;
  email: string;
  role: string;
}): string {
  const signOptions: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: {
  id: number;
  email: string;
}): string {
  const signOptions: SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  };

  return jwt.sign(payload, JWT_SECRET, signOptions);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokens(payload: {
  id: number;
  email: string;
  role: string;
}): TokenResponse {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({
    id: payload.id,
    email: payload.email,
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600, // 1 hour in seconds
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Verify and refresh token
 */
export function refreshAccessToken(refreshToken: string): TokenResponse {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as TokenPayload;

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    });

    return {
      accessToken: newAccessToken,
      expiresIn: 3600,
    };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
