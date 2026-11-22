import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAdminNotification } from "@/lib/notifications";

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const hotelValues = new Set(["0", "1", "2plus", "unsure"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const familyId = String(body.familyId || "");
    const language = body.language === "en" ? "en" : "fr";
    const hotelStay = String(body.hotelStay || "");
    const rawEmails: unknown[] = Array.isArray(body.emails) ? body.emails : [];
    const emails = [...new Set(rawEmails
      .map((value) => String(value).trim().toLowerCase())
      .filter(emailOk))];
    const responses: any[] = Array.isArray(body.guests) ? body.guests : [];
    const songSuggestion = String(body.songSuggestion ?? "").trim();
    const messageToCouple = String(body.messageToCouple ?? "").trim();
    const sharedMemory = String(body.sharedMemory ?? "").trim();
    if (songSuggestion.length > 250 || messageToCouple.length > 2000 || sharedMemory.length > 2000) {
      return NextResponse.json({ error: "text_too_long" }, { status: 400 });
    }

    if (!familyId || !code || !emails.length || emails.length > 20 ||
        !hotelValues.has(hotelStay) || code.length > 80) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: family, error: familyError } = await db
      .from("families")
      .select("id,name,code,rsvp_completed_at,invited_pre_wedding_dinner,invited_rehearsal")
      .eq("id", familyId)
      .eq("code", code)
      .maybeSingle();

    if (familyError) throw familyError;
    if (!family) {
      return NextResponse.json({ error: "invalid_code" }, { status: 403 });
    }

    const { data: invited, error: guestsError } = await db
      .from("guests")
      .select("id,is_child")
      .eq("family_id", familyId);
    if (guestsError) throw guestsError;

    const permittedIds = new Set((invited ?? []).map((guest) => guest.id));
    const childIds = new Set((invited ?? []).filter(g => g.is_child).map(g => g.id));
    if (!invited?.length || responses.length !== invited.length) {
      return NextResponse.json({ error: "incomplete" }, { status: 400 });
    }

    const encountered = new Set<string>();
    for (const response of responses) {
      const id = String(response?.id || "");
      if (!permittedIds.has(id) || encountered.has(id) ||
          typeof response?.attending !== "boolean") {
        return NextResponse.json({ error: "invalid_guest" }, { status: 400 });
      }
      encountered.add(id);
      if (childIds.has(id) && response.attending === true && (!Number.isInteger(response.childAge) || response.childAge < 0 || response.childAge > 17)) {
        return NextResponse.json({ error: "invalid_child_age" }, { status: 400 });
      }
      for (const field of ["preWeddingDinnerAttending", "rehearsalAttending"]) {
        if (response[field] != null && typeof response[field] !== "boolean") {
          return NextResponse.json({ error: "invalid_response" }, { status: 400 });
        }
      }
      if (family.invited_pre_wedding_dinner &&
          response.preWeddingDinnerAttending == null && response.preWeddingDinnerUnsure !== true) {
        return NextResponse.json({ error: "dinner_response_required" }, { status: 400 });
      }
      if (family.invited_rehearsal &&
          response.rehearsalAttending == null && response.rehearsalUnsure !== true) {
        return NextResponse.json({ error: "rehearsal_response_required" }, { status: 400 });
      }
      if (response.preWeddingDinnerUnsure === true && response.preWeddingDinnerAttending != null ||
          response.rehearsalUnsure === true && response.rehearsalAttending != null) {
        return NextResponse.json({ error: "conflicting_response" }, { status: 400 });
      }
      if (String(response.allergies || "").length > 2000 ||
          String(response.aversions || "").length > 2000) {
        return NextResponse.json({ error: "text_too_long" }, { status: 400 });
      }
    }

    // Les invitations privées sont contrôlées côté serveur, jamais par le navigateur.
    for (const response of responses) {
      const update = {
        attending: response.attending,
        child_age: childIds.has(response.id) && response.attending ? response.childAge : null,
        allergies_intolerances: response.attending
          ? String(response.allergies || "").trim() || null : null,
        food_aversions: response.attending
          ? String(response.aversions || "").trim() || null : null,
        pre_wedding_dinner_attending: family.invited_pre_wedding_dinner
          ? (response.preWeddingDinnerAttending ?? null) : null,
        pre_wedding_dinner_unsure: family.invited_pre_wedding_dinner
          ? response.preWeddingDinnerUnsure === true : false,
        rehearsal_attending: family.invited_rehearsal
          ? (response.rehearsalAttending ?? null) : null,
        rehearsal_unsure: family.invited_rehearsal
          ? response.rehearsalUnsure === true : false,
        updated_at: new Date().toISOString(),
      };
      const { error } = await db.from("guests")
        .update(update)
        .eq("id", response.id)
        .eq("family_id", familyId);
      if (error) throw error;
    }

    const { error: emailDeleteError } = await db.from("family_emails")
      .delete().eq("family_id", familyId);
    if (emailDeleteError) throw emailDeleteError;

    const { error: emailInsertError } = await db.from("family_emails")
      .insert(emails.map((email) => ({ family_id: familyId, email })));
    if (emailInsertError) throw emailInsertError;

    const { error: familyUpdateError } = await db.from("families")
      .update({
        hotel_stay: hotelStay,
        song_suggestion: songSuggestion || null,
        message_to_couple: messageToCouple || null,
        shared_memory: sharedMemory || null,

        rsvp_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", familyId);
    if (familyUpdateError) throw familyUpdateError;

    // Une notification ne doit jamais empêcher l’enregistrement d’un RSVP.
    await sendAdminNotification({
      subject: family.rsvp_completed_at ? "RSVP modifié" : "Nouveau RSVP",
      message: `Famille : ${family.name}. ${responses.filter(g => g.attending).length} présent(s) sur ${responses.length}. Consultez l’administration pour les détails.`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
