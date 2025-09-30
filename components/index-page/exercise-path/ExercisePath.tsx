"use client";

import { useRouter } from "next/navigation";
import { generateMockExercises } from "../lib/mockData";
import { ExerciseNode } from "./ExerciseNode";
import { PathConnection } from "./PathConnection";

export default function ExercisePath() {
  const exercises = generateMockExercises();
  const router = useRouter();

  const handleExerciseClick = (exerciseRoute: string, isLocked: boolean) => {
    if (!isLocked) {
      router.push(exerciseRoute);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 overflow-y-auto overflow-x-hidden">
      <div className="relative w-full max-w-2xl mx-auto px-8 py-12">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 1200">
          {exercises.slice(0, -1).map((exercise, index) => (
            <PathConnection
              key={`path-${exercise.id}`}
              from={exercise.position}
              to={exercises[index + 1].position}
              completed={exercise.completed}
            />
          ))}
        </svg>

        <div className="relative" style={{ height: "1200px" }}>
          {exercises.map((exercise) => (
            <ExerciseNode
              key={exercise.id}
              exercise={exercise}
              onClick={() => handleExerciseClick(exercise.route, exercise.locked)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
