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
  const pct = Math.min(progress * 100, 100);

  return (
    <div className="relative overflow-hidden transition-all duration-300 ease-in-out"
      style={{ height: compact ? 36 : 140 }}
    >
      {/* Ring — full size */}
      <div className={`flex justify-center pt-4 transition-all duration-300 ease-in-out ${compact ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}>
        <svg width={130} height={130} viewBox="0 0 130 130">
          <circle cx="65" cy="65" r={r} fill="none" stroke="#252545" strokeWidth="12" />
          <circle cx="65" cy="65" r={r} fill="none" stroke="#4fc3f7"
            strokeWidth="12" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            transform="rotate(-90 65 65)" />
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

      {/* Bar — compact */}
      <div className={`absolute inset-x-0 top-0 px-4 pt-2 transition-all duration-300 ease-in-out ${compact ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="bg-[#252545] rounded-full h-2 overflow-hidden">
              <div className="h-full rounded-full bg-[#4fc3f7] transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
          <span className="text-xs font-semibold text-[#4fc3f7] shrink-0 min-w-[80px] text-right">
            {current.toLocaleString()} / {target.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
