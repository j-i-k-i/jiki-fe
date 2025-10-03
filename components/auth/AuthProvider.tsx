"use client";

import { useAuthStore } from "@/stores/authStore";
import { useEffect, type ReactNode } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
