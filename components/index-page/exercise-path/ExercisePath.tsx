"use client";

import { useRouter } from "next/navigation";
import { generateMockExercises } from "../lib/mockData";
import { ExerciseNode } from "./ExerciseNode";
import { LessonTooltip } from "./LessonTooltip";
import { PathConnection } from "./PathConnection";

export default function ExercisePath() {
  const router = useRouter();
  const exercises = generateMockExercises();

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
