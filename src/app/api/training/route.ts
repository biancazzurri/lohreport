import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getDb, ensureTables } from "@/lib/db-server";
import { checkRateLimit } from "@/lib/rate-limit";

const ExerciseSchema = z.object({
  description: z.string().min(1).max(200),
  caloriesBurned: z.number().min(0).max(100_000),
});

const TrainingSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  exercises: z.array(ExerciseSchema).min(1).max(50),
  totalCaloriesBurned: z.number().min(0).max(100_000),
  createdAt: z.number(),
});

const DeleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const sql = getDb();
    await ensureTables();

    const rows = since
      ? await sql`SELECT * FROM training_sessions WHERE user_email = ${session.user.email} AND date >= ${since} ORDER BY date DESC, time`
      : await sql`SELECT * FROM training_sessions WHERE user_email = ${session.user.email} ORDER BY date DESC, time`;

    const sessions = rows.map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      exercises: r.exercises,
      totalCaloriesBurned: r.total_calories_burned,
      createdAt: Number(r.created_at),
    }));

    return NextResponse.json(sessions);
  } catch (err) {
    console.error("Training GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch training sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`training:${session.user.email}`, 60_000, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = TrainingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid training data" }, { status: 400 });
    }

    const t = parsed.data;
    const sql = getDb();
    await ensureTables();

    await sql`
      INSERT INTO training_sessions (id, user_email, date, time, exercises, total_calories_burned, created_at)
      VALUES (${t.id}, ${session.user.email}, ${t.date}, ${t.time}, ${JSON.stringify(t.exercises)}::jsonb, ${t.totalCaloriesBurned}, ${t.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        exercises = ${JSON.stringify(t.exercises)}::jsonb,
        total_calories_burned = ${t.totalCaloriesBurned}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Training POST failed:", err);
    return NextResponse.json({ error: "Failed to save training" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = DeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const sql = getDb();
    await ensureTables();
    await sql`DELETE FROM training_sessions WHERE id = ${parsed.data.id} AND user_email = ${session.user.email}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Training DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete training" }, { status: 500 });
  }
}
