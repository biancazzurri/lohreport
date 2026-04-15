interface TrainingParseResult {
  description: string;
  caloriesBurned: number;
}

export async function parseTraining(text: string): Promise<TrainingParseResult> {
  const res = await fetch("/api/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode: "training" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Parse failed: ${res.status}`);
  }

  return res.json();
}
