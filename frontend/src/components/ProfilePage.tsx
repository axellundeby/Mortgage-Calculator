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
            const fetchedLoan: Loan = {
                bank: data.loan.bank || "",
                produkt: data.loan.produkt || "",
                effektiv_rente: data.loan.effektiv_rente || 0,
                måntlig_betaling: data.loan.måntlig_betaling || 0,
                nedbetalt: data.loan.nedbetalt || 0,
                mangler: data.loan.mangler || 0,
                years: data.loan.years || 0,
                gjennstende_total_kostnad: data.loan.gjennstende_total_kostnad || data.loan.måntlig_betaling * data.loan.years * 12,
            };
            setLoan(fetchedLoan);
            localStorage.setItem("userLoan", JSON.stringify(fetchedLoan));
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
                const parsedLoan = JSON.parse(savedLoan);
                const fallbackLoan: Loan = {
                    bank: parsedLoan.bank || "",
                    produkt: parsedLoan.produkt || "",
                    effektiv_rente: parsedLoan.effektiv_rente || 0,
                    måntlig_betaling: parsedLoan.måntlig_betaling || 0,
                    nedbetalt: parsedLoan.nedbetalt || 0,
                    mangler: parsedLoan.mangler || 0,
                    years: parsedLoan.years || 0,
                    gjennstende_total_kostnad: parsedLoan.gjennstende_total_kostnad || parsedLoan.måntlig_betaling * parsedLoan.years * 12,
                };
                setLoan(fallbackLoan);
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
                        <li><strong>Total gjenstående kostnad:</strong> {loan.gjennstende_total_kostnad?.toLocaleString("no-NO") || 0} kr</li>
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
