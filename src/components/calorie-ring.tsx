interface CalorieRingProps {
  current: number;
  target: number;
  compact?: boolean;
}

export function CalorieRing({ current, target }: CalorieRingProps) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;
  const pct = Math.min(progress * 100, 100);

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="bg-[#252545] rounded-full h-2.5 overflow-hidden">
            <div className="h-full rounded-full bg-[#4fc3f7] transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className="text-xs font-semibold text-[#4fc3f7] shrink-0">
          {current.toLocaleString()} / {target.toLocaleString()} cal
        </span>
      </div>
    </div>
  );
}
