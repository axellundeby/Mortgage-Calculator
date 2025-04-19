import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    måntlig_betaling: number;
    nedbetalt: number;
    mangler: number;
    years: number;
    gjennstende_total_kostnad: number;
}

const CombinedLoanForm: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [savings, setSavings] = useState<number | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
    const [confirmationVisible, setConfirmationVisible] = useState(false);
    const [refinanced, setRefinanced] = useState(false);

    useEffect(() => {
        const fetchUserLoanAndAlternatives = async () => {
            const username = localStorage.getItem("username");
            if (!username) return;

            try {
                const res = await fetch(`http://localhost:8000/api/user-loan/${username}`);
                const data = await res.json();
                setLoan(data);

                const altRes = await fetch("http://localhost:8000/api/find-loan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        age: 25,
                        amount: data.mangler,
                        years: data.years,
                    }),
                });

                const bestLoans = await altRes.json();
                const transformed = bestLoans.map((loan: any) => ({
                    ...loan,
                    total_kostnad: loan.total || loan.Totalkostnad || 0,
                }));
                setAlternatives(transformed);

                const currentTotal = data.måntlig_betaling * data.years * 12;
                const bestTotal = transformed[0]?.total_kostnad || currentTotal;
                setSavings(Math.round(currentTotal - bestTotal));
            } catch (err) {
                console.error("Feil ved henting av lån eller alternativer", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserLoanAndAlternatives();
    }, []);

    const handleLoanClick = (loan: any) => {
        setSelectedLoan(loan);
        setConfirmationVisible(true);
    };

    const handleConfirmRefinance = async () => {
        const username = localStorage.getItem("username") || "ola";

        try {
            const res = await fetch("http://localhost:8000/api/save-loan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, loan: selectedLoan }),
            });

            if (res.ok) {
                alert("Lån er refinansiert!");
                setRefinanced(true);
                setConfirmationVisible(false);

                const updatedRes = await fetch(`http://localhost:8000/api/user-loan/${username}`);
                const updatedLoan = await updatedRes.json();
                setLoan(updatedLoan);
                localStorage.setItem("userLoan", JSON.stringify(updatedLoan));
            }
            else {
                alert("Noe gikk galt ved lagring av nytt lån.");
            }
        } catch (err) {
            console.error("Feil ved lagring av lån", err);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Låneoversikt og Alternativer</h2>

            {loan && (
                <>
                    <h3 className="text-lg font-semibold mt-6 mb-2">Ditt nåværende lån</h3>
                    <ul className="mb-6">
                        <li><strong>Bank:</strong> {loan.bank}</li>
                        <li><strong>Produkt:</strong> {loan.produkt}</li>
                        <li><strong>Effektiv rente:</strong> {loan.effektiv_rente?.toFixed(2)}%</li>
                        <li><strong>Månedlig betaling:</strong> {loan.måntlig_betaling?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Nedbetalt:</strong> {loan.nedbetalt?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Gjenstående:</strong> {loan.mangler?.toLocaleString("no-NO")} kr</li>
                        <li><strong>Antall år igjen:</strong> {loan.years} år</li>
                        <li><strong>Total gjenstående kostnad:</strong> {loan.gjennstende_total_kostnad?.toLocaleString("no-NO") || 0} kr</li>
                    </ul>

                    {alternatives.length > 0 && (
                        <>
                            <h3 className="text-lg font-semibold mb-2">Beste alternative lån</h3>
                            <ul className="mb-4">
                                {alternatives.map((alt, idx) => (
                                    <li
                                        key={idx}
                                        onClick={() => handleLoanClick(alt)}
                                        className={`border-b py-2 px-4 cursor-pointer rounded-lg ${selectedLoan === alt ? "bg-blue-100" : "hover:bg-gray-100"}`}
                                    >
                                        <strong>{alt["Bank"]}</strong> - {alt["Produkt"]} <br />
                                        Effektiv rente: {alt["Effektiv rente"]?.toFixed(2)}% <br />
                                        Månedlig betaling: {alt["Måndlig betaling"]?.toLocaleString("no-NO")} kr <br />
                                        Totalkostnad: {(alt["total_kostnad"] || 0).toLocaleString("no-NO")} kr
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

                    {confirmationVisible && selectedLoan && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mt-4">
                            <p className="font-semibold mb-2">Signer for å godkjenne refinansiering:</p>
                            <button
                                onClick={handleConfirmRefinance}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Signer og bytt lån
                            </button>
                        </div>
                    )}

                    {refinanced && (
                        <div className="mt-4 p-4 bg-green-100 text-green-800 border border-green-300 rounded">
                            Lånet ditt er nå refinansiert 🎉
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CombinedLoanForm;
