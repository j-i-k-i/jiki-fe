/**
 * Authentication Service
 * API integration for authentication endpoints
 */

import { api } from "@/lib/api";
import { getTokenExpiry, setToken } from "@/lib/auth/storage";
import type {
  AuthResponse,
  LoginCredentials,
  PasswordReset,
  PasswordResetRequest,
  SignupData,
  User
} from "@/types/auth";

/**
 * Extract JWT token from Authorization header
 */
function extractTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * User login
 * POST /v1/auth/login
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await api.post<AuthResponse>("/v1/auth/login", { user: credentials });

  // Extract JWT from response headers
  const token = extractTokenFromHeaders(response.headers);
  if (token) {
    const expiry = getTokenExpiry(token);
    setToken(token, expiry || undefined);
  }

  return response.data.user;
}

/**
 * User signup
 * POST /v1/auth/signup
 */
export async function signup(userData: SignupData): Promise<User> {
  const response = await api.post<AuthResponse>("/v1/auth/signup", { user: userData });

  // Extract JWT from response headers
  const token = extractTokenFromHeaders(response.headers);
  if (token) {
    const expiry = getTokenExpiry(token);
    setToken(token, expiry || undefined);
  }

  return response.data.user;
}

/**
 * User logout
 * DELETE /v1/auth/logout
 */
export async function logout(): Promise<void> {
  try {
    await api.delete("/v1/auth/logout");
  } catch (error) {
    // Log error but don't throw - we still want to clear local state
    console.error("Logout API call failed:", error);
  }

  // Always clear local token regardless of API response
  const { removeToken } = await import("@/lib/auth/storage");
  removeToken();
}

/**
 * Request password reset
 * POST /v1/auth/password
 */
export async function requestPasswordReset(data: PasswordResetRequest): Promise<void> {
  await api.post("/v1/auth/password", { user: data });
}

/**
 * Complete password reset
 * PATCH /v1/auth/password
 */
export async function resetPassword(data: PasswordReset): Promise<void> {
  await api.patch("/v1/auth/password", { user: data });
}

/**
 * Get current user
 * GET /v1/auth/me (or similar endpoint)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<AuthResponse>("/v1/auth/me");
    return response.data.user;
  } catch {
    // Return null if not authenticated
    return null;
  }
}

/**
 * Validate current token
 */
export async function validateToken(): Promise<boolean> {
  try {
    // Try to get current user - if successful, token is valid
    const user = await getCurrentUser();
    return !!user;
  } catch {
    return false;
  }
}
