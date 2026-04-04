"use client";

interface CalorieBreakdownProps {
  protein: number;
  carbs: number;
  fat: number;
  target: number;
}

export function CalorieBreakdown({
  protein,
  carbs,
  fat,
  target,
}: CalorieBreakdownProps) {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const macroTotal = Math.round(proteinCal + carbsCal + fatCal);
  const diff = macroTotal - target;

  const totalForBar = macroTotal || 1;
  const proteinPct = (proteinCal / totalForBar) * 100;
  const carbsPct = (carbsCal / totalForBar) * 100;
  const fatPct = (fatCal / totalForBar) * 100;

  const diffColor =
    Math.abs(diff) < 50
      ? "#81c784"
      : diff > 0
      ? "#f48fb1"
      : "#ffb74d";

  return (
    <div className="bg-[#252545] rounded-xl p-4">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        <div
          style={{ width: `${proteinPct}%`, backgroundColor: "#81c784" }}
          title={`Protein: ${Math.round(proteinCal)} cal`}
        />
        <div
          style={{ width: `${carbsPct}%`, backgroundColor: "#ffb74d" }}
          title={`Carbs: ${Math.round(carbsCal)} cal`}
        />
        <div
          style={{ width: `${fatPct}%`, backgroundColor: "#f48fb1" }}
          title={`Fat: ${Math.round(fatCal)} cal`}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-500">Macro Total</div>
          <div className="text-sm font-semibold text-gray-200">{macroTotal} cal</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Target</div>
          <div className="text-sm font-semibold text-gray-200">{target} cal</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Difference</div>
          <div className="text-sm font-semibold" style={{ color: diffColor }}>
            {diff > 0 ? "+" : ""}
            {diff} cal
          </div>
        </div>
      </div>
    </div>
  );
}
