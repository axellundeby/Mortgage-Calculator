import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    monthly_payment: number;
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
    const [userAge, setUserAge] = useState<number | null>(null);

    useEffect(() => {
        const fetchUserLoanAndAlternatives = async () => {
            const username = localStorage.getItem("username");
            if (!username) return;

            try {
                const ageRes = await fetch(`http://localhost:8000/api/user-age/${username}`);
                const ageData = await ageRes.json();
                setUserAge(ageData.age);

                const res = await fetch(`http://localhost:8000/api/user-loan/${username}`);
                const data = await res.json();
                setLoan(data);

                const altRes = await fetch("http://localhost:8000/api/find-loan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        age: ageData.age,
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

                const monthly = data.monthly_payment;
                const years = data.years || 1;
                const currentTotal = monthly * years * 12;
                const bestTotal = transformed[0]?.total_kostnad || currentTotal;
                setSavings(Math.round(currentTotal - bestTotal));
            } catch (err) {
                console.error("Feil ved henting av lån eller alternativer", err);
            } finally {
                setLoading(false);
            }
        };

        const checkAutoRefinance = async () => {
            const username = localStorage.getItem("username");
            if (!username) return;

            try {
                const res = await fetch("http://localhost:8000/api/auto-refinance", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username }),
                });

                const result = await res.json();

                if (result.should_refinance) {
                    setSelectedLoan(result.suggested_loan);
                    setConfirmationVisible(true);
                    setSavings(Math.round(result.savings));
                }
            } catch (err) {
                console.error("Feil ved automatisk refinansieringssjekk", err);
            }
        };

        fetchUserLoanAndAlternatives();
        checkAutoRefinance();
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
                        <li><strong>Månedlig betaling:</strong> {(loan.monthly_payment || 0).toLocaleString("no-NO")} kr</li>
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
                                        Månedlig betaling: {alt["monthly_payment"]?.toLocaleString("no-NO")} kr <br />
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
                        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded shadow-lg max-w-md w-full text-center">
                                <h3 className="text-xl font-bold mb-2">Spar penger!</h3>
                                <p className="mb-4">
                                    Du kan spare <span className="text-green-600 font-semibold">{savings?.toLocaleString("no-NO")} kr</span> ved å refinansiere lånet ditt.
                                </p>

                                <p className="text-sm text-gray-600 mb-4">
                                    Signer med BankID på mobil for å gjennomføre byttet.
                                </p>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={handleConfirmRefinance}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                    >
                                        Signer og bytt lån
                                    </button>

                                    <button
                                        onClick={() => {
                                            setConfirmationVisible(false);
                                            setSelectedLoan(null);
                                        }}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                                    >
                                        Nei takk
                                    </button>
                                </div>
                            </div>
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
