"use client";

interface MacroSliderProps {
  label: string;
  color: string;
  grams: number;
  calPerGram: number;
  totalCalories: number;
  onChange: (grams: number) => void;
}

export function MacroSlider({
  label,
  color,
  grams,
  calPerGram,
  totalCalories,
  onChange,
}: MacroSliderProps) {
  const calories = Math.round(grams * calPerGram);
  const percentage =
    totalCalories > 0 ? Math.round((calories / totalCalories) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-semibold" style={{ color }}>
          {label}
        </span>
        <span className="text-xs text-gray-400">
          {Math.round(grams)}g · {calories} cal · {percentage}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.round(totalCalories / calPerGram)}
        value={grams}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[color:var(--accent)] h-2 rounded-full cursor-pointer"
        style={{ accentColor: color }}
        aria-label={label}
      />
    </div>
  );
}
