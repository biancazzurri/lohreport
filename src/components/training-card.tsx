"use client";

import { useState } from "react";
import type { TrainingSession } from "@/lib/types";

interface TrainingCardProps {
  session: TrainingSession;
  onDelete: (id: string) => void;
}

export function TrainingCard({ session, onDelete }: TrainingCardProps) {
  const [expanded, setExpanded] = useState(false);

  const summary = session.exercises.map((e) => e.description).join(", ");

  return (
    <div className="bg-[#1a3a2a] rounded-[10px] p-3 mb-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] text-gray-600 shrink-0">{session.time}</span>
            <span className="text-[13px] text-gray-200 truncate">{summary}</span>
          </div>
          <span className="text-xs text-[#81c784] font-semibold shrink-0 ml-2">
            -{Math.round(session.totalCaloriesBurned)} cal
          </span>
        </div>
      </button>

      {expanded && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.06]">
          {session.exercises.map((ex, i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <span className="text-[12px] text-gray-300">{ex.description}</span>
              <span className="text-[11px] text-gray-500 shrink-0 ml-2">-{Math.round(ex.caloriesBurned)} cal</span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-end">
            <button
              onClick={() => onDelete(session.id)}
              className="text-[10px] text-gray-600 hover:text-red-400"
              aria-label="Delete training"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
