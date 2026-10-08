import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";

function makeCode() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let v = "OP-";

  for (let i = 0; i < 6; i++) {
    v +=
      chars[
        Math.floor(Math.random() * chars.length)
      ];
  }

  return v;
}

function slug(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 30) || "OPTION"
  );
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();

  if (!ctx) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  const db = ctx.db;

  try {
    const b = await request.json();

    switch (b.action) {
      case "create_family": {
        const name = String(b.name || "").trim();

        if (!name) {
          return NextResponse.json(
            { error: "name_required" },
            { status: 400 }
          );
        }

        let family: any = null;
        let lastError: any = null;

        for (let i = 0; i < 5; i++) {
          const code =
            String(b.code || "")
              .trim()
              .toUpperCase() || makeCode();

          const r = await db
            .from("families")
            .insert({
              name,
              code,
              preferred_language:
                b.language === "en"
                  ? "en"
                  : "fr",
              invited_pre_wedding_dinner:
                false,
            })
            .select()
            .single();

          if (!r.error) {
            family = r.data;
            break;
          }

          lastError = r.error;

          if (b.code) break;
        }

        if (!family) throw lastError;

        const email = String(b.email || "")
          .trim()
          .toLowerCase();

        if (email) {
          const { error } = await db
            .from("family_emails")
            .insert({
              family_id: family.id,
              email,
            });

          if (error) throw error;
        }

        return NextResponse.json({
          ok: true,
          family,
        });
      }

      case "toggle_pre_wedding_dinner": {
        const familyId = String(
          b.family_id || ""
        );

        if (!familyId) {
          return NextResponse.json(
            { error: "family_id_required" },
            { status: 400 }
          );
        }

        const invited = Boolean(b.invited);

        const { error } = await db
          .from("families")
          .update({
            invited_pre_wedding_dinner:
              invited,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", familyId);

        if (error) throw error;

        /*
         * Si on retire une famille du souper,
         * on efface également ses anciennes
         * réponses au souper.
         */
        if (!invited) {
          const { error: guestError } =
            await db
              .from("guests")
              .update({
                pre_wedding_dinner_attending:
                  null,
                updated_at:
                  new Date().toISOString(),
              })
              .eq("family_id", familyId);

          if (guestError) throw guestError;
        }

        break;
      }

      case "add_guest": {
        const first = String(
          b.first_name || ""
        ).trim();

        if (!first) {
          return NextResponse.json(
            { error: "first_name_required" },
            { status: 400 }
          );
        }

        const { error } = await db
          .from("guests")
          .insert({
            family_id: b.family_id,
            first_name: first,
            last_name:
              String(b.last_name || "").trim() ||
              null,
            sort_order: Number(
              b.sort_order || 0
            ),
          });

        if (error) throw error;

        break;
      }

      case "delete_guest": {
        const { error } = await db
          .from("guests")
          .delete()
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      case "add_email": {
        const email = String(b.email || "")
          .trim()
          .toLowerCase();

        const { error } = await db
          .from("family_emails")
          .insert({
            family_id: b.family_id,
            email,
          });

        if (error) throw error;

        break;
      }

      case "delete_email": {
        const { error } = await db
          .from("family_emails")
          .delete()
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      case "delete_family": {
        const { error } = await db
          .from("families")
          .delete()
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      case "add_menu_option": {
        const fr = String(
          b.label_fr || ""
        ).trim();

        const en = String(
          b.label_en || ""
        ).trim();

        if (!fr || !en) {
          return NextResponse.json(
            { error: "labels_required" },
            { status: 400 }
          );
        }

        const { error } = await db
          .from("menu_options")
          .insert({
            code: slug(
              String(b.code || fr)
            ),
            label_fr: fr,
            label_en: en,
            description_fr:
              String(
                b.description_fr || ""
              ).trim() || null,
            description_en:
              String(
                b.description_en || ""
              ).trim() || null,
            sort_order: Number(
              b.sort_order || 0
            ),
            active: true,
          });

        if (error) throw error;

        break;
      }

      case "delete_menu_option": {
        const { error } = await db
          .from("menu_options")
          .delete()
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      case "toggle_menu": {
        const isOpen = Boolean(b.menu_open);

        const { error } = await db
          .from("site_settings")
          .update({
            menu_open: isOpen,
            menu_opened_at: isOpen
              ? new Date().toISOString()
              : null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", 1);

        if (error) throw error;

        break;
      }

      case "photo_approve": {
        const { error } = await db
          .from("photos")
          .update({
            approved: Boolean(b.approved),
          })
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      case "photo_delete": {
        const { data: p } = await db
          .from("photos")
          .select("storage_path")
          .eq("id", b.id)
          .single();

        if (p?.storage_path) {
          await db.storage
            .from("wedding-photos")
            .remove([p.storage_path]);
        }

        const { error } = await db
          .from("photos")
          .delete()
          .eq("id", b.id);

        if (error) throw error;

        break;
      }

      default:
        return NextResponse.json(
          { error: "unknown_action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message || "server_error",
      },
      { status: 500 }
    );
  }
}