import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";

export async function GET() {
  const ctx = await getAdminContext();

  if (!ctx) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const { db } = ctx;

  const [families, options, settings, photos] =
    await Promise.all([
      db
        .from("families")
        .select(`
          id,
          name,
          code,
          preferred_language,
          rsvp_completed_at,
          invited_pre_wedding_dinner,
          created_at,
          family_emails(
            id,
            email
          ),
          guests(
            id,
            first_name,
            last_name,
            attending,
            allergies_intolerances,
            food_aversions,
            pre_wedding_dinner_attending,
            menu_option_id,
            menu_completed_at,
            sort_order
          )
        `)
        .order("name"),

      db
        .from("menu_options")
        .select("*")
        .order("sort_order"),

      db
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single(),

      db
        .from("photos")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),
    ]);

  if (
    families.error ||
    options.error ||
    settings.error ||
    photos.error
  ) {
    console.error("Admin data error:", {
      families: families.error,
      options: options.error,
      settings: settings.error,
      photos: photos.error,
    });

    return NextResponse.json(
      { error: "database_error" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    families: families.data ?? [],
    menuOptions: options.data ?? [],
    settings: settings.data,
    photos: photos.data ?? [],
  });
}