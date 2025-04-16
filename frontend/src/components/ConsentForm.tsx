import React, { useState } from "react";

const ConsentForm: React.FC = () => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [loan, setLoan] = useState<any | null>(null);

  const handleConsent = async () => {
    if (!consentGiven) return;

    const response = await fetch("http://localhost:8000/api/get-random-loan");
    const data = await response.json();
    setLoan(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-md rounded p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Fullmakt</h2>
        <p className="mb-4">
          For å hente informasjon om lånet ditt trenger vi at du gir samtykke. Dette simulerer BankID-innlogging.
        </p>
        <label className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={() => setConsentGiven(!consentGiven)}
            className="mr-2"
          />
          Jeg gir fullmakt til å hente informasjon om mitt eksisterende lån.
        </label>
        <button
          onClick={handleConsent}
          disabled={!consentGiven}
          className={`w-full py-2 rounded-md text-white ${
            consentGiven ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400"
          }`}
        >
          Hent låneinformasjon
        </button>

        {loan && (
          <div className="mt-6 text-sm">
            <h3 className="font-semibold text-lg mb-2">Ditt nåværende lån:</h3>
            <p><strong>Bank:</strong> {loan.bank}</p>
            <p><strong>Produkt:</strong> {loan.produkt}</p>
            <p><strong>Effektiv rente:</strong> {loan["effektiv rente"]}%</p>
            <p><strong>Månedlig betaling:</strong> {loan["måntlig betaling"]} kr</p>
            <p><strong>Lånebeløp:</strong> {loan.beløp} kr</p>
            <p><strong>Nedbetalt:</strong> {loan.nedbetalt} kr</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsentForm;
