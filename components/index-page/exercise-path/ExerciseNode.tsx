import type { Exercise } from "../lib/mockData";

interface ExerciseNodeProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseNode({ exercise, onClick }: ExerciseNodeProps) {
  const getStatusStyles = () => {
    if (exercise.completed) {
      return "bg-green-500 border-green-600 text-white shadow-lg";
    }
    if (exercise.locked) {
      return "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed opacity-60";
    }
    return "bg-white border-blue-400 text-gray-800 hover:scale-105 shadow-lg";
  };

  const getDifficultyColor = () => {
    switch (exercise.difficulty) {
      case "easy":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={exercise.locked}
      className={`
        absolute transform -translate-x-1/2 w-24 h-24 rounded-full
        border-4 transition-all duration-200 flex flex-col items-center
        justify-center ${getStatusStyles()}
      `}
      style={{
        left: `calc(50% + ${exercise.position.x}px)`,
        top: `${exercise.position.y}px`
      }}
    >
      <span className="text-3xl mb-1">{exercise.icon}</span>
      <div className="text-xs font-medium truncate w-full px-2">{exercise.title}</div>
      {!exercise.locked && (
        <div className={`absolute -bottom-5 text-xs font-bold ${getDifficultyColor()}`}>{exercise.xpReward} XP</div>
      )}
    </button>
  );
}
