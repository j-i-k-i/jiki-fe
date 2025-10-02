"use client";

import ComplexExercise from "@/components/complex-exercise/ComplexExercise";
import VideoExercise from "@/components/video-exercise/VideoExercise";
import { fetchLesson, type LessonData } from "@/lib/api/lessons";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function LessonPage({ params }: PageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check authentication
  useEffect(() => {
    async function initAuth() {
      await checkAuth();
      setIsInitializing(false);
    }
    void initAuth();
  }, [checkAuth]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, authLoading, isInitializing, router]);

  // Load lesson details
  useEffect(() => {
    async function loadLesson() {
      if (!isAuthenticated || isInitializing || authLoading) {
        return;
      }

      try {
        setLoading(true);
        const resolvedParams = await params;
        const lessonData = await fetchLesson(resolvedParams.slug);
        setLesson(lessonData);
      } catch (err) {
        console.error("Failed to fetch lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setLoading(false);
      }
    }

    void loadLesson();
  }, [params, isAuthenticated, isInitializing, authLoading]);

  if (isInitializing || authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || "Lesson not found"}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate component based on lesson type
  if (lesson.type === "video") {
    return <VideoExercise lessonData={lesson} />;
  }

  // Default to complex exercise for "exercise" type
  // TODO: Map lesson slug to exercise slug from curriculum
  // For now, use a simple mapping to available exercises
  const exerciseSlugMap: Record<string, any> = {
    "solve-a-maze": "basic-movement",
    "win-space-invaders": "basic-movement",
    "solve-a-maze-with-numbers": "basic-movement"
  };

  const exerciseSlug = exerciseSlugMap[lesson.slug] || "basic-movement";

  return <ComplexExercise exerciseSlug={exerciseSlug} />;
}
