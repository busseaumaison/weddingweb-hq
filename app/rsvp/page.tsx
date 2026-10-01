"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Guest = {
  id: string;
  first_name: string;
  last_name?: string;
  attending: boolean | null;
};

type FamilyContact = {
  id: number;
  email: string;
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
    saveEmailError: "Erreur sauvegarde courriel",
    welcome: "Bienvenue 👋",
    whoComing: "Qui sera présent ?",
    familyEmailInfo:
      "Un seul membre de la famille doit fournir une adresse email. Les autres peuvent laisser vide.",
    familyEmailRequired:
      "Au moins un représentant doit fournir un email de contact familial.",
    familyEmailPlaceholder: "Courriel de contact familial",
    familyEmailHint:
      "Vous pouvez ajouter plusieurs courriels si désiré.",
    submitButton: "Valider ma réponse",
    successMessage:
      "Validation réussie ! Merci, votre famille est bien enregistrée.",
    savingText: "Sauvegarde...",
    addEmail: "+ Ajouter un autre courriel",
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
    familyEmailInfo:
      "Only one family member needs to provide an email. Others can leave it blank.",
    familyEmailRequired:
      "At least one representative must provide a family contact email.",
    familyEmailPlaceholder: "Family contact email",
    familyEmailHint:
      "You can add multiple emails if desired.",
    submitButton: "Submit my response",
    successMessage:
      "Validation successful! Your family has been recorded.",
    savingText: "Saving...",
    addEmail: "+ Add another email",
  },
} as const;


type Locale = keyof typeof translations;


export default function RSVPPage() {

  const [code, setCode] = useState("");

  const [guests, setGuests] = useState<Guest[] | null>(null);

  const [familyContacts, setFamilyContacts] =
    useState<FamilyContact[]>([]);

  const [familyId, setFamilyId] =
    useState<number | null>(null);

  const [familyEmails, setFamilyEmails] =
    useState<string[]>([""]);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [locale, setLocale] =
    useState<Locale>("fr");

  const t = translations[locale];



  // 🔎 Trouver famille + invités + courriels

  const handleSubmit = async () => {

    const key = code.trim().toUpperCase();

    setError("");
    setSuccess("");


    // 1. Trouver la famille

    const { data: familyData, error: familyError } =
      await supabase
        .from("families")
        .select("*")
        .eq("code", key);


    if (
      familyError ||
      !familyData ||
      familyData.length === 0
    ) {
      setError(t.invalidCode);
      setGuests(null);
      return;
    }


    const family = familyData[0];

    setFamilyId(family.id);



    // 2. Trouver les invités

    const { data: guestsData, error: guestsError } =
      await supabase
        .from("guests")
        .select("*")
        .eq("family_id", family.id);



    if (guestsError) {

      setError(t.serverError);
      return;

    }



    // 3. Trouver les courriels de famille

    const { data: contactsData, error: contactsError } =
      await supabase
        .from("family_contacts")
        .select("*")
        .eq("family_id", family.id);



    if (contactsError) {

      console.error(contactsError);

      setError("Erreur récupération courriels");
      return;

    }



    setGuests(guestsData);

    setFamilyContacts(
      contactsData ?? []
    );

  };


  // 💾 Sauvegarde RSVP

  const updateAttendance = async (
    guestId: string,
    value: boolean
  ) => {

    setSavingId(guestId);


    // Mise à jour immédiate dans l'interface

    setGuests((prev) =>
      prev
        ? prev.map((guest) =>
            guest.id === guestId
              ? { ...guest, attending: value }
              : guest
          )
        : prev
    );


    const { error } = await supabase
      .from("guests")
      .update({
        attending: value,
      })
      .eq("id", guestId);



    setSavingId(null);



    if (error) {

      console.error(error);

      setError(t.saveError);

    }

  };




  // 📧 Gestion des courriels

const handleEmailChange = (
  value: string
) => {

  setFamilyEmails([value]);

};



const addEmailField = async () => {

  if (!familyId) {
    return;
  }


  const emails = familyEmails
    .map((email) => email.trim())
    .filter(Boolean);


  if (emails.length > 0) {

    const contacts = emails.map((email) => ({
      family_id: familyId,
      email,
    }));


    const { data, error } = await supabase
      .from("family_contacts")
      .insert(contacts)
      .select();


    if (error) {

      console.error(error);

      setError(t.saveEmailError);

      return;

    }


    setFamilyContacts(data);

  }


  // Ajouter une nouvelle boîte vide

  setFamilyEmails([
    ...familyEmails,
    "",
  ]);

};



const saveFamilyEmails = async () => {

  if (!familyId) {
    return;
  }


  const emails = familyEmails
    .map((email) => email.trim())
    .filter(Boolean);


  if (emails.length === 0) {

    setError(t.familyEmailRequired);

    return;

  }



  const contacts = emails.map((email) => ({
    family_id: familyId,
    email,
  }));



  const { data, error } = await supabase
    .from("family_contacts")
    .insert(contacts)
    .select();



  if (error) {

    console.error("ERREUR SAUVEGARDE COURRIELS:", error);

    setError(t.saveEmailError);

    return;

  }



  setFamilyContacts(data);

  setSuccess(t.successMessage);

};




  // Validation finale

  const handleValidate = async () => {

    setError("");

    setSuccess("");



    if (!guests) {

      setError(t.serverError);

      return;

    }



    const hasEmail =
      familyContacts.length > 0;



    if (!hasEmail) {

      setError(
        t.familyEmailRequired
      );

      return;

    }



    setSuccess(
      t.successMessage
    );

  };



  return (

    <div
      style={{
        maxWidth: 500,
        margin: "0 auto",
        padding: 24,
      }}
    >


      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:20,
        }}
      >

        <h1>
          {t.title}
        </h1>


        <div>

          <button
            onClick={() => setLocale("fr")}
            style={{
              marginRight:8,
              padding:"8px 12px",
              background:
                locale==="fr"
                  ? "black"
                  : "#f0f0f0",
              color:
                locale==="fr"
                  ? "white"
                  : "black",
              border:"none",
              borderRadius:4,
            }}
          >
            FR
          </button>


          <button
            onClick={() => setLocale("en")}
            style={{
              padding:"8px 12px",
              background:
                locale==="en"
                  ? "black"
                  : "#f0f0f0",
              color:
                locale==="en"
                  ? "white"
                  : "black",
              border:"none",
              borderRadius:4,
            }}
          >
            EN
          </button>

        </div>

      </div>





      {!guests ? (

        <>

          <p>
            {t.enterCode}
          </p>


          <input
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            placeholder={t.codePlaceholder}
            style={{
              width:"100%",
              padding:12,
              marginTop:12,
              marginBottom:12,
            }}
          />



          <button
            onClick={handleSubmit}
            style={{
              width:"100%",
              padding:12,
              background:"black",
              color:"white",
            }}
          >
            {t.continueButton}
          </button>



          {error &&
            <p style={{color:"red"}}>
              {error}
            </p>
          }

        </>


      ) : (


        <>


          <h2>
            {t.welcome}
          </h2>


          <p>
            {t.whoComing}
          </p>



          {guests.map((guest)=>(

            <div
              key={guest.id}
              style={{
                marginBottom:20,
                paddingBottom:20,
                borderBottom:"1px solid #eee",
              }}
            >

              <label
                style={{
                  display:"flex",
                  gap:8,
                  alignItems:"center",
                }}
              >

                <input
                  type="checkbox"
                  checked={
                    guest.attending ?? false
                  }
                  onChange={(e)=>
                    updateAttendance(
                      guest.id,
                      e.target.checked
                    )
                  }
                />


                <span>
                  {guest.first_name}
                  {" "}
                  {guest.last_name ?? ""}
                </span>



                {savingId===guest.id &&
                  <span style={{fontSize:12}}>
                    {t.savingText}
                  </span>
                }


              </label>


            </div>

          ))}




          <hr
            style={{
              margin:"25px 0",
            }}
          />




          <h3>
            Courriel(s) de contact
          </h3>


          <p
            style={{
              fontSize:14,
              color:"#555",
            }}
          >
            {t.familyEmailInfo}
          </p>



          {familyContacts.map((contact)=>(

            <p
              key={contact.id}
            >
              ✉ {contact.email}
            </p>

          ))}




          {familyEmails.map((email, index) => (

            <input
              key={index}
              type="email"
              placeholder={
                t.familyEmailPlaceholder
              }
              value={email}
              onChange={(e) => {

                const updatedEmails = [...familyEmails];

                updatedEmails[index] = e.target.value;

                setFamilyEmails(updatedEmails);

              }}
              style={{
                width:"100%",
                padding:10,
                marginBottom:8,
                border:"1px solid #ddd",
                borderRadius:4,
              }}
            />

          ))}



          <p
            style={{
              fontSize:12,
              color:"#555",
            }}
          >
            {t.familyEmailHint}
          </p>




          <button
            onClick={addEmailField}
            style={{
              width:"100%",
              padding:10,
              marginTop:8,
              background:"#f5f5f5",
              border:"1px solid #ddd",
              borderRadius:4,
            }}
          >
            {t.addEmail}
          </button>




          <button
            onClick={saveFamilyEmails}
            style={{
              width:"100%",
              padding:12,
              marginTop:12,
              background:"#0070f3",
              color:"white",
              border:"none",
              borderRadius:6,
            }}
          >
            {t.submitButton}
          </button>




          {success &&
            <p style={{color:"green"}}>
              {success}
            </p>
          }


          {error &&
            <p style={{color:"red"}}>
              {error}
            </p>
          }


        </>

      )}

    </div>

  );

}