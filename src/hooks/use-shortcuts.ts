import { useLiveQuery } from "dexie-react-hooks";
import { getShortcuts } from "@/lib/shortcuts";
import type { Shortcut } from "@/lib/shortcuts";

export function useShortcuts(): Shortcut[] {
  const shortcuts = useLiveQuery(() => getShortcuts(), []);
  return shortcuts ?? [];
}
