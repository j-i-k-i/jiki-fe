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
  const authHeader = headers.get("Authorization") || headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }

  return parts[1];
}

/**
 * User login
 * POST /v1/auth/login
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await api.post<AuthResponse>("/auth/login", { user: credentials });

  // Try to extract JWT from response headers first
  let token = extractTokenFromHeaders(response.headers);

  // If not in headers, check response body
  if (!token) {
    token = response.data.token || response.data.jwt || response.data.access_token || null;
  }

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
  const response = await api.post<AuthResponse>("/auth/signup", { user: userData });

  // Try to extract JWT from response headers first
  let token = extractTokenFromHeaders(response.headers);

  // If not in headers, check response body
  if (!token) {
    token = response.data.token || response.data.jwt || response.data.access_token || null;
  }

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
    await api.delete("/auth/logout");
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
  await api.post("/auth/password", { user: data });
}

/**
 * Complete password reset
 * PATCH /v1/auth/password
 */
export async function resetPassword(data: PasswordReset): Promise<void> {
  await api.patch("/auth/password", { user: data });
}

/**
 * Get current user
 * Returns the persisted user data from the auth store (set during login/signup)
 * Since there's no /auth/me endpoint in the backend, we rely on the locally stored user data
 */
export async function getCurrentUser(): Promise<User | null> {
  const { getToken } = await import("@/lib/auth/storage");
  const token = getToken();

  if (!token) {
    return null;
  }

  // Get the persisted user data from the auth store
  const { useAuthStore } = await import("@/stores/authStore");
  const user = useAuthStore.getState().user;

  // Return the stored user if available and authenticated
  if (user && useAuthStore.getState().isAuthenticated) {
    return user;
  }

  // If we have a token but no stored user data, the session may be invalid
  return null;
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
