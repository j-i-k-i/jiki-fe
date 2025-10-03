/**
 * Authentication hooks for managing auth state and redirects
 */

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RequireAuthOptions {
  redirectTo?: string;
  redirectIfAuthenticated?: boolean;
  onAuthenticated?: () => void;
  onUnauthenticated?: () => void;
}

/**
 * Hook for pages that require authentication.
 * Handles auth checking and redirects in a centralized way.
 *
 * @param options Configuration options for auth behavior
 * @returns Object with auth state and loading status
 */
export function useRequireAuth(options: RequireAuthOptions = {}) {
  const { redirectTo = "/auth/login", redirectIfAuthenticated = false, onAuthenticated, onUnauthenticated } = options;

  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (redirectIfAuthenticated && isAuthenticated) {
      router.push("/dashboard");
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      if (onUnauthenticated) {
        onUnauthenticated();
      }
      router.push(redirectTo);
      return;
    }

    if (isAuthenticated && onAuthenticated) {
      onAuthenticated();
    }

    setIsReady(true);
  }, [isAuthenticated, authLoading, router, redirectTo, redirectIfAuthenticated, onAuthenticated, onUnauthenticated]);

  return {
    isAuthenticated,
    isLoading: authLoading || !isReady,
    user,
    isReady: isReady && !authLoading
  };
}

/**
 * Hook for pages that should redirect if user is already authenticated
 * (e.g., login, signup pages)
 */
export function useRedirectIfAuthenticated(_redirectTo = "/dashboard") {
  return useRequireAuth({
    redirectIfAuthenticated: true
  });
}

/**
 * Hook to get current auth status without any redirects
 */
export function useAuth() {
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!hasChecked) {
      void checkAuth();
      setHasChecked(true);
    }
  }, [checkAuth, hasChecked]);

  return {
    isAuthenticated,
    isLoading,
    user,
    isReady: hasChecked && !isLoading
  };
}
