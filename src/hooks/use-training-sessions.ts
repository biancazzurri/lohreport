import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { TrainingSession } from "@/lib/types";

export function useTrainingSessions(date: string): TrainingSession[] {
  const sessions = useLiveQuery(
    () => db.trainingSessions.where("date").equals(date).sortBy("time"),
    [date]
  );
  return sessions ?? [];
}
