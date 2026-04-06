interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroBar({ label, current, target, color }: MacroBarProps) {
  const over = target > 0 && current > target;
  const ratio = target > 0 ? current / target : 0;
  const normalPct = over ? (target / current) * 100 : Math.min(ratio, 1) * 100;
  const overPct = over ? ((current - target) / current) * 100 : 0;

  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className={`text-xs ${over ? "text-[#ef5350] font-semibold" : "text-gray-500"}`}>
          {Math.round(current)}/{target}
        </span>
      </div>
      <div className="flex h-2 rounded-full bg-[#252545] overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${normalPct}%`, backgroundColor: color, borderRadius: over ? "9999px 0 0 9999px" : "9999px" }}
        />
        {over && (
          <div
            className="h-full rounded-r-full transition-all bg-[#ef5350]"
            style={{ width: `${overPct}%` }}
          />
        )}
      </div>
    </div>
  );
}

interface MacroBarsProps {
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export function MacroBars({ protein, carbs, fat }: MacroBarsProps) {
  return (
    <div className="flex gap-3 px-4 pb-4">
      <MacroBar
        label="Protein"
        current={protein.current}
        target={protein.target}
        color="#81c784"
      />
      <MacroBar
        label="Carbs"
        current={carbs.current}
        target={carbs.target}
        color="#ffb74d"
      />
      <MacroBar
        label="Fat"
        current={fat.current}
        target={fat.target}
        color="#f48fb1"
      />
    </div>
  );
}
