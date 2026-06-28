export default function RSVPPage() {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
      <h1>RSVP</h1>

      <p>Entrez votre code d'invitation</p>

      <input
        type="text"
        placeholder="Ex: BUSSEAU"
        style={{
          width: "100%",
          padding: 12,
          marginTop: 12,
          marginBottom: 12,
        }}
      />

      <button
        style={{
          width: "100%",
          padding: 12,
          background: "black",
          color: "white",
        }}
      >
        Continuer
      </button>
    </div>
  );
}