import type { Placement } from "@floating-ui/react";
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole
} from "@floating-ui/react";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";
import { cloneElement, isValidElement, useState } from "react";
import type { Exercise } from "../lib/mockData";

interface LessonTooltipProps {
  children: ReactElement;
  exercise: Exercise;
  placement?: Placement;
  offset?: number;
  onOpen?: () => void;
}

export function LessonTooltip({
  children,
  exercise,
  placement = "bottom",
  offset: offsetValue = 12,
  onOpen
}: LessonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open);
      if (open && onOpen) {
        onOpen();
      }
    },
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      flip({
        fallbackAxisSideDirection: "start",
        crossAxis: false
      }),
      shift({
        padding: 8,
        crossAxis: true
      })
    ]
  });

  const click = useClick(context);
  const role = useRole(context, { role: "dialog" });
  const dismiss = useDismiss(context, {
    outsidePressEvent: "mousedown"
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, role, dismiss]);

  if (!isValidElement(children)) {
    return null;
  }

  const handleStartLesson = () => {
    setIsOpen(false);
    router.push(exercise.route);
  };

  const getExerciseIcon = () => {
    switch (exercise.type) {
      case "coding":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        );
      case "video":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "quiz":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getDifficultyColor = () => {
    switch (exercise.difficulty) {
      case "easy":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "hard":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTypeLabel = () => {
    switch (exercise.type) {
      case "coding":
        return "Exercise";
      case "video":
        return "Video Lesson";
      case "quiz":
        return "Quiz";
      default:
        return exercise.type;
    }
  };

  const childrenWithRef = cloneElement(children, {
    ref: refs.setReference,
    ...getReferenceProps()
  } as any);

  return (
    <>
      {childrenWithRef}
      {isOpen && !exercise.locked && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-16 w-fit"
            role="dialog"
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 ${getDifficultyColor()}`}>{getExerciseIcon()}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base">{exercise.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{exercise.description}</p>

                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {exercise.estimatedTime} min
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    {exercise.xpReward} XP
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      exercise.difficulty === "easy"
                        ? "bg-green-100 text-green-700"
                        : exercise.difficulty === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {getTypeLabel()}
                  </span>
                </div>

                {exercise.completed && (
                  <div className="flex items-center gap-1 mt-3 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                )}

                <button
                  onClick={handleStartLesson}
                  className={`mt-4 w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    exercise.completed
                      ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {exercise.completed ? "Review Lesson" : "Start Lesson"}
                </button>
              </div>
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
