import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    måntlig_betaling: number;
    nedbetalt: number;
    mangler: number;
    years: number;
    gjennstende_total_kostnad?: number;
}

const normalizeLoanData = (data: any): Loan => ({
    bank: data.bank || data.Bank || "",
    produkt: data.produkt || data.Produkt || "",
    effektiv_rente: data.effektiv_rente || data["Effektiv rente"] || 0,
    måntlig_betaling: data.måntlig_betaling || data["Måndlig betaling"] || 0,
    nedbetalt: data.nedbetalt ?? 0,
    mangler: data.mangler ?? 0,
    years: data.years ?? 0,
    gjennstende_total_kostnad: data.gjennstende_total_kostnad || data.total || data.total_kostnad || 0,
});

const UserProfile: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [loanFetched, setLoanFetched] = useState(false);

    const username = localStorage.getItem("username");

    const [simMonths, setSimMonths] = useState(0);

    const handleSimulateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const months = parseInt(e.target.value);
        setSimMonths(months);

        const res = await fetch("http://localhost:8000/api/simulate-loan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, months }),
        });

        if (res.ok) {
            const data = await res.json();
            setLoan(data);
        }
    };


    const handleFetchLoan = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/authorize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, fullmakt: true }),
            });
            const data = await response.json();
            const normalized = normalizeLoanData(data.loan);
            setLoan(normalized);
            localStorage.setItem("userLoan", JSON.stringify(normalized));
            localStorage.setItem("loanAlreadyFetched", "true");
            setLoanFetched(true);
        } catch (err) {
            console.error("Feil ved henting av lån", err);
        }
    };

    const handleResetConsent = () => {
        localStorage.removeItem("userLoan");
        localStorage.removeItem("loanAlreadyFetched");
        setLoan(null);
        setLoanFetched(false);
    };

    useEffect(() => {
        const fetched = localStorage.getItem("loanAlreadyFetched");
        const savedLoan = localStorage.getItem("userLoan");
        if (fetched === "true" && savedLoan) {
            try {
                const parsed = JSON.parse(savedLoan);
                setLoan(normalizeLoanData(parsed));
                setLoanFetched(true);
            } catch (e) {
                console.error("Feil ved parsing av lagret lån", e);
                setLoanFetched(false);
            }
        }
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Min profil</h2>

            {!loanFetched && (
                <button
                    onClick={handleFetchLoan}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Hent mitt lån
                </button>
            )}

            {loanFetched && loan && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Mitt lån</h3>
                    <ul>
                        <li><strong>Bank:</strong> {loan.bank}</li>
                        <li><strong>Produkt:</strong> {loan.produkt}</li>
                        <li><strong>Effektiv rente:</strong> {loan.effektiv_rente.toFixed(2)}%</li>
                        <li><strong>Månedlig betaling:</strong> {loan.måntlig_betaling.toLocaleString("no-NO")} kr</li>
                        <li><strong>Nedbetalt:</strong> {loan.nedbetalt.toLocaleString("no-NO")} kr</li>
                        <li><strong>Gjenstående:</strong> {loan.mangler.toLocaleString("no-NO")} kr</li>
                        <li><strong>Antall år igjen:</strong> {loan.years} år</li>
                        <li><strong>Total gjenstående kostnad:</strong> {loan.gjennstende_total_kostnad?.toLocaleString("no-NO")} kr</li>
                    </ul>
                    <button
                        onClick={handleResetConsent}
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Tilbakestill samtykke
                    </button>

                    <label className="block mb-2 font-medium">
                        Simuler nedbetaling over {simMonths} måneder:
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="120"
                        value={simMonths}
                        onChange={handleSimulateChange}
                        className="w-full"
                    />
                </div>
            )}
        </div>

    );
};

export default UserProfile;
