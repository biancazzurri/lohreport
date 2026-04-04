interface CalorieRingProps {
  current: number;
  target: number;
}

export function CalorieRing({ current, target }: CalorieRingProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center py-4">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="#252545"
          strokeWidth="12"
        />
        <circle
          cx="65"
          cy="65"
          r={radius}
          fill="none"
          stroke="#4fc3f7"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 65 65)"
        />
        <text
          x="65"
          y="60"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e5e7eb"
          fontSize="20"
          fontWeight="bold"
        >
          {current.toLocaleString()}
        </text>
        <text
          x="65"
          y="80"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#6b7280"
          fontSize="11"
        >
          {`/ ${target.toLocaleString()} cal`}
        </text>
      </svg>
    </div>
  );
}
