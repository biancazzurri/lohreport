"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useSettings } from "@/hooks/use-settings";
import { downloadBackup, importData } from "@/lib/backup";
import { db } from "@/lib/db";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const settings = useSettings();

  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const [clearConfirm1, setClearConfirm1] = useState(false);
  const [clearConfirm2, setClearConfirm2] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleRestore() {
    if (!window.confirm("Restore data from backup? This will overwrite all current data.")) {
      return;
    }
    setRestoring(true);
    setRestoreError("");
    setRestoreSuccess(false);
    try {
      const json = await downloadBackup();
      await importData(json);
      setRestoreSuccess(true);
    } catch (err) {
      setRestoreError(
        err instanceof Error ? err.message : "Restore failed."
      );
    } finally {
      setRestoring(false);
    }
  }

  function handleClearStep1() {
    setClearConfirm1(true);
    setClearConfirm2(false);
  }

  function handleClearStep2() {
    setClearConfirm2(true);
  }

  async function handleClearConfirmed() {
    setClearing(true);
    try {
      await db.delete();
      router.push("/");
    } catch {
      setClearing(false);
      setClearConfirm1(false);
      setClearConfirm2(false);
    }
  }

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-gray-400 hover:text-gray-200 text-lg leading-none"
          aria-label="Back"
        >
          &#9664;
        </Link>
        <h1 className="text-base font-semibold text-gray-200">Settings</h1>
      </div>

      {/* Account */}
      {session?.user && (
        <section className="bg-[#252545] rounded-xl p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-200">{session.user.name}</div>
              <div className="text-xs text-gray-500">{session.user.email}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </section>
      )}

      {/* Macro Goals */}
      <section className="bg-[#252545] rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-1">
              Macro Goals
            </h2>
            <div className="text-xs text-gray-500">
              {settings.calorieGoal} cal · P: {settings.proteinGoal}g · C:{" "}
              {settings.carbsGoal}g · F: {settings.fatGoal}g
            </div>
          </div>
          <Link
            href="/goals"
            className="text-sm text-[#4fc3f7] hover:opacity-80 transition-opacity"
          >
            Edit
          </Link>
        </div>
      </section>

      {/* Backup */}
      <section className="bg-[#252545] rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-200 mb-3">
          Restore from Backup
        </h2>
        <button
          type="button"
          onClick={handleRestore}
          disabled={restoring}
          className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-gray-300 text-sm hover:text-gray-100 hover:bg-[#2d2d55] transition-colors disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Restore from Backup"}
        </button>
        {restoreSuccess && (
          <p className="text-xs text-[#81c784] mt-2">
            Data restored successfully.
          </p>
        )}
        {restoreError && (
          <p className="text-xs text-[#f48fb1] mt-2">{restoreError}</p>
        )}
      </section>

      {/* Clear All Data */}
      <section className="bg-[#252545] rounded-xl p-4 border border-[#f48fb1]/30">
        <h2 className="text-sm font-semibold text-[#f48fb1] mb-2">
          Clear All Data
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          This permanently deletes all meals, nutrition cache, and settings.
          This action cannot be undone.
        </p>

        {!clearConfirm1 && (
          <button
            type="button"
            onClick={handleClearStep1}
            className="px-4 py-2 rounded-lg bg-[#f48fb1]/10 text-[#f48fb1] text-sm hover:bg-[#f48fb1]/20 transition-colors"
          >
            Clear All Data
          </button>
        )}

        {clearConfirm1 && !clearConfirm2 && (
          <div>
            <p className="text-xs text-[#f48fb1] mb-2">
              Are you sure? All data will be lost permanently.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setClearConfirm1(false)}
                className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-gray-400 text-sm hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearStep2}
                className="px-4 py-2 rounded-lg bg-[#f48fb1]/20 text-[#f48fb1] text-sm hover:bg-[#f48fb1]/30 transition-colors"
              >
                Yes, I'm sure
              </button>
            </div>
          </div>
        )}

        {clearConfirm2 && (
          <div>
            <p className="text-xs text-[#f48fb1] mb-2 font-semibold">
              Final confirmation: delete everything?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setClearConfirm1(false);
                  setClearConfirm2(false);
                }}
                className="px-4 py-2 rounded-lg bg-[#1a1a2e] text-gray-400 text-sm hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearConfirmed}
                disabled={clearing}
                className="px-4 py-2 rounded-lg bg-[#f48fb1] text-[#1a1a2e] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {clearing ? "Clearing..." : "Delete Everything"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
