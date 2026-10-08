import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const emailOk = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(request: Request) {
  try {
    const b = await request.json();

    const code = String(b.code || "")
      .trim()
      .toUpperCase();

    const familyId = String(b.familyId || "");

    const language =
      b.language === "en" ? "en" : "fr";

    const emails = Array.from(
      new Set(
        (
          Array.isArray(b.emails)
            ? b.emails
            : []
        )
          .map((x: unknown) =>
            String(x).trim().toLowerCase()
          )
          .filter(emailOk)
      )
    );

    const responses = Array.isArray(b.guests)
      ? b.guests
      : [];

    if (
      !familyId ||
      !code ||
      emails.length < 1
    ) {
      return NextResponse.json(
        { error: "invalid_request" },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const {
      data: family,
      error: familyError,
    } = await db
      .from("families")
      .select(
        "id,code,invited_pre_wedding_dinner"
      )
      .eq("id", familyId)
      .eq("code", code)
      .maybeSingle();

    if (familyError) throw familyError;

    if (!family) {
      return NextResponse.json(
        { error: "invalid_code" },
        { status: 403 }
      );
    }

    const {
      data: invited,
      error: invitedError,
    } = await db
      .from("guests")
      .select("id")
      .eq("family_id", familyId);

    if (invitedError) throw invitedError;

    const ids = new Set(
      (invited ?? []).map((x) => x.id)
    );

    if (
      !invited?.length ||
      responses.length !== invited.length
    ) {
      return NextResponse.json(
        { error: "incomplete" },
        { status: 400 }
      );
    }

    for (const r of responses) {
      if (
        !ids.has(r.id) ||
        typeof r.attending !== "boolean"
      ) {
        return NextResponse.json(
          { error: "invalid_guest" },
          { status: 400 }
        );
      }

      if (
        family.invited_pre_wedding_dinner &&
        typeof r.preWeddingDinnerAttending !==
          "boolean"
      ) {
        return NextResponse.json(
          {
            error:
              "missing_pre_wedding_dinner_response",
          },
          { status: 400 }
        );
      }
    }

    for (const r of responses) {
      const updateData: {
        attending: boolean;
        allergies_intolerances: string | null;
        food_aversions: string | null;
        pre_wedding_dinner_attending:
          | boolean
          | null;
        updated_at: string;
      } = {
        attending: r.attending,

        allergies_intolerances: r.attending
          ? String(r.allergies || "").trim() ||
            null
          : null,

        food_aversions: r.attending
          ? String(r.aversions || "").trim() ||
            null
          : null,

        pre_wedding_dinner_attending:
          family.invited_pre_wedding_dinner
            ? r.preWeddingDinnerAttending
            : null,

        updated_at: new Date().toISOString(),
      };

      const { error } = await db
        .from("guests")
        .update(updateData)
        .eq("id", r.id)
        .eq("family_id", familyId);

      if (error) throw error;
    }

    const { error: deleteEmailError } =
      await db
        .from("family_emails")
        .delete()
        .eq("family_id", familyId);

    if (deleteEmailError) {
      throw deleteEmailError;
    }

    const { error: emailError } = await db
      .from("family_emails")
      .insert(
        emails.map((email) => ({
          family_id: familyId,
          email,
        }))
      );

    if (emailError) throw emailError;

    const { error: familyUpdateError } =
      await db
        .from("families")
        .update({
          preferred_language: language,
          rsvp_completed_at:
            new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", familyId);

    if (familyUpdateError) {
      throw familyUpdateError;
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}