import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

// Ensure table exists
async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY DEFAULT 'latest',
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// GET — download backup
export async function GET() {
  try {
    const sql = getDb();
    await ensureTable();
    const rows = await sql`SELECT data FROM backups WHERE id = 'latest'`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "No backup found" }, { status: 404 });
    }
    return NextResponse.json(rows[0].data);
  } catch (err) {
    console.error("Backup GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch backup" }, { status: 500 });
  }
}

// POST — upload backup
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const sql = getDb();
    await ensureTable();
    await sql`
      INSERT INTO backups (id, data, updated_at)
      VALUES ('latest', ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Backup POST failed:", err);
    return NextResponse.json({ error: "Failed to save backup" }, { status: 500 });
  }
}
