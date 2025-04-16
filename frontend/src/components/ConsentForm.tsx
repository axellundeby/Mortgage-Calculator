import React, { useState } from "react";

interface LoanData {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    måntlig_betaling: number;
    nedbetalt: number;
    mangler: number;
}

const ConsentForm: React.FC = () => {
    const [loan, setLoan] = useState<LoanData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchLoan = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("http://localhost:8000/api/authorize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: "ola", // TODO: Bytt ut med faktisk logged-in bruker
                    fullmakt: true,
                }),
            });

            if (!response.ok) {
                throw new Error("Klarte ikke hente lån");
            }

            const data = await response.json();
            setLoan(data.loan);
        } catch (err: any) {
            setError(err.message || "Noe gikk galt");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Samtykke</h2>
            <p className="mb-4">
                For å hente informasjon om ditt nåværende lån, vennligst gi samtykke:
            </p>
            <button
                onClick={fetchLoan}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                disabled={loading}
            >
                {loading ? "Henter..." : "Hent låneinformasjon"}
            </button>

            {error && <p className="text-red-500 mt-4">{error}</p>}

            {loan && (
                <div className="mt-6 p-4 border rounded shadow bg-white">
                    <h3 className="text-xl font-semibold">Låneinformasjon</h3>
                    <p><strong>Bank:</strong> {loan.bank}</p>
                    <p><strong>Produkt:</strong> {loan.produkt}</p>
                    <p><strong>Effektiv rente:</strong> {loan.effektiv_rente}%</p>
                    <p><strong>Månedlig betaling:</strong> {loan.måntlig_betaling} kr</p>
                    <p><strong>Nedbetalt:</strong> {loan.nedbetalt} kr</p>
                    <p><strong>Gjenstående:</strong> {loan.mangler} kr</p>
                </div>
            )}

        </div>
    );
};

export default ConsentForm;
