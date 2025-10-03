"use client";

import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState, type ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider ensures authentication is checked once at app startup.
 * It prevents children from rendering until the initial auth check is complete,
 * avoiding duplicate checkAuth() calls and race conditions.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, isLoading } = useAuthStore();
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    async function initialize() {
      // Only check auth if we haven't initialized yet
      if (!hasInitialized) {
        await checkAuth();
        setHasInitialized(true);
      }
    }
    void initialize();
  }, [checkAuth, hasInitialized]);

  // Wait for initial auth check to complete before rendering children
  // This prevents race conditions where child components might try to check auth
  if (!hasInitialized && isLoading) {
    return null; // Or a loading spinner if preferred
  }

  return <>{children}</>;
}
