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
  const totalForBar = target || 1;
  const proteinPct = (proteinCal / totalForBar) * 100;
  const carbsPct = (carbsCal / totalForBar) * 100;
  const fatPct = (fatCal / totalForBar) * 100;

  return (
    <div className="bg-[#252545] rounded-xl p-4">
      {/* Stacked bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4 bg-[#1a1a2e]">
        <div
          className="transition-all duration-200"
          style={{ width: `${proteinPct}%`, backgroundColor: "#81c784" }}
          title={`Protein: ${Math.round(proteinCal)} cal`}
        />
        <div
          className="transition-all duration-200"
          style={{ width: `${carbsPct}%`, backgroundColor: "#ffb74d" }}
          title={`Carbs: ${Math.round(carbsCal)} cal`}
        />
        <div
          className="transition-all duration-200"
          style={{ width: `${fatPct}%`, backgroundColor: "#f48fb1" }}
          title={`Fat: ${Math.round(fatCal)} cal`}
        />
      </div>

      {/* Legend */}
      <div className="flex justify-between text-xs text-gray-500">
        <span><span className="text-[#81c784]">P</span> {Math.round(proteinCal)} cal</span>
        <span><span className="text-[#ffb74d]">C</span> {Math.round(carbsCal)} cal</span>
        <span><span className="text-[#f48fb1]">F</span> {Math.round(fatCal)} cal</span>
      </div>
    </div>
  );
}
