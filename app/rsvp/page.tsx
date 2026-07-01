"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Guest = {
  id: string;
  first_name: string;
  last_name?: string;
  attending: boolean | null;
};

export default function RSVPPage() {
  const [code, setCode] = useState("");
  const [guests, setGuests] = useState<Guest[] | null>(null);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // 🔎 Trouver la famille + invités
  const handleSubmit = async () => {
    const key = code.trim().toUpperCase();

    setError("");

    // 1. famille
    const { data: familyData, error: familyError } = await supabase
      .from("families")
      .select("*")
      .eq("code", key);

    if (familyError || !familyData || familyData.length === 0) {
      setError("Code invalide");
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
      setError("Erreur serveur");
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
      setError("Erreur sauvegarde");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <h1>RSVP</h1>

      {!guests ? (
        <>
          <p>Entrez votre code d'invitation</p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: BUSSEAU"
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
            Continuer
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      ) : (
        <>
          <h2>Bienvenue 👋</h2>
          <p>Qui sera présent ?</p>

          {guests.map((guest) => (
            <div key={guest.id} style={{ marginBottom: 10 }}>
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
                  <span style={{ fontSize: 12 }}>Sauvegarde...</span>
                )}
              </label>
            </div>
          ))}
        </>
      )}
    </div>
  );
}