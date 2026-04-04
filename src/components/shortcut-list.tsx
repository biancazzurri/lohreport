"use client";

import type { Shortcut } from "@/lib/shortcuts";

interface ShortcutListProps {
  shortcuts: Shortcut[];
  onSelect: (shortcut: Shortcut) => void;
  onDismiss: (fingerprint: string) => void;
}

export function ShortcutList({ shortcuts, onSelect, onDismiss }: ShortcutListProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
        Recent
      </h2>
      <ul className="space-y-2">
        {shortcuts.map((shortcut) => {
          const description = shortcut.items
            .map((item) => item.rawText)
            .join(" + ");
          return (
            <li key={shortcut.fingerprint} className="relative">
              <button
                type="button"
                onClick={() => onSelect(shortcut)}
                className="w-full text-left bg-[#252545] rounded-xl px-4 py-3 pr-10 hover:bg-[#2d2d55] transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-200 truncate mr-2">
                    {description}
                  </span>
                  <span className="text-sm font-semibold text-[#4fc3f7] shrink-0">
                    {Math.round(shortcut.totalCalories)} cal
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  P: {Math.round(shortcut.totalProtein)}g · C:{" "}
                  {Math.round(shortcut.totalCarbs)}g · F:{" "}
                  {Math.round(shortcut.totalFat)}g
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(shortcut.fingerprint);
                }}
                className="absolute top-3 right-3 text-gray-600 hover:text-red-400 text-xs"
                aria-label="Remove shortcut"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
