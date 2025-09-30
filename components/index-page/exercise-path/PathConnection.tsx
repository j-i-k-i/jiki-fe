interface PathConnectionProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  completed: boolean;
}

export function PathConnection({ from, to, completed }: PathConnectionProps) {
  const centerX = window?.innerWidth ? window.innerWidth / 2 : 400;
  const x1 = centerX + from.x;
  const y1 = from.y + 48;
  const x2 = centerX + to.x;
  const y2 = to.y + 48;

  const controlPoint1X = x1;
  const controlPoint1Y = y1 + (y2 - y1) * 0.4;
  const controlPoint2X = x2;
  const controlPoint2Y = y2 - (y2 - y1) * 0.4;

  return (
    <path
      d={`M ${x1} ${y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${x2} ${y2}`}
      stroke={completed ? "#10b981" : "#d1d5db"}
      strokeWidth="4"
      strokeDasharray={completed ? "0" : "8 8"}
      fill="none"
      className={completed ? "" : "animate-pulse"}
    />
  );
}
