import type { Exercise } from "../lib/mockData";

interface ExerciseNodeProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseNode({ exercise, onClick }: ExerciseNodeProps) {
  const getStatusStyles = () => {
    if (exercise.completed) {
      return "bg-green-50 border-green-400 hover:bg-green-100";
    }
    if (exercise.locked) {
      return "bg-gray-100 border-gray-300 cursor-not-allowed opacity-60";
    }
    return "bg-white border-blue-400 hover:bg-blue-50 hover:border-blue-500";
  };

  const getCategoryLabel = () => {
    switch (exercise.type) {
      case "coding":
        return "Exercise";
      case "video":
        return "Video";
      case "quiz":
        return "Quiz";
      default:
        return exercise.type;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={exercise.locked}
      className={`
        absolute transform -translate-x-1/2 w-fit px-6 py-2 rounded-lg
        border-2 transition-all duration-200 shadow-sm hover:shadow-md
        cursor-pointer
        ${getStatusStyles()}
      `}
      style={{
        left: `calc(50% + ${exercise.position.x}px)`,
        top: `${exercise.position.y}px`
      }}
    >
      <div className="text-left">
        <div className="text-sm font-semibold text-gray-900">{exercise.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{getCategoryLabel()}</div>
      </div>
    </button>
  );
}
