interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
}

function MacroBar({ label, current, target, color }: MacroBarProps) {
  const progress = target > 0 ? Math.min(current / target, 1) : 0;

  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-500">
          {Math.round(current)}/{target}g
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#252545] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress * 100}%`, backgroundColor: color }}
        />
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
