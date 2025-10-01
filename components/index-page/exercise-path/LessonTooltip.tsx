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
import type { ReactElement } from "react";
import { cloneElement, isValidElement, useState } from "react";
import type { Exercise } from "../lib/mockData";
import { TooltipContent } from "./ui/TooltipContent";

interface LessonTooltipProps {
  children: ReactElement;
  exercise: Exercise;
  placement?: Placement;
  offset?: number;
}

export function LessonTooltip({
  children,
  exercise,
  placement = "bottom",
  offset: offsetValue = 12
}: LessonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement,
    strategy: "fixed",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(offsetValue),
      flip({ fallbackAxisSideDirection: "start", crossAxis: false }),
      shift({ padding: 8, crossAxis: true })
    ]
  });

  const click = useClick(context);
  const role = useRole(context, { role: "dialog" });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, role, dismiss]);

  if (!isValidElement(children)) {
    return null;
  }

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
            <TooltipContent exercise={exercise} onClose={() => setIsOpen(false)} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
