/**
 * Authentication Store
 * Global state management for authentication using Zustand
 */

import * as authService from "@/lib/auth/service";
import { hasValidToken, removeToken } from "@/lib/auth/storage";
import type { LoginCredentials, PasswordReset, SignupData, User } from "@/types/auth";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (data: PasswordReset) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.login(credentials);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Login failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message
          });
          throw error; // Re-throw for component handling
        }
      },

      // Signup action
      signup: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authService.signup(userData);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Signup failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message
          });
          throw error;
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Always clear state regardless of API response
          removeToken();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      // Check authentication status
      checkAuth: () => {
        // Skip if already loading
        if (get().isLoading) {
          return Promise.resolve();
        }

        // Quick check for token existence
        if (!hasValidToken()) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return Promise.resolve();
        }

        // If we have a valid token and user data in state, we're authenticated
        const currentState = get();
        if (currentState.user && currentState.isAuthenticated) {
          // User data is already in state from persist
          set({ isLoading: false });
          return Promise.resolve();
        }

        // If we have a token but no user data, assume authenticated
        // (user data should have been persisted from login/signup)
        set({
          isAuthenticated: true,
          isLoading: false
        });
        return Promise.resolve();
      },

      // Request password reset
      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.requestPasswordReset({ email });
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to send reset email";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Complete password reset
      resetPassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(data);
          set({ isLoading: false });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to reset password";
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Set loading state
      setLoading: (loading) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: "auth-storage", // Storage key
      partialize: (state) => ({
        // Only persist user data, not loading/error states
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
