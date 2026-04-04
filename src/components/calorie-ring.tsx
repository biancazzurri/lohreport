interface CalorieRingProps {
  current: number;
  target: number;
  compact?: boolean;
}

export function CalorieRing({ current, target, compact }: CalorieRingProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const size = compact ? 70 : 130;
  const center = size / 2;
  const r = compact ? 28 : radius;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - progress);
  const strokeW = compact ? 6 : 12;

  return (
    <div className={`flex flex-col items-center ${compact ? "py-1" : "py-4"}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="#252545" strokeWidth={strokeW} />
        <circle
          cx={center} cy={center} r={r} fill="none" stroke="#4fc3f7"
          strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text x={center} y={compact ? center - 4 : center - 5} textAnchor="middle" dominantBaseline="middle"
          fill="#e5e7eb" fontSize={compact ? 13 : 20} fontWeight="bold">
          {current.toLocaleString()}
        </text>
        <text x={center} y={compact ? center + 9 : center + 15} textAnchor="middle" dominantBaseline="middle"
          fill="#6b7280" fontSize={compact ? 8 : 11}>
          {`/ ${target.toLocaleString()} cal`}
        </text>
      </svg>
    </div>
  );
}
