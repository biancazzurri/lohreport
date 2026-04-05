import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, ensureTables } from "@/lib/db-server";

// GET — fetch meals for a date (or all)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const sql = getDb();
    await ensureTables();

    const rows = date
      ? await sql`SELECT * FROM meals WHERE user_email = ${session.user.email} AND date = ${date} ORDER BY time`
      : await sql`SELECT * FROM meals WHERE user_email = ${session.user.email} ORDER BY date DESC, time`;

    const meals = rows.map((r) => ({
      id: r.id,
      date: r.date,
      time: r.time,
      items: r.items,
      totalCalories: r.total_calories,
      totalProtein: r.total_protein,
      totalCarbs: r.total_carbs,
      totalFat: r.total_fat,
      createdAt: Number(r.created_at),
    }));

    return NextResponse.json(meals);
  } catch (err) {
    console.error("Meals GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

// POST — add a meal
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meal = await request.json();
    const sql = getDb();
    await ensureTables();

    await sql`
      INSERT INTO meals (id, user_email, date, time, items, total_calories, total_protein, total_carbs, total_fat, created_at)
      VALUES (
        ${meal.id},
        ${session.user.email},
        ${meal.date},
        ${meal.time},
        ${JSON.stringify(meal.items)}::jsonb,
        ${meal.totalCalories},
        ${meal.totalProtein},
        ${meal.totalCarbs},
        ${meal.totalFat},
        ${meal.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        items = ${JSON.stringify(meal.items)}::jsonb,
        total_calories = ${meal.totalCalories},
        total_protein = ${meal.totalProtein},
        total_carbs = ${meal.totalCarbs},
        total_fat = ${meal.totalFat}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Meals POST failed:", err);
    return NextResponse.json({ error: "Failed to save meal" }, { status: 500 });
  }
}

// DELETE — remove a meal
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const sql = getDb();
    await ensureTables();
    await sql`DELETE FROM meals WHERE id = ${id} AND user_email = ${session.user.email}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Meals DELETE failed:", err);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
