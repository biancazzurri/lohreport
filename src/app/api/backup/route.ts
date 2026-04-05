import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
}

async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS backups (
      user_email TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// GET — download backup for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    await ensureTable();
    const rows = await sql`SELECT data FROM backups WHERE user_email = ${session.user.email}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "No backup found" }, { status: 404 });
    }
    return NextResponse.json(rows[0].data);
  } catch (err) {
    console.error("Backup GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch backup" }, { status: 500 });
  }
}

// POST — upload backup for current user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    await ensureTable();
    const email = session.user.email;
    await sql`
      INSERT INTO backups (user_email, data, updated_at)
      VALUES (${email}, ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (user_email) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Backup POST failed:", err);
    return NextResponse.json({ error: "Failed to save backup" }, { status: 500 });
  }
}
