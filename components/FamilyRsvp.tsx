"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type HotelStay = "0" | "1" | "2plus" | "unsure";
type Guest = {
  id: string;
  first_name: string;
  last_name: string | null;
  attending: boolean | null;
  is_child: boolean;
  child_age: number | null;
  allergies_intolerances: string | null;
  food_aversions: string | null;
  pre_wedding_dinner_attending: boolean | null;
  rehearsal_attending: boolean | null;
  pre_wedding_dinner_unsure: boolean;
  rehearsal_unsure: boolean;
};
type Lookup = {
  family: {
    id: string;
    name: string;
    code: string;
    preferred_language: "fr" | "en";
    rsvp_completed_at: string | null;
    invited_pre_wedding_dinner: boolean;
    invited_rehearsal: boolean;
    hotel_stay: HotelStay | null;
    song_suggestion: string | null;
    message_to_couple: string | null;
    shared_memory: string | null;
  };
  guests: Guest[];
  emails: { id: string; email: string }[];
};

const HOTEL_URL =
  "https://res.esterel.com/ibe/details.aspx?propertyid=17969&nights=1&checkin=16/7/2027&group=7102329&lang=fr-fr";

export default function FamilyRsvp() {
  const { lang, t, setLang } = useLanguage();
  const [code, setCode] = useState("");
  const [data, setData] = useState<Lookup | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [emails, setEmails] = useState<string[]>([""]);
  const [hotelStay, setHotelStay] = useState<HotelStay | "">("");
  const [song, setSong] = useState("");
  const [coupleMessage, setCoupleMessage] = useState("");
  const [memory, setMemory] = useState("");
  const [status, setStatus] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const fr = lang === "fr";
  const c = fr
    ? {
        hotelTitle: "Votre séjour à l’Estérel",
        hotelIntro:
          "Pour nous aider à planifier les chambres avec l’Estérel, pensez-vous dormir sur place pendant le week-end du mariage? Une seule réponse pour votre famille suffit.",
        hotelLabel: "Combien de nuits prévoyez-vous à l’hôtel?",
        hotelOptions: [
          { value: "0", label: "Aucune nuit" },
          { value: "1", label: "Une nuit" },
          { value: "2plus", label: "Deux nuits ou plus" },
          { value: "unsure", label: "Nous ne savons pas encore" },
        ],
        hotelNote: "Il s’agit d’une estimation, et non d’une réservation.",
        bookHotel: "Réserver une chambre à l’Estérel",
        privateNote:
          "Cette invitation s’adresse uniquement à certains de nos proches. Si vous voyez cette section, c’est que vous êtes chaleureusement conviés!",
        dinnerDate: "Vendredi 16 juillet 2027",
        dinnerTitle: "Souper de la veille",
        dinnerIntro:
          "Nous envisageons d’organiser un souper la veille du mariage pour commencer les célébrations ensemble. Aimeriez-vous vous joindre à nous?",
        dinnerCost:
          "La participation est facultative et chacun assumera le coût de son repas.",
        rehearsalDate: "Samedi 10 juillet 2027",
        rehearsalTitle: "Répétition du mariage",
        rehearsalIntro:
          "Vous faites partie du cortège ou de notre famille proche. Merci de réserver cette date pour une répétition avant le grand jour. Un souper sera offert à la suite de la répétition; le lieu et l’heure restent à confirmer.",
        rehearsalQuestion: "Pourrons-nous compter sur votre présence?",
        yes: "Oui, avec plaisir",
        no: "Non, malheureusement",
        unsure: "Je dois encore confirmer",
        hotelMissing: "Merci d’indiquer votre prévision d’hébergement.",
        lookupWorking: "Recherche en cours…",
        saveWorking: "Enregistrement en cours…",
      }
    : {
        hotelTitle: "Your stay at Estérel",
        hotelIntro:
          "To help us coordinate accommodations with Estérel, do you expect to stay at the hotel during our wedding weekend? Only one answer is needed per family.",
        hotelLabel: "How many nights do you expect to stay?",
        hotelOptions: [
          { value: "0", label: "No nights" },
          { value: "1", label: "One night" },
          { value: "2plus", label: "Two nights or more" },
          { value: "unsure", label: "We are not sure yet" },
        ],
        hotelNote: "This is just an estimate, not a hotel reservation.",
        bookHotel: "Book a room at Estérel",
        privateNote:
          "This invitation is reserved for a few of our loved ones. If you see this section, we would love for you to join us!",
        dinnerDate: "Friday, July 16, 2027",
        dinnerTitle: "Dinner the night before",
        dinnerIntro:
          "We are considering a dinner the evening before our wedding to start celebrating together. Would you like to join us?",
        dinnerCost:
          "Participation is optional, and each guest would cover the cost of their own meal.",
        rehearsalDate: "Saturday, July 10, 2027",
        rehearsalTitle: "Wedding rehearsal",
        rehearsalIntro:
          "As part of our wedding party or close family, please save this date for a rehearsal. Dinner will be provided afterward; the time and location will be confirmed later.",
        rehearsalQuestion: "Will you be able to join us?",
        yes: "Yes, with pleasure",
        no: "Unfortunately, no",
        unsure: "I still need to confirm",
        hotelMissing: "Please tell us how many nights you expect to stay.",
        lookupWorking: "Looking up your invitation…",
        saveWorking: "Saving your answers…",
      };

  async function lookup() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const r = await fetch("/api/family/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      if (!r.ok) {
        setStatus(t.lookupError);
        return;
      }
      const p: Lookup = await r.json();
      setLang(p.family.preferred_language === "en" ? "en" : "fr");
      setData(p);
      setGuests(p.guests);
      setEmails(p.emails.length ? p.emails.map((x) => x.email) : [""]);
      setHotelStay(p.family.hotel_stay ?? "");
      setSong(p.family.song_suggestion ?? "");
      setCoupleMessage(p.family.message_to_couple ?? "");
      setMemory(p.family.shared_memory ?? "");
    } catch {
      setStatus(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  function updateGuest(id: string, patch: Partial<Guest>) {
    setGuests((current) =>
      current.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }

  function setEventAnswer(
    guestId: string,
    field: "pre_wedding_dinner_attending" | "rehearsal_attending",
    answer: boolean | null
  ) {
    const unsureField = field === "pre_wedding_dinner_attending"
      ? "pre_wedding_dinner_unsure"
      : "rehearsal_unsure";
    updateGuest(guestId, {
      [field]: answer,
      [unsureField]: answer === null,
    } as Partial<Guest>);
  }

  async function save() {
    if (!data || busy) return;
    setStatus("");
    if (guests.some((g) => typeof g.attending !== "boolean")) {
      setStatus(t.missingAttendance);
      return;
    }
    if (!["0", "1", "2plus", "unsure"].includes(hotelStay)) {
      setStatus(c.hotelMissing);
      return;
    }
    if (data.family.invited_pre_wedding_dinner && guests.some((g) =>
      g.pre_wedding_dinner_attending === null && !g.pre_wedding_dinner_unsure
    )) {
      setStatus(fr ? "Merci de répondre à la question du souper pour chaque personne."
        : "Please answer the Friday dinner question for each guest.");
      return;
    }
    if (data.family.invited_rehearsal && guests.some((g) =>
      g.rehearsal_attending === null && !g.rehearsal_unsure
    )) {
      setStatus(fr ? "Merci de répondre à la question de la répétition pour chaque personne."
        : "Please answer the rehearsal question for each guest.");
      return;
    }
    if (guests.some(g => g.is_child && g.attending && (g.child_age === null || !Number.isInteger(g.child_age) || g.child_age < 0 || g.child_age > 17))) {
      setStatus(fr ? "Merci d’indiquer l’âge de chaque enfant présent (0 à 17 ans)." : "Please enter the age of each attending child (0–17).");
      return;
    }
    const clean: string[] = [...new Set<string>(emails.map((x) => x.trim().toLowerCase()).filter(Boolean))];
    if (!clean.length || clean.some((x) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))) {
      setStatus(t.needEmail);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyId: data.family.id,
          code: data.family.code,
          language: lang,
          emails: clean,
          hotelStay,
          songSuggestion: song,
          messageToCouple: coupleMessage,
          sharedMemory: memory,
          guests: guests.map((g) => ({
            id: g.id,
            attending: g.attending,
            childAge: g.is_child ? g.child_age : null,
            allergies: g.allergies_intolerances || "",
            aversions: g.food_aversions || "",
            preWeddingDinnerAttending: data.family.invited_pre_wedding_dinner
              ? g.pre_wedding_dinner_attending
              : null,
            preWeddingDinnerUnsure: data.family.invited_pre_wedding_dinner
              ? g.pre_wedding_dinner_unsure
              : false,
            rehearsalAttending: data.family.invited_rehearsal
              ? g.rehearsal_attending
              : null,
            rehearsalUnsure: data.family.invited_rehearsal
              ? g.rehearsal_unsure
              : false,
          })),
        }),
      });
      if (!r.ok) {
        setStatus(t.genericError);
        return;
      }
      setDone(true);
    } catch {
      setStatus(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  function eventChoices(
    g: Guest,
    field: "pre_wedding_dinner_attending" | "rehearsal_attending"
  ) {
    const unsure = field === "pre_wedding_dinner_attending"
      ? g.pre_wedding_dinner_unsure
      : g.rehearsal_unsure;
    const choices: { value: boolean | null; label: string }[] = [
      { value: true, label: c.yes },
      { value: false, label: c.no },
      { value: null, label: c.unsure },
    ];
    return (
      <div className="choiceRow" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {choices.map((choice) => {
          const selected = choice.value === null ? Boolean(unsure) : g[field] === choice.value;
          return (
            <button
              key={String(choice.value)}
              type="button"
              className={"choice " + (selected ? "selected" : "")}
              aria-pressed={selected}
              onClick={() => setEventAnswer(g.id, field, choice.value)}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (done) {
    return (
      <div className="card form" style={{ textAlign: "center" }}>
        <h2 className="serif" style={{ fontSize: 38 }}>{t.thankYou}</h2>
        <button className="btn" type="button" onClick={() => { setDone(false); setData(null); }}>
          {fr ? "Modifier nos réponses" : "Edit our answers"}
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card form">
        <div className="field">
          <label htmlFor="family-code">{t.codeLabel}</label>
          <input
            id="family-code"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.codePlaceholder}
            onKeyDown={(e) => { if (e.key === "Enter") void lookup(); }}
          />
        </div>
        <button className="btn btnDark" type="button" style={{ width: "100%" }} disabled={busy} onClick={lookup}>
          {busy ? c.lookupWorking : t.continue}
        </button>
        {status && <div className="notice error">{status}</div>}
      </div>
    );
  }

  return (
    <div className="card form">
      <div className="eyebrow">{t.family}</div>
      <h2 className="serif" style={{ fontSize: 38, marginTop: 10 }}>{data.family.name}</h2>

      {/* Présence et informations alimentaires : chaque invité nommé */}
      {guests.map((g) => (
        <div className="guestCard" key={g.id}>
          <h3 className="serif" style={{ fontSize: 28, margin: "0 0 14px" }}>
            {g.first_name} {g.last_name || ""}
          </h3>
          <div className="choiceRow">
            <button type="button" className={"choice " + (g.attending === true ? "selected" : "")}
              onClick={() => updateGuest(g.id, { attending: true })}>✓ {t.present}</button>
            <button type="button" className={"choice " + (g.attending === false ? "selected" : "")}
              onClick={() => updateGuest(g.id, { attending: false })}>✕ {t.absent}</button>
          </div>
          {g.is_child && g.attending === true && (
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor={`child-age-${g.id}`}>{fr ? "Âge de l’enfant au 17 juillet 2027" : "Child’s age on July 17, 2027"}</label>
              <select id={`child-age-${g.id}`} className="input" value={g.child_age ?? ""} onChange={(e) => updateGuest(g.id, { child_age: e.target.value === "" ? null : Number(e.target.value) })}>
                <option value="">{fr ? "Choisir l’âge" : "Choose age"}</option>
                {Array.from({ length: 18 }, (_, i) => <option key={i} value={i}>{i} {fr ? (i === 1 ? "an" : "ans") : (i === 1 ? "year" : "years")}</option>)}
              </select>
            </div>
          )}
          {g.attending === true && (
            <div style={{ marginTop: 20 }}>
              <div className="field">
                <label>{t.allergies}</label>
                <textarea className="input textarea" placeholder={t.allergiesHint}
                  value={g.allergies_intolerances || ""}
                  onChange={(e) => updateGuest(g.id, { allergies_intolerances: e.target.value })} />
              </div>
              <div className="field">
                <label>{t.aversions}</label>
                <textarea className="input textarea" placeholder={t.aversionsHint}
                  value={g.food_aversions || ""}
                  onChange={(e) => updateGuest(g.id, { food_aversions: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Hébergement : visible pour TOUTES les familles, une seule réponse */}
      <div className="hr" />
      <div className="eyebrow">{fr ? "Hébergement" : "Accommodation"}</div>
      <h3 className="serif" style={{ fontSize: 34, margin: "10px 0 14px" }}>{c.hotelTitle}</h3>
      <p>{c.hotelIntro}</p>
      <div className="field">
        <label htmlFor="hotel-stay">{c.hotelLabel}</label>
        <select
          id="hotel-stay"
          className="input"
          value={hotelStay}
          onChange={(e) => setHotelStay(e.target.value as HotelStay | "")}
        >
          <option value="">{fr ? "Choisissez une réponse" : "Select an answer"}</option>
          {c.hotelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <p className="muted">{c.hotelNote}</p>
      <a href={HOTEL_URL} target="_blank" rel="noopener noreferrer" className="btn">
        {c.bookHotel}
      </a>

      {/* Souper privé : uniquement pour les familles invitées */}
      {data.family.invited_pre_wedding_dinner && (
        <>
          <div className="hr" />
          <div className="eyebrow">{c.dinnerDate}</div>
          <h3 className="serif" style={{ fontSize: 34, margin: "10px 0 14px" }}>{c.dinnerTitle}</h3>
          <p>{c.dinnerIntro}</p>
          <p className="muted">{c.dinnerCost}</p>
          <p className="muted">{c.privateNote}</p>
          {guests.map((g) => (
            <div className="guestCard" key={`dinner-${g.id}`}>
              <h4 className="serif" style={{ fontSize: 25, margin: "0 0 14px" }}>
                {g.first_name} {g.last_name || ""}
              </h4>
              {eventChoices(g, "pre_wedding_dinner_attending")}
            </div>
          ))}
        </>
      )}

      {/* Répétition privée : uniquement pour les familles invitées */}
      {data.family.invited_rehearsal && (
        <>
          <div className="hr" />
          <div className="eyebrow">{c.rehearsalDate}</div>
          <h3 className="serif" style={{ fontSize: 34, margin: "10px 0 14px" }}>{c.rehearsalTitle}</h3>
          <p>{c.rehearsalIntro}</p>
          <p className="muted">{c.privateNote}</p>
          <p><strong>{c.rehearsalQuestion}</strong></p>
          {guests.map((g) => (
            <div className="guestCard" key={`rehearsal-${g.id}`}>
              <h4 className="serif" style={{ fontSize: 25, margin: "0 0 14px" }}>
                {g.first_name} {g.last_name || ""}
              </h4>
              {eventChoices(g, "rehearsal_attending")}
            </div>
          ))}
        </>
      )}

      {/* Souvenirs et musique : une réponse par famille, questions facultatives */}
      <div className="hr" />
      <div className="eyebrow">{fr ? "Une touche personnelle" : "A personal touch"}</div>
      <h3 className="serif" style={{ fontSize: 32, marginTop: 12 }}>{fr ? "Partagez un peu de vous avec nous" : "Share a little something with us"}</h3>
      <p className="muted">{fr ? "Ces questions sont facultatives, mais elles nous feraient très plaisir!" : "These questions are optional, but we would love your answers!"}</p>
      <div className="field"><label htmlFor="song-suggestion">{fr ? "Une chanson pour nous faire danser?" : "A song to get us dancing?"}</label>
        <input id="song-suggestion" className="input" maxLength={250} value={song} onChange={e => setSong(e.target.value)} placeholder={fr ? "Titre et artiste" : "Song title and artist"} /></div>
      <div className="field"><label htmlFor="couple-message">{fr ? "Un petit mot pour les futurs mariés" : "A note for the newlyweds"}</label>
        <textarea id="couple-message" className="input textarea" maxLength={2000} value={coupleMessage} onChange={e => setCoupleMessage(e.target.value)} /></div>
      <div className="field"><label htmlFor="shared-memory">{fr ? "Une anecdote ou un beau souvenir avec nous" : "A funny story or favorite memory with us"}</label>
        <textarea id="shared-memory" className="input textarea" maxLength={2000} value={memory} onChange={e => setMemory(e.target.value)} /></div>

      {/* Courriels du RSVP existant */}
      <div className="hr" />
      <h3 className="serif" style={{ fontSize: 30 }}>{t.emails}</h3>
      <p className="muted">{t.emailsHelp}</p>
      {emails.map((email, i) => (
        <div className="emailRow" key={i}>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmails((current) => current.map((x, j) => (i === j ? e.target.value : x)))}
            placeholder="email@example.com"
          />
          {emails.length > 1 && (
            <button className="btn" type="button"
              onClick={() => setEmails((current) => current.filter((_, j) => j !== i))}>×</button>
          )}
        </div>
      ))}
      <button className="btn" type="button" onClick={() => setEmails((current) => [...current, ""])}>
        {t.addEmail}
      </button>
      <div style={{ marginTop: 24 }}>
        <button className="btn btnDark" type="button" style={{ width: "100%" }}
          disabled={busy} onClick={save}>
          {busy ? c.saveWorking : t.saveRsvp}
        </button>
      </div>
      {status && <div className="notice error">{status}</div>}
    </div>
  );
}
