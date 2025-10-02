"use client";

import type { LevelWithProgress } from "@/types/levels";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { type Exercise, generateMockExercises } from "../lib/mockData";
import { ExerciseNode } from "./ExerciseNode";
import { LessonTooltip } from "./LessonTooltip";
import { PathConnection } from "./PathConnection";

interface ExercisePathProps {
  levels?: LevelWithProgress[];
}

function mapLevelsToExercises(levels: LevelWithProgress[]): Exercise[] {
  return levels.map((level, index) => {
    const xOffset = index % 2 === 0 ? -50 : 50;
    const zigzag = Math.sin(index * 0.8) * 30;

    // Calculate total lessons and completion
    const totalLessons = level.lessons.length;
    const completedLessons = level.userProgress?.user_lessons.filter((l) => l.status === "completed").length || 0;

    // Map status to UI states
    const isCompleted = level.status === "completed";
    const isLocked = index > 0 && levels[index - 1].status !== "completed";

    // Format level title from slug
    const title = level.slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Determine difficulty based on index (you might want to adjust this)
    const difficulty = index < 2 ? "easy" : index < 4 ? "medium" : "hard";

    return {
      id: level.slug,
      title,
      type: "coding" as const,
      completed: isCompleted,
      locked: isLocked,
      description: `${completedLessons}/${totalLessons} lessons completed`,
      estimatedTime: totalLessons * 10, // Estimate 10 min per lesson
      difficulty,
      xpReward: 10 + (difficulty === "medium" ? 5 : difficulty === "hard" ? 10 : 0),
      route: `/exercises/${level.slug}`,
      position: {
        x: xOffset + zigzag,
        y: 100 + index * 120
      }
    };
  });
}

export default function ExercisePath({ levels }: ExercisePathProps) {
  const router = useRouter();

  const exercises = useMemo(() => {
    if (!levels || levels.length === 0) {
      return generateMockExercises();
    }
    return mapLevelsToExercises(levels);
  }, [levels]);

  const pathHeight = exercises.length * 120 + 200;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 overflow-y-auto overflow-x-hidden">
      <div className="relative w-full max-w-2xl mx-auto px-8 py-12">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 200 ${pathHeight}`}>
          {exercises.slice(0, -1).map((exercise, index) => (
            <PathConnection
              key={`path-${exercise.id}`}
              from={exercise.position}
              to={exercises[index + 1].position}
              completed={exercise.completed}
            />
          ))}
        </svg>

        <div className="relative" style={{ height: `${pathHeight}px` }}>
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="absolute"
              style={{
                left: `calc(50% + ${exercise.position.x}px)`,
                top: `${exercise.position.y}px`,
                transform: "translateX(-50%)"
              }}
            >
              <LessonTooltip exercise={exercise} placement="bottom">
                <ExerciseNode exercise={exercise} onClick={() => router.push(exercise.route)} />
              </LessonTooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
