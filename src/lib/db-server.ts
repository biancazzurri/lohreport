import { neon } from "@neondatabase/serverless";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

export async function ensureTables() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      items JSONB NOT NULL,
      total_calories REAL NOT NULL DEFAULT 0,
      total_protein REAL NOT NULL DEFAULT 0,
      total_carbs REAL NOT NULL DEFAULT 0,
      total_fat REAL NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_meals_user_date ON meals (user_email, date)`;
  await sql`
    CREATE TABLE IF NOT EXISTS allowed_users (
      email TEXT PRIMARY KEY,
      added_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_email TEXT PRIMARY KEY,
      calorie_goal REAL NOT NULL DEFAULT 2100,
      protein_goal REAL NOT NULL DEFAULT 150,
      carbs_goal REAL NOT NULL DEFAULT 220,
      fat_goal REAL NOT NULL DEFAULT 70
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS training_sessions (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      description TEXT NOT NULL,
      calories_burned REAL NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_training_user_date ON training_sessions (user_email, date)`;
}
