import { v4 as uuidv4 } from "uuid";
import { db } from "./db";
import type { TrainingSession } from "./types";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentTime(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function addTraining({
  description,
  caloriesBurned,
  date,
  time,
}: {
  description: string;
  caloriesBurned: number;
  date?: string;
  time?: string;
}): Promise<TrainingSession> {
  const session: TrainingSession = {
    id: uuidv4(),
    date: date ?? todayDate(),
    time: time ?? currentTime(),
    description,
    caloriesBurned,
    createdAt: Date.now(),
  };

  await db.trainingSessions.put(session);
  fetch("/api/training", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  }).catch((err) => console.error("[sync] training save failed:", err));
  return session;
}

export async function deleteTraining(id: string): Promise<void> {
  await db.trainingSessions.delete(id);
  fetch("/api/training", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch((err) => console.error("[sync] training delete failed:", err));
}
