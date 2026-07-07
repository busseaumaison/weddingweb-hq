"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Guest = {
  id: string;
  first_name: string;
  last_name?: string;
  attending: boolean | null;
  email?: string;
};

const translations = {
  fr: {
    title: "RSVP",
    enterCode: "Entrez votre code d'invitation",
    codePlaceholder: "Ex: BUSSEAU",
    continueButton: "Continuer",
    invalidCode: "Code invalide",
    serverError: "Erreur serveur",
    saveError: "Erreur sauvegarde",
    saveEmailError: "Erreur sauvegarde email",
    welcome: "Bienvenue 👋",
    whoComing: "Qui sera présent ?",
    familyEmailInfo: "Un seul membre de la famille doit fournir une adresse email. Les autres peuvent laisser vide.",
    familyEmailRequired: "Au moins un représentant doit fournir un email de contact familial.",
    guestEmailPlaceholder: "Votre adresse courriel",
    familyEmailPlaceholder: "Email de contact familial (facultatif)",
    familyEmailHint: "Un seul email par famille est suffisant.",
    submitButton: "Valider ma réponse",
    successMessage: "Validation réussie ! Merci, votre famille est bien enregistrée.",
    savingText: "Sauvegarde...",
  },
  en: {
    title: "RSVP",
    enterCode: "Enter your invitation code",
    codePlaceholder: "Ex: BUSSEAU",
    continueButton: "Continue",
    invalidCode: "Invalid code",
    serverError: "Server error",
    saveError: "Save error",
    saveEmailError: "Email save error",
    welcome: "Welcome 👋",
    whoComing: "Who is coming?",
    familyEmailInfo: "Only one family member needs to provide an email. Others can leave it blank.",
    familyEmailRequired: "At least one representative must provide a family contact email.",
    guestEmailPlaceholder: "Your email address",
    familyEmailPlaceholder: "Family contact email (optional)",
    familyEmailHint: "Only one family email is needed.",
    submitButton: "Submit my response",
    successMessage: "Validation successful! Your family has been recorded.",
    savingText: "Saving...",
  },
} as const;

type Locale = keyof typeof translations;

export default function RSVPPage() {
  const [code, setCode] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("fr");
  const t = translations[locale];

  // 🔎 Trouver la famille + invités
  const handleSubmit = async () => {
    const key = code.trim().toUpperCase();

    setError("");
    setSuccess("");

    // 1. famille
    const { data: familyData, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("code", key);

    if (familyError || !familyData || familyData.length === 0) {
      setError(t.invalidCode);
      setGuests(null);
      return;
    }

    const family = familyData[0];

    // 2. invités
    const { data: guestsData, error: guestsError } = await supabase
      .from("guests")
      .select("*")
      .eq("family_id", family.id);

    if (guestsError) {
      setError(t.serverError);
      return;
    }

    setGuests(guestsData);
  };

  // 💾 Sauvegarde RSVP
  const updateAttendance = async (guestId: string, value: boolean) => {
    setSavingId(guestId);

    const { error } = await supabase
      .from("guests")
      .update({ attending: value })
      .eq("id", guestId);

    setSavingId(null);

    if (error) {
      console.error(error);
      setError(t.saveError);
    }
  };

  // 📧 Sauvegarde email
  const updateEmail = async (guestId: string, email: string) => {
    setSavingId(guestId);

    const { error } = await supabase
      .from("guests")
      .update({ email })
      .eq("id", guestId);

    setSavingId(null);

    if (error) {
      console.error(error);
      setError(t.saveEmailError);
    }
  };

  const handleValidate = () => {
    setError("");
    setSuccess("");

    if (!guests) {
      setError(t.serverError);
      return;
    }

    const familyEmailProvided = guests.some(
      (guest) => guest.email?.trim().length > 0
    );

    if (!familyEmailProvided) {
      setError(t.familyEmailRequired);
      return;
    }

    setSuccess(t.successMessage);
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>{t.title}</h1>
        <div>
          <button
            onClick={() => setLocale("fr")}
            style={{
              marginRight: 8,
              padding: "8px 12px",
              background: locale === "fr" ? "black" : "#f0f0f0",
              color: locale === "fr" ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            FR
          </button>
          <button
            onClick={() => setLocale("en")}
            style={{
              padding: "8px 12px",
              background: locale === "en" ? "black" : "#f0f0f0",
              color: locale === "en" ? "white" : "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            EN
          </button>
        </div>
      </div>

      {!guests ? (
        <>
          <p>{t.enterCode}</p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.codePlaceholder}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 12,
              marginBottom: 12,
            }}
          />

          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: 12,
              background: "black",
              color: "white",
            }}
          >
            {t.continueButton}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      ) : (
        <>
          <h2>{t.welcome}</h2>
          <p>{t.whoComing}</p>
          <p style={{ color: "#555", fontSize: 14, marginTop: 4 }}>
            {t.familyEmailInfo}
          </p>

          { (!guests.some((g) => g.email?.trim())) && guests.some((g) => g.attending) && (
            <p style={{ color: "#b45f06", fontSize: 14, marginTop: 12 }}>
              {t.familyEmailRequired}
            </p>
          ) }

          {guests.map((guest) => (
            <div key={guest.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={guest.attending ?? false}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    // UI update immédiat
                    setGuests((prev) =>
                      prev!.map((g) =>
                        g.id === guest.id
                          ? { ...g, attending: checked }
                          : g
                      )
                    );

                    // DB update
                    updateAttendance(guest.id, checked);
                  }}
                />

                <span>
                  {guest.first_name} {guest.last_name ?? ""}
                </span>

                {savingId === guest.id && (
                  <span style={{ fontSize: 12 }}>{t.savingText}</span>
                )}
              </label>

              {guest.attending && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type="email"
                    placeholder={t.familyEmailPlaceholder}
                    value={guest.email ?? ""}
                    onChange={(e) => {
                      const email = e.target.value;
                      setGuests((prev) =>
                        prev!.map((g) =>
                          g.id === guest.id
                            ? { ...g, email }
                            : g
                        )
                      );
                      updateEmail(guest.id, email);
                    }}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ddd",
                      borderRadius: 4,
                    }}
                  />
                  <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
                    {t.familyEmailHint}
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleValidate}
            style={{
              width: "100%",
              padding: 12,
              background: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {t.submitButton}
          </button>

          {error && <p style={{ color: "red", marginTop: 14 }}>{error}</p>}
          {success && <p style={{ color: "green", marginTop: 14 }}>{success}</p>}
        </>
      )}
    </div>
  );
}