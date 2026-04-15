"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Options */}
      {open && (
        <div className="fixed bottom-24 right-6 z-30 flex flex-col gap-2 items-end">
          <button
            onClick={() => { setOpen(false); router.push("/add"); }}
            className="flex items-center gap-2 bg-[#252545] text-gray-200 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-[#2d2d55] transition-colors"
          >
            Meal
          </button>
          <button
            onClick={() => { setOpen(false); router.push("/add?type=training"); }}
            className="flex items-center gap-2 bg-[#1a3a2a] text-gray-200 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg hover:bg-[#245a3a] transition-colors"
          >
            Training
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#4fc3f7] flex items-center justify-center shadow-lg text-[#1a1a2e] text-2xl font-bold hover:bg-[#38b2e0] transition-all z-30 ${open ? "rotate-45" : ""}`}
        aria-label="Add"
      >
        +
      </button>
    </>
  );
}
