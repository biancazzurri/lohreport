interface CalorieRingProps {
  current: number;
  target: number;
  compact?: boolean;
}

export function CalorieRing({ current, target, compact }: CalorieRingProps) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const offset = circ * (1 - progress);
  const scale = compact ? 0.54 : 1;

  return (
    <div
      className="flex flex-col items-center overflow-hidden transition-all duration-300 ease-in-out"
      style={{ height: compact ? 70 : 140, padding: compact ? "2px 0" : "16px 0" }}
    >
      <div
        className="transition-transform duration-300 ease-in-out origin-center"
        style={{ transform: `scale(${scale})` }}
      >
        <svg width={130} height={130} viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#252545" strokeWidth="12" />
          <circle
            cx="65" cy="65" r={r} fill="none" stroke="#4fc3f7"
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 65 65)"
          />
          <text x="65" y="60" textAnchor="middle" dominantBaseline="middle"
            fill="#e5e7eb" fontSize="20" fontWeight="bold">
            {current.toLocaleString()}
          </text>
          <text x="65" y="80" textAnchor="middle" dominantBaseline="middle"
            fill="#6b7280" fontSize="11">
            {`/ ${target.toLocaleString()} cal`}
          </text>
        </svg>
      </div>
    </div>
  );
}
