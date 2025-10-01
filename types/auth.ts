/**
 * Authentication Types
 * Type definitions for authentication system
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirmation: string;
  name?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  message?: string;
}

export interface ApiError {
  error: {
    type: string;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
