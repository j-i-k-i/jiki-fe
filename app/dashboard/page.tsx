"use client";

import ExercisePath from "@/components/index-page/exercise-path/ExercisePath";
import InfoPanel from "@/components/index-page/info-panel/InfoPanel";
import Sidebar from "@/components/index-page/sidebar/Sidebar";
import { fetchLevelsWithProgress } from "@/lib/api/levels";
import { useAuthStore } from "@/stores/authStore";
import type { LevelWithProgress } from "@/types/levels";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const [levels, setLevels] = useState<LevelWithProgress[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsError, setLevelsError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Effect 1: Check authentication on mount
  useEffect(() => {
    async function initAuth() {
      await checkAuth();
      setIsInitializing(false);
    }
    void initAuth();
  }, [checkAuth]);

  // Effect 2: Handle redirect based on reactive auth state
  useEffect(() => {
    if (!isInitializing && !authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, isInitializing, router]);

  // Effect 3: Load levels when authenticated
  useEffect(() => {
    async function loadLevels() {
      if (!isAuthenticated || isInitializing || authLoading) {
        return;
      }

      try {
        setLevelsLoading(true);
        const data = await fetchLevelsWithProgress();
        setLevels(data);
      } catch (error) {
        console.error("Failed to fetch levels:", error);
        setLevelsError(error instanceof Error ? error.message : "Failed to load levels");
      } finally {
        setLevelsLoading(false);
      }
    }

    void loadLevels();
  }, [isAuthenticated, isInitializing, authLoading]);

  if (isInitializing || authLoading || levelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (levelsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {levelsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeItem="exercises" />
      <main className="w-2/4 p-6">
        <ExercisePath levels={levels} />
      </main>
      <InfoPanel />
    </div>
  );
}
