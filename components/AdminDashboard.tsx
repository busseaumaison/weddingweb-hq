"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard({
  email,
}: {
  email: string;
}) {
  const [data, setData] = useState<any>(null);

  const [tab, setTab] = useState<
    "families" | "menu" | "photos"
  >("families");

  const [status, setStatus] = useState("");

  const [newFamily, setNewFamily] = useState({
    name: "",
    email: "",
    language: "fr",
  });

  const [menuForm, setMenuForm] = useState({
    label_fr: "",
    label_en: "",
    description_fr: "",
    description_en: "",
  });

  async function load() {
    const r = await fetch("/api/admin/data");

    if (r.ok) {
      setData(await r.json());
    } else {
      setStatus("Impossible de charger les données.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function action(body: any) {
    setStatus("");

    const r = await fetch("/api/admin/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const x = await r.json();

    if (!r.ok) {
      setStatus(x.error || "Erreur");
      return null;
    }

    await load();

    return x;
  }

  async function logout() {
    const s = createClient();

    await s.auth.signOut();

    location.href = "/admin/login";
  }

  const guests = useMemo(
    () =>
      data?.families.flatMap(
        (f: any) => f.guests || []
      ) || [],
    [data]
  );

  if (!data) {
    return (
      <main>
        <header className="adminHeader">
          <div className="shell">
            Administration
          </div>
        </header>

        <section className="section">
          <div className="shell">
            {status || "Chargement…"}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <header className="adminHeader">
        <div className="shell navrow">
          <strong
            className="serif"
            style={{ fontSize: 24 }}
          >
            O & P · Administration
          </strong>

          <span>
            {email} ·{" "}
            <button onClick={logout}>
              Déconnexion
            </button>
          </span>
        </div>
      </header>

      <section className="section">
        <div className="shell">
          <div className="eyebrow">
            Tableau de bord
          </div>

          <h1 className="serif title">
            Mariage 2027
          </h1>

          {/* STATISTIQUES DU MARIAGE */}

          <div className="stats">
            <div className="card stat">
              <strong>{guests.length}</strong>
              Invités
            </div>

            <div className="card stat">
              <strong>
                {
                  guests.filter(
                    (g: any) =>
                      g.attending === true
                  ).length
                }
              </strong>
              Présents
            </div>

            <div className="card stat">
              <strong>
                {
                  guests.filter(
                    (g: any) =>
                      g.attending === false
                  ).length
                }
              </strong>
              Absents
            </div>

            <div className="card stat">
              <strong>
                {
                  guests.filter(
                    (g: any) =>
                      g.attending === null
                  ).length
                }
              </strong>
              Sans réponse
            </div>
          </div>

          {/* ONGLETS */}

          <div className="tabs">
            <button
              className={
                "btn " +
                (tab === "families"
                  ? "btnDark"
                  : "")
              }
              onClick={() =>
                setTab("families")
              }
            >
              Familles & RSVP
            </button>

            <button
              className={
                "btn " +
                (tab === "menu"
                  ? "btnDark"
                  : "")
              }
              onClick={() => setTab("menu")}
            >
              Menu
            </button>

            <button
              className={
                "btn " +
                (tab === "photos"
                  ? "btnDark"
                  : "")
              }
              onClick={() =>
                setTab("photos")
              }
            >
              Photos
            </button>
          </div>

          {status && (
            <div className="notice error">
              {status}
            </div>
          )}

          {/* ========================= */}
          {/* FAMILLES & RSVP */}
          {/* ========================= */}

          {tab === "families" && (
            <div className="adminGrid">
              <div>
                <div className="card">
                  <h2
                    className="serif"
                    style={{ fontSize: 32 }}
                  >
                    Ajouter une famille
                  </h2>

                  <div className="field">
                    <label>
                      Nom de l&apos;invitation
                    </label>

                    <input
                      className="input"
                      value={newFamily.name}
                      onChange={(e) =>
                        setNewFamily({
                          ...newFamily,
                          name: e.target.value,
                        })
                      }
                      placeholder="Famille Tremblay"
                    />
                  </div>

                  <div className="field">
                    <label>
                      Premier courriel
                      (facultatif)
                    </label>

                    <input
                      className="input"
                      value={newFamily.email}
                      onChange={(e) =>
                        setNewFamily({
                          ...newFamily,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Langue</label>

                    <select
                      className="input"
                      value={newFamily.language}
                      onChange={(e) =>
                        setNewFamily({
                          ...newFamily,
                          language:
                            e.target.value,
                        })
                      }
                    >
                      <option value="fr">
                        Français
                      </option>

                      <option value="en">
                        English
                      </option>
                    </select>
                  </div>

                  <button
                    className="btn btnDark"
                    onClick={async () => {
                      const x = await action({
                        action:
                          "create_family",
                        ...newFamily,
                      });

                      if (x) {
                        setNewFamily({
                          name: "",
                          email: "",
                          language: "fr",
                        });
                      }
                    }}
                  >
                    Créer + générer le code
                  </button>
                </div>
              </div>

              <div className="familyList">
                {data.families.map(
                  (f: any) => (
                    <FamilyAdminCard
                      key={f.id}
                      family={f}
                      action={action}
                    />
                  )
                )}
              </div>
            </div>
          )}

          {/* ========================= */}
          {/* MENU */}
          {/* ========================= */}

          {tab === "menu" && (
            <div className="adminGrid">
              <div className="card">
                <div className="familyHead">
                  <div>
                    <div className="eyebrow">
                      État du menu
                    </div>

                    <h2
                      className="serif"
                      style={{ fontSize: 34 }}
                    >
                      {data.settings
                        ?.menu_open
                        ? "Ouvert aux invités"
                        : "Fermé pour l'instant"}
                    </h2>
                  </div>

                  <span
                    className={
                      "badge " +
                      (data.settings
                        ?.menu_open
                        ? "ok"
                        : "wait")
                    }
                  >
                    {data.settings
                      ?.menu_open
                      ? "OUVERT"
                      : "FERMÉ"}
                  </span>
                </div>

                <p className="muted">
                  Quand le menu sera prêt,
                  ajoute les choix ci-dessous,
                  ouvre le menu, puis envoie le
                  courriel aux familles ayant
                  confirmé au moins une
                  présence.
                </p>

                <div className="actions">
                  <button
                    className="btn btnDark"
                    onClick={() =>
                      action({
                        action:
                          "toggle_menu",
                        menu_open:
                          !data.settings
                            ?.menu_open,
                      })
                    }
                  >
                    {data.settings?.menu_open
                      ? "Fermer le menu"
                      : "Ouvrir le menu"}
                  </button>

                  <button
                    className="btn"
                    disabled={
                      !data.settings
                        ?.menu_open ||
                      !data.menuOptions.length
                    }
                    onClick={async () => {
                      if (
                        !confirm(
                          "Envoyer l'avis de menu aux familles admissibles ?"
                        )
                      ) {
                        return;
                      }

                      const r = await fetch(
                        "/api/admin/menu-notify",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type":
                              "application/json",
                          },
                          body: JSON.stringify({
                            force: false,
                          }),
                        }
                      );

                      const x =
                        await r.json();

                      setStatus(
                        r.ok
                          ? `Courriels : ${x.sent} envoyés, ${x.skipped} ignorés, ${x.failed} échecs.`
                          : x.error ||
                              "Erreur d'envoi."
                      );
                    }}
                  >
                    Envoyer l&apos;avis par
                    courriel
                  </button>
                </div>

                <div className="hr" />

                <h3
                  className="serif"
                  style={{ fontSize: 28 }}
                >
                  Ajouter un choix de repas
                </h3>

                <div className="field">
                  <label>Nom français</label>

                  <input
                    className="input"
                    value={
                      menuForm.label_fr
                    }
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        label_fr:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>English name</label>

                  <input
                    className="input"
                    value={
                      menuForm.label_en
                    }
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        label_en:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>
                    Description française
                  </label>

                  <textarea
                    className="input textarea"
                    value={
                      menuForm.description_fr
                    }
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        description_fr:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div className="field">
                  <label>
                    English description
                  </label>

                  <textarea
                    className="input textarea"
                    value={
                      menuForm.description_en
                    }
                    onChange={(e) =>
                      setMenuForm({
                        ...menuForm,
                        description_en:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  className="btn btnDark"
                  onClick={async () => {
                    const x = await action({
                      action:
                        "add_menu_option",
                      ...menuForm,
                    });

                    if (x) {
                      setMenuForm({
                        label_fr: "",
                        label_en: "",
                        description_fr: "",
                        description_en: "",
                      });
                    }
                  }}
                >
                  Ajouter
                </button>
              </div>

              <div className="familyList">
                {data.menuOptions.map(
                  (o: any) => (
                    <div
                      className="card"
                      key={o.id}
                    >
                      <div className="familyHead">
                        <div>
                          <strong>
                            {o.label_fr}
                          </strong>

                          <div className="muted">
                            {o.label_en}
                          </div>
                        </div>

                        <button
                          className="btn btnDanger"
                          onClick={() =>
                            action({
                              action:
                                "delete_menu_option",
                              id: o.id,
                            })
                          }
                        >
                          Supprimer
                        </button>
                      </div>

                      <p className="muted">
                        {o.description_fr ||
                          "—"}
                      </p>
                    </div>
                  )
                )}

                {!data.menuOptions.length && (
                  <div className="card muted">
                    Aucun choix de repas pour
                    le moment — parfait tant
                    que l&apos;Estérel ne
                    t&apos;a pas remis le
                    menu.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================= */}
          {/* PHOTOS */}
          {/* ========================= */}

          {tab === "photos" && (
            <div className="photoAdmin">
              {data.photos.map((p: any) => {
                const s = createClient();

                const { data: url } =
                  s.storage
                    .from("wedding-photos")
                    .getPublicUrl(
                      p.storage_path
                    );

                return (
                  <article
                    className="card"
                    key={p.id}
                  >
                    <img
                      src={url.publicUrl}
                      alt={
                        p.caption ||
                        p.guest_name
                      }
                    />

                    <h3>{p.guest_name}</h3>

                    <p className="muted">
                      {p.caption ||
                        "Sans légende"}
                    </p>

                    <div className="actions">
                      <button
                        className="btn btnDark"
                        onClick={() =>
                          action({
                            action:
                              "photo_approve",
                            id: p.id,
                            approved:
                              !p.approved,
                          })
                        }
                      >
                        {p.approved
                          ? "Masquer"
                          : "Approuver"}
                      </button>

                      <button
                        className="btn btnDanger"
                        onClick={() =>
                          action({
                            action:
                              "photo_delete",
                            id: p.id,
                          })
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

/* ================================================= */
/* CARTE D'ADMINISTRATION D'UNE FAMILLE              */
/* ================================================= */

function FamilyAdminCard({
  family,
  action,
}: {
  family: any;
  action: (body: any) => Promise<any>;
}) {
  const [guest, setGuest] = useState({
    first_name: "",
    last_name: "",
  });

  const [email, setEmail] = useState("");

  const sortedGuests = [
    ...(family.guests || []),
  ].sort(
    (a: any, b: any) =>
      a.sort_order - b.sort_order
  );

  const dinnerGuests = sortedGuests.filter(
    (g: any) =>
      g.pre_wedding_dinner_attending === true
  );

  const dinnerDeclined = sortedGuests.filter(
    (g: any) =>
      g.pre_wedding_dinner_attending === false
  );

  const dinnerWaiting = sortedGuests.filter(
    (g: any) =>
      g.pre_wedding_dinner_attending === null ||
      typeof g.pre_wedding_dinner_attending ===
        "undefined"
  );

  return (
    <div className="card">
      {/* EN-TÊTE DE LA FAMILLE */}

      <div className="familyHead">
        <div>
          <h3
            className="serif"
            style={{
              fontSize: 28,
              margin: 0,
            }}
          >
            {family.name}
          </h3>

          <p>
            <span className="code">
              {family.code}
            </span>{" "}
            ·{" "}
            {family.preferred_language.toUpperCase()}{" "}
            ·{" "}
            {family.rsvp_completed_at ? (
              <span className="badge ok">
                RSVP reçu
              </span>
            ) : (
              <span className="badge wait">
                En attente
              </span>
            )}
          </p>
        </div>

        <button
          className="btn btnDanger"
          onClick={() => {
            if (
              confirm(
                `Supprimer ${family.name} et tous ses invités ?`
              )
            ) {
              action({
                action: "delete_family",
                id: family.id,
              });
            }
          }}
        >
          Supprimer
        </button>
      </div>

      {/* SOUPER DE LA VEILLE */}

      <div className="hr" />

      <div
        className="familyHead"
        style={{
          alignItems: "center",
          gap: 20,
        }}
      >
        <div>
          <strong>
            Souper de la veille
          </strong>

          <div
            className="muted"
            style={{
              fontSize: 13,
              marginTop: 5,
            }}
          >
            Vendredi 16 juillet 2027
          </div>
        </div>

        <button
          className={
            "btn " +
            (family.invited_pre_wedding_dinner
              ? "btnDark"
              : "")
          }
          type="button"
          onClick={() =>
            action({
              action:
                "toggle_pre_wedding_dinner",
              family_id: family.id,
              invited:
                !family.invited_pre_wedding_dinner,
            })
          }
        >
          {family.invited_pre_wedding_dinner
            ? "✓ Invitée"
            : "Non invitée"}
        </button>
      </div>

      {family.invited_pre_wedding_dinner && (
        <div
          style={{
            marginTop: 18,
            padding: "18px",
            background: "var(--sand)",
            borderRadius: 12,
          }}
        >
          <div
            className="eyebrow"
            style={{ marginBottom: 12 }}
          >
            Réponses au souper
          </div>

          {sortedGuests.length === 0 ? (
            <div className="muted">
              Aucun invité dans cette famille.
            </div>
          ) : (
            <>
              {sortedGuests.map((g: any) => (
                <div
                  key={`dinner-${g.id}`}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 15,
                    padding: "6px 0",
                  }}
                >
                  <span>
                    {g.first_name}{" "}
                    {g.last_name || ""}
                  </span>

                  <strong>
                    {g.pre_wedding_dinner_attending ===
                    true
                      ? "✓ Présent"
                      : g.pre_wedding_dinner_attending ===
                          false
                        ? "✕ Absent"
                        : "— En attente"}
                  </strong>
                </div>
              ))}

              <div
                className="muted"
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop:
                    "1px solid var(--line)",
                  fontSize: 13,
                }}
              >
                {dinnerGuests.length} présent
                {dinnerGuests.length !== 1
                  ? "s"
                  : ""}{" "}
                · {dinnerDeclined.length} absent
                {dinnerDeclined.length !== 1
                  ? "s"
                  : ""}{" "}
                · {dinnerWaiting.length} en
                attente
              </div>
            </>
          )}
        </div>
      )}

      {/* INVITÉS DU MARIAGE */}

      <div className="hr" />

      <strong>Invités</strong>

      {sortedGuests.map((g: any) => (
        <div
          className="familyHead"
          key={g.id}
          style={{ marginTop: 10 }}
        >
          <span>
            {g.first_name}{" "}
            {g.last_name || ""} —{" "}
            {g.attending === true
              ? "Présent"
              : g.attending === false
                ? "Absent"
                : "?"}
          </span>

          <button
            onClick={() =>
              action({
                action: "delete_guest",
                id: g.id,
              })
            }
          >
            ×
          </button>
        </div>
      ))}

      {/* AJOUT D'UN INVITÉ */}

      <div
        className="inlineForm"
        style={{ marginTop: 12 }}
      >
        <div className="field">
          <label>Prénom</label>

          <input
            className="input"
            value={guest.first_name}
            onChange={(e) =>
              setGuest({
                ...guest,
                first_name: e.target.value,
              })
            }
          />
        </div>

        <div className="field">
          <label>Nom</label>

          <input
            className="input"
            value={guest.last_name}
            onChange={(e) =>
              setGuest({
                ...guest,
                last_name: e.target.value,
              })
            }
          />
        </div>

        <button
          className="btn"
          onClick={async () => {
            const x = await action({
              action: "add_guest",
              family_id: family.id,
              ...guest,
              sort_order:
                (family.guests || [])
                  .length,
            });

            if (x) {
              setGuest({
                first_name: "",
                last_name: "",
              });
            }
          }}
        >
          + invité
        </button>
      </div>

      {/* COURRIELS */}

      <div className="hr" />

      <strong>Courriels</strong>

      {(family.family_emails || []).map(
        (x: any) => (
          <div
            className="familyHead"
            key={x.id}
            style={{ marginTop: 8 }}
          >
            <span>{x.email}</span>

            <button
              onClick={() =>
                action({
                  action: "delete_email",
                  id: x.id,
                })
              }
            >
              ×
            </button>
          </div>
        )
      )}

      <div
        className="inlineForm"
        style={{ marginTop: 12 }}
      >
        <div className="field">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="email@example.com"
          />
        </div>

        <button
          className="btn"
          onClick={async () => {
            const x = await action({
              action: "add_email",
              family_id: family.id,
              email,
            });

            if (x) {
              setEmail("");
            }
          }}
        >
          + courriel
        </button>
      </div>
    </div>
  );
}