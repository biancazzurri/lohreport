import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";
import type { Meal, NutritionCacheEntry, Settings } from "./types";

interface BackupData {
  meals: Meal[];
  nutritionCache: NutritionCacheEntry[];
  settings: Settings[];
}

export async function exportData(): Promise<string> {
  const [meals, nutritionCache, settings] = await Promise.all([
    db.meals.toArray(),
    db.nutritionCache.toArray(),
    db.settings.toArray(),
  ]);

  const data: BackupData = { meals, nutritionCache, settings };
  return JSON.stringify(data);
}

export async function importData(json: string): Promise<void> {
  const data: BackupData = JSON.parse(json);

  await db.transaction("rw", [db.meals, db.nutritionCache, db.settings], async () => {
    await db.meals.clear();
    await db.nutritionCache.clear();
    await db.settings.clear();

    if (data.meals?.length) await db.meals.bulkAdd(data.meals);
    if (data.nutritionCache?.length) await db.nutritionCache.bulkAdd(data.nutritionCache);
    if (data.settings?.length) await db.settings.bulkAdd(data.settings);
  });
}

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.NEXT_PUBLIC_S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_KEY ?? "",
    },
  });
}

function archiveKey(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const HH = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `health-backup/archive/${YYYY}-${MM}-${DD}-${HH}${mm}${ss}.json`;
}

export async function uploadBackup(): Promise<void> {
  const json = await exportData();
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "";
  const client = getS3Client();

  const body = Buffer.from(json);

  await Promise.all([
    client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: "health-backup/latest.json",
        Body: body,
        ContentType: "application/json",
      })
    ),
    client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: archiveKey(),
        Body: body,
        ContentType: "application/json",
      })
    ),
  ]);
}

export async function downloadBackup(): Promise<string> {
  const bucket = process.env.NEXT_PUBLIC_S3_BUCKET ?? "";
  const client = getS3Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: "health-backup/latest.json",
    })
  );

  // response.Body is a ReadableStream / Blob in browser environments
  const body = response.Body;
  if (!body) throw new Error("Empty response body from S3");

  // Handle both Node.js streams and browser ReadableStreams
  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === "function") {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }

  // Fallback: collect chunks from async iterable
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleBackup(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    uploadBackup().catch(console.error);
  }, 5000);
}
