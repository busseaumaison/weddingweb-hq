import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    const normalized = String(code || "")
      .trim()
      .toUpperCase();

    if (!normalized) {
      return NextResponse.json(
        { error: "missing_code" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data: family, error: familyError } = await db
      .from("families")
      .select(
        "id,name,code,preferred_language,rsvp_completed_at,invited_pre_wedding_dinner"
      )
      .eq("code", normalized)
      .maybeSingle();

    if (familyError) throw familyError;

    if (!family) {
      return NextResponse.json(
        { error: "not_found" },
        { status: 404 }
      );
    }

    const [
      { data: guests, error: guestsError },
      { data: emails, error: emailsError },
    ] = await Promise.all([
      db
        .from("guests")
        .select(
          "id,first_name,last_name,attending,allergies_intolerances,food_aversions,pre_wedding_dinner_attending"
        )
        .eq("family_id", family.id)
        .order("sort_order"),

      db
        .from("family_emails")
        .select("id,email")
        .eq("family_id", family.id)
        .order("created_at"),
    ]);

    if (guestsError) throw guestsError;
    if (emailsError) throw emailsError;

    return NextResponse.json({
      family,
      guests: guests ?? [],
      emails: emails ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}