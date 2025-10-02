"use client";

import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface AuthPageWrapperProps {
  children: ReactNode;
}

export function AuthPageWrapper({ children }: AuthPageWrapperProps) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const performCheck = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    void performCheck();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isChecking, router]);

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show loading while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, show the auth page
  return <>{children}</>;
}
