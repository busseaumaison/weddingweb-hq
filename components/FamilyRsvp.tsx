"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type G = {
  id: string;
  first_name: string;
  last_name: string | null;
  attending: boolean | null;
  allergies_intolerances: string | null;
  food_aversions: string | null;
  pre_wedding_dinner_attending: boolean | null;
};

type D = {
  family: {
    id: string;
    name: string;
    code: string;
    invited_pre_wedding_dinner: boolean;
  };
  guests: G[];
  emails: {
    id: string;
    email: string;
  }[];
};

export default function FamilyRsvp() {
  const { lang, t } = useLanguage();

  const [code, setCode] = useState("");
  const [data, setData] = useState<D | null>(null);
  const [guests, setGuests] = useState<G[]>([]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);

  const dinnerText =
    lang === "fr"
      ? {
          eyebrow: "Vendredi soir · 16 juillet 2027",
          title: "Souper de la veille",
          intro:
            "Nous aimerions beaucoup vous retrouver dès le vendredi soir pour commencer les célébrations avec nous autour d’un souper.",
          payment:
            "Ce moment est tout à fait facultatif. Chacun pourra commander et régler son repas sur place.",
          question: "Serez-vous des nôtres?",
          yes: "Oui, avec plaisir",
          no: "Non, merci",
          missing:
            "Merci d’indiquer qui participera au souper de la veille.",
        }
      : {
          eyebrow: "Friday evening · July 16, 2027",
          title: "Dinner the night before",
          intro:
            "We would love to see you on Friday evening and begin the celebrations together over dinner.",
          payment:
            "This gathering is entirely optional. Guests will be able to order and settle their own meal at the restaurant.",
          question: "Will you be joining us?",
          yes: "Yes, with pleasure",
          no: "No, thank you",
          missing:
            "Please let us know who will be joining us for dinner on Friday.",
        };

  async function lookup() {
    setStatus("");

    const r = await fetch("/api/family/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!r.ok) {
      return setStatus(t.lookupError);
    }

    const p: D = await r.json();

    setData(p);
    setGuests(p.guests);
    setEmails(
      p.emails.length ? p.emails.map((x) => x.email) : [""]
    );
  }

  function ug(id: string, patch: Partial<G>) {
    setGuests((a) =>
      a.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }

  async function save() {
    setStatus("");

    if (guests.some((g) => typeof g.attending !== "boolean")) {
      return setStatus(t.missingAttendance);
    }

    if (
      data?.family.invited_pre_wedding_dinner &&
      guests.some(
        (g) => typeof g.pre_wedding_dinner_attending !== "boolean"
      )
    ) {
      return setStatus(dinnerText.missing);
    }

    const clean = emails
      .map((x) => x.trim())
      .filter(Boolean);

    if (
      !clean.length ||
      clean.some(
        (x) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x)
      )
    ) {
      return setStatus(t.needEmail);
    }

    if (!data) return;

    const r = await fetch("/api/rsvp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        familyId: data.family.id,
        code: data.family.code,
        language: lang,
        emails: clean,
        guests: guests.map((g) => ({
          id: g.id,
          attending: g.attending,
          allergies: g.allergies_intolerances || "",
          aversions: g.food_aversions || "",
          preWeddingDinnerAttending:
            data.family.invited_pre_wedding_dinner
              ? g.pre_wedding_dinner_attending
              : null,
        })),
      }),
    });

    if (!r.ok) {
      return setStatus(t.genericError);
    }

    setDone(true);
  }

  if (done) {
    return (
      <div
        className="card form"
        style={{ textAlign: "center" }}
      >
        <h2
          className="serif"
          style={{ fontSize: 42 }}
        >
          {t.thankYou}
        </h2>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card form">
        <div className="field">
          <label>{t.codeLabel}</label>

          <input
            className="input"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.toUpperCase())
            }
            placeholder={t.codePlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") lookup();
            }}
          />
        </div>

        <button
          className="btn btnDark"
          style={{ width: "100%" }}
          type="button"
          onClick={lookup}
        >
          {t.continue}
        </button>

        {status && (
          <div className="notice error">{status}</div>
        )}
      </div>
    );
  }

  return (
    <div className="card form">
      <div className="eyebrow">{t.family}</div>

      <h2
        className="serif"
        style={{ fontSize: 38, marginTop: 10 }}
      >
        {data.family.name}
      </h2>

      {guests.map((g) => (
        <div className="guestCard" key={g.id}>
          <h3
            className="serif"
            style={{ fontSize: 28, margin: "0 0 14px" }}
          >
            {g.first_name} {g.last_name || ""}
          </h3>

          <div className="choiceRow">
            <button
              type="button"
              className={
                "choice " +
                (g.attending === true ? "selected" : "")
              }
              onClick={() =>
                ug(g.id, { attending: true })
              }
            >
              ✓ {t.present}
            </button>

            <button
              type="button"
              className={
                "choice " +
                (g.attending === false ? "selected" : "")
              }
              onClick={() =>
                ug(g.id, { attending: false })
              }
            >
              ✕ {t.absent}
            </button>
          </div>

          {g.attending === true && (
            <div style={{ marginTop: 20 }}>
              <div className="field">
                <label>{t.allergies}</label>

                <textarea
                  className="input textarea"
                  placeholder={t.allergiesHint}
                  value={
                    g.allergies_intolerances || ""
                  }
                  onChange={(e) =>
                    ug(g.id, {
                      allergies_intolerances:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="field">
                <label>{t.aversions}</label>

                <textarea
                  className="input textarea"
                  placeholder={t.aversionsHint}
                  value={g.food_aversions || ""}
                  onChange={(e) =>
                    ug(g.id, {
                      food_aversions: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {data.family.invited_pre_wedding_dinner && (
        <>
          <div className="hr" />

          <div
            style={{
              padding: "10px 2px 4px",
            }}
          >
            <div className="eyebrow">
              {dinnerText.eyebrow}
            </div>

            <h3
              className="serif"
              style={{
                fontSize: 34,
                margin: "10px 0 14px",
              }}
            >
              {dinnerText.title}
            </h3>

            <p>{dinnerText.intro}</p>

            <p className="muted">
              {dinnerText.payment}
            </p>

            <p
              style={{
                fontWeight: 600,
                marginTop: 24,
              }}
            >
              {dinnerText.question}
            </p>
          </div>

          {guests.map((g) => (
            <div className="guestCard" key={`dinner-${g.id}`}>
              <h4
                className="serif"
                style={{
                  fontSize: 25,
                  margin: "0 0 14px",
                }}
              >
                {g.first_name} {g.last_name || ""}
              </h4>

              <div className="choiceRow">
                <button
                  type="button"
                  className={
                    "choice " +
                    (g.pre_wedding_dinner_attending === true
                      ? "selected"
                      : "")
                  }
                  onClick={() =>
                    ug(g.id, {
                      pre_wedding_dinner_attending: true,
                    })
                  }
                >
                  ✓ {dinnerText.yes}
                </button>

                <button
                  type="button"
                  className={
                    "choice " +
                    (g.pre_wedding_dinner_attending === false
                      ? "selected"
                      : "")
                  }
                  onClick={() =>
                    ug(g.id, {
                      pre_wedding_dinner_attending: false,
                    })
                  }
                >
                  ✕ {dinnerText.no}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="hr" />

      <h3
        className="serif"
        style={{ fontSize: 30 }}
      >
        {t.emails}
      </h3>

      <p className="muted">{t.emailsHelp}</p>

      {emails.map((email, i) => (
        <div className="emailRow" key={i}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) =>
              setEmails((a) =>
                a.map((x, j) =>
                  j === i ? e.target.value : x
                )
              )
            }
            placeholder="email@example.com"
          />

          {emails.length > 1 && (
            <button
              className="btn"
              type="button"
              onClick={() =>
                setEmails((a) =>
                  a.filter((_, j) => j !== i)
                )
              }
            >
              ×
            </button>
          )}
        </div>
      ))}

      <button
        className="btn"
        type="button"
        onClick={() =>
          setEmails((a) => [...a, ""])
        }
      >
        {t.addEmail}
      </button>

      <div style={{ marginTop: 24 }}>
        <button
          className="btn btnDark"
          style={{ width: "100%" }}
          type="button"
          onClick={save}
        >
          {t.saveRsvp}
        </button>
      </div>

      {status && (
        <div className="notice error">{status}</div>
      )}
    </div>
  );
}