import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, ensureTables } from "@/lib/db-server";

// GET — fetch user settings
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getDb();
    await ensureTables();
    const rows = await sql`SELECT * FROM user_settings WHERE user_email = ${session.user.email}`;
    if (rows.length === 0) {
      return NextResponse.json({ calorieGoal: 2100, proteinGoal: 150, carbsGoal: 220, fatGoal: 70 });
    }
    const r = rows[0];
    return NextResponse.json({
      calorieGoal: r.calorie_goal,
      proteinGoal: r.protein_goal,
      carbsGoal: r.carbs_goal,
      fatGoal: r.fat_goal,
    });
  } catch (err) {
    console.error("Settings GET failed:", err);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST — save user settings
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    await ensureTables();
    const email = session.user.email;
    await sql`
      INSERT INTO user_settings (user_email, calorie_goal, protein_goal, carbs_goal, fat_goal)
      VALUES (${email}, ${data.calorieGoal}, ${data.proteinGoal}, ${data.carbsGoal}, ${data.fatGoal})
      ON CONFLICT (user_email) DO UPDATE SET
        calorie_goal = ${data.calorieGoal},
        protein_goal = ${data.proteinGoal},
        carbs_goal = ${data.carbsGoal},
        fat_goal = ${data.fatGoal}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Settings POST failed:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
