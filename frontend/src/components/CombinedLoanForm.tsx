import React, { useState } from "react";

interface Loan {
  bank: string;
  produkt: string;
  sum_lånt: number;
  effektiv_rente: number;
  måntlig_betaling: number;
  nedbetalt: number;
  mangler: number;
  years: number;
  total_kostnad?: number;
}

const CombinedLoanForm: React.FC = () => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savings, setSavings] = useState<number | null>(null);

  const handleFetchLoanAndAlternatives = async () => {
    setLoading(true);
    const username = localStorage.getItem("username") || "ola";

    try {
      const response = await fetch("http://localhost:8000/api/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullmakt: true }),
      });
      const data = await response.json();
      const currentLoan = data.loan;
      setLoan(currentLoan);

      console.log("🔍 Sender forespørsel med:", {
        age: 25,
        amount: currentLoan.mangler,
        years: currentLoan.years,
      });

      const res = await fetch("http://localhost:8000/api/find-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age: 25,
          amount: currentLoan.mangler,
          years: currentLoan.years,
        }),
      });

      const bestLoans = await res.json();
      console.log("🧾 Mottok alternative lån:", bestLoans);
      setAlternatives(bestLoans);

      const currentTotal = currentLoan.måntlig_betaling * currentLoan.years * 12;
      const bestTotal = bestLoans[0]?.total || currentTotal;
      setSavings(Math.round(currentTotal - bestTotal));
    } catch (err) {
      console.error("Feil ved henting av lån eller alternativer", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Låneoversikt og Alternativer</h2>

      {!loan && (
        <button
          onClick={handleFetchLoanAndAlternatives}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Henter..." : "Hent låneinformasjon"}
        </button>
      )}

      {loan && (
        <>
          <h3 className="text-lg font-semibold mt-6 mb-2">Ditt nåværende lån</h3>
          <ul className="mb-6">
            <li><strong>Bank:</strong> {loan.bank}</li>
            <li><strong>Produkt:</strong> {loan.produkt}</li>
            <li><strong>Sum lånt:</strong> {loan.sum_lånt?.toLocaleString("no-NO")} kr</li>
            <li><strong>Effektiv rente:</strong> {loan.effektiv_rente?.toFixed(2)}%</li>
            <li><strong>Månedlig betaling:</strong> {loan.måntlig_betaling?.toLocaleString("no-NO")} kr</li>
            <li><strong>Nedbetalt:</strong> {loan.nedbetalt?.toLocaleString("no-NO")} kr</li>
            <li><strong>Gjenstående:</strong> {loan.mangler?.toLocaleString("no-NO")} kr</li>
            <li><strong>Antall år igjen:</strong> {loan.years} år</li>
            <li><strong>Total gjennstående kostnad:</strong> {(loan.total_kostnad || loan.måntlig_betaling * loan.years * 12).toLocaleString("no-NO")} kr</li>
          </ul>

          {alternatives.length > 0 && (
            <>
              <h3 className="text-lg font-semibold mb-2">Beste alternative lån</h3>
              <ul className="mb-4">
                {alternatives.map((alt, idx) => (
                  <li key={idx} className="border-b py-2">
                    <strong>{alt["Bank"]}</strong> - {alt["Produkt"]} <br />
                    Effektiv rente: {alt["Effektiv rente"]?.toFixed(2)}% <br />
                    Månedlig betaling: {alt["Måndlig betaling"]?.toLocaleString("no-NO")} kr <br />
                    Totalkostnad: {(alt["total"] || 0).toLocaleString("no-NO")} kr
                  </li>
                ))}
              </ul>
              {savings !== null && (
                <p className="text-green-600 font-bold">
                  Du kan potensielt spare {savings.toLocaleString("no-NO")} kr på å bytte lån!
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CombinedLoanForm;