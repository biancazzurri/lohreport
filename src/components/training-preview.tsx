"use client";

interface TrainingPreviewProps {
  description: string;
  caloriesBurned: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TrainingPreview({ description, caloriesBurned, onConfirm, onCancel }: TrainingPreviewProps) {
  return (
    <div className="bg-[#252545] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">Estimated Burn</h2>

      <div className="mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-200">{description}</span>
          <span className="text-sm text-[#81c784] font-semibold shrink-0 ml-2">
            -{Math.round(caloriesBurned)} cal
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl bg-[#1a1a2e] text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl bg-[#81c784] text-[#1a1a2e] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Log Training
        </button>
      </div>
    </div>
  );
}
