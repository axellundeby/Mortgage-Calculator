import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    måntlig_betaling: number;
    nedbetalt: number;
    mangler: number;
    years: number;
    total_kostnad?: number;
}

const UserProfile: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [loanFetched, setLoanFetched] = useState(false);

    const username = localStorage.getItem("username");

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
            setLoan(data.loan);
            localStorage.setItem("userLoan", JSON.stringify(data.loan));
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
            setLoan(JSON.parse(savedLoan));
            setLoanFetched(true);
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
                        <li><strong>Effektiv rente:</strong> {loan.effektiv_rente?.toFixed(2)}%</li>
                        <li><strong>Månedlig betaling:</strong> {loan.måntlig_betaling?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Nedbetalt:</strong> {loan.nedbetalt?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Gjenstående:</strong> {loan.mangler?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Antall år igjen:</strong> {loan.years} år</li>
                        <li><strong>Total gjenstående kostnad:</strong> {(loan.total_kostnad || loan.måntlig_betaling * loan.years * 12).toLocaleString("no-NO")} kr</li>
                    </ul>
                    <button
                        onClick={handleResetConsent}
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Tilbakestill samtykke
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
