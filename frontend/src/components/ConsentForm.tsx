import React, { useState } from "react";

interface Loan {
  bank: string;
  produkt: string;
  effektiv_rente: number;
  måntlig_betaling: number;
  nedbetalt: number;
  mangler: number;
}

const ConsentForm: React.FC = () => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    const username = localStorage.getItem("username");

    if (!username) {
      alert("Ingen bruker er logget inn.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/authorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          fullmakt: true,
        }),
      });

      const data = await response.json();
      setLoan(data.loan);
    } catch (error) {
      console.error("Feil ved henting av lån:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Samtykke til låneinformasjon</h2>

      {!loan && (
        <button
          onClick={handleConsent}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Henter..." : "Hent låneinformasjon"}
        </button>
      )}

      {loan && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Låneinformasjon</h3>
          <p><strong>Bank:</strong> {loan.bank}</p>
          <p><strong>Produkt:</strong> {loan.produkt}</p>
          <p><strong>Effektiv rente:</strong> {loan.effektiv_rente.toFixed(2)}%</p>
          <p><strong>Månedlig betaling:</strong> {loan.måntlig_betaling.toLocaleString("no-NO")} kr</p>
          <p><strong>Nedbetalt:</strong> {loan.nedbetalt.toLocaleString("no-NO")} kr</p>
          <p><strong>Gjenstående:</strong> {loan.mangler.toLocaleString("no-NO")} kr</p>
        </div>
      )}
    </div>
  );
};

export default ConsentForm;
