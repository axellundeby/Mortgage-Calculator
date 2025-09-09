import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    monthly_payment: number;
    nedbetalt: number;
    mangler: number;
    months: number;
    gjennstende_total_kostnad?: number;
}
const API_URL = process.env.REACT_APP_API_BASE || "";

const UserProfile: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [autoRefinance, setAutoRefinance] = useState(false);
    const [loanHistory, setLoanHistory] = useState<any[]>([]);
    const [totalSaved, setTotalSaved] = useState<number | null>(null);
    const username = localStorage.getItem("username");
    const [sliderValue, setSliderValue] = useState(0);

    const handleSimulate = async (months: number) => {
        if (!username) return;

        try {
            // Kall begge API-ene parallelt
            const [csvSimRes, loanSimRes] = await Promise.all([
                fetch(`${API_URL}/api/simulate-loan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ months }),
                }),
                fetch(`${API_URL}/api/sim-current-loan/${username}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ months }),
                })
            ]);

            const csvData = await csvSimRes.json();
            const loanData = await loanSimRes.json();

            console.log("CSV-simulering:", csvData);
            console.log("Brukerlån simulert:", loanData);

            setLoan(loanData.simulated_loan);
            localStorage.setItem("userLoan", JSON.stringify(loanData.simulated_loan));
        } catch (err) {
            console.error("Feil ved simulering", err);
        }
    };




    useEffect(() => {
        if (!username) return;

        const fetchData = async () => {
            try {
                const [autoRefRes, histRes, totalRes] = await Promise.all([
                    fetch(`${API_URL}/api/get-auto-refinansiering/${username}`),
                    fetch(`${API_URL}/api/loan-history/${username}`),
                    fetch(`${API_URL}/api/total-savings/${username}`)
                ]);

                const autoData = await autoRefRes.json();
                const historyData = await histRes.json();
                const totalData = await totalRes.json();

                setAutoRefinance(autoData.auto_refinansiering);
                setLoanHistory(historyData);
                setTotalSaved(totalData.total_saved);
            } catch (err) {
                console.error("Feil ved henting av data", err);
            }
        };

        fetchData();
    }, [username]);


    const handleAutoRefinanceToggle = async () => {
        const newStatus = !autoRefinance;
        setAutoRefinance(newStatus);

        await fetch(`${API_URL}/api/set-auto-refinansiering`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, auto_refinansiering: newStatus }),
        });
    };

    const handleFetchLoan = async () => {
        try {
            const response = await fetch(`${API_URL}/api/authorize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, fullmakt: true }),
            });
            const data = await response.json();
            setLoan(data.loan);
            localStorage.setItem("userLoan", JSON.stringify(data.loan));
        } catch (err) {
            console.error("Feil ved henting av lån", err);
        }
    };

    const handleResetConsent = async () => {
        localStorage.removeItem("userLoan");
        setLoan(null);
        setLoanHistory([]);
        setTotalSaved(null);

        try {
                await fetch(`${API_URL}/api/clear-loan-history`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
        } catch (err) {
            console.error("Feil ved sletting av historikk", err);
        }
    };

    useEffect(() => {
        const savedLoan = localStorage.getItem("userLoan");

        if (savedLoan) {
            try {
                const parsed: Loan = JSON.parse(savedLoan);
                const hasData = parsed.bank || parsed.produkt || parsed.monthly_payment > 0;
                if (!hasData) return;
                setLoan(parsed);
            } catch (e) {
                console.error("Feil ved parsing av lagret lån", e);
            }
        }
    }, []);

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Min profil</h2>

            <div className="mt-4 flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={autoRefinance}
                    onChange={handleAutoRefinanceToggle}
                    id="autoRefinance"
                />
                <label htmlFor="autoRefinance" className="text-sm">
                    Aktiver automatisk refinansiering
                </label>
            </div>

            {!loan && (
                <button
                    onClick={handleFetchLoan}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Hent via gjeldsregisteret
                </button>
            )}

            {loan && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Mitt lån</h3>
                    <ul>
                        <li><strong>Bank:</strong> {loan.bank}</li>
                        <li><strong>Produkt:</strong> {loan.produkt}</li>
                        <li><strong>Effektiv rente:</strong> {loan.effektiv_rente.toFixed(2)}%</li>
                        <li><strong>Månedlig betaling:</strong> {loan.monthly_payment.toLocaleString("no-NO")} kr</li>
                        <li><strong>Nedbetalt:</strong> {loan.nedbetalt.toLocaleString("no-NO")} kr</li>
                        <li><strong>Gjenstående:</strong> {loan.mangler.toLocaleString("no-NO")} kr</li>
                        <li>
                            <strong>Nedbetalingstid:</strong>{" "}
                            {Math.floor(loan.months / 12)} år og {loan.months % 12} måneder
                        </li>
                        <li><strong>Total gjenstående kostnad:</strong> {loan.gjennstende_total_kostnad?.toLocaleString("no-NO")} kr</li>
                    </ul>

                    <button
                        onClick={handleResetConsent}
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Tilbakestill samtykke
                    </button>

                    {loanHistory.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-2">Lånehistorikk</h3>
                            <ul className="space-y-2">
                                {loanHistory.map((item, idx) => (
                                    <li key={idx} className="border rounded p-3 bg-gray-50">
                                        <strong>{item.bank}</strong> - {item.produkt} <br />
                                        Effektiv rente: {Number(item.effektiv_rente)?.toFixed(2)}%<br />
                                        Månedlig betaling: {Number(item.monthly_payment)?.toLocaleString("no-NO")} kr<br />

                                        {item.is_initial ? (
                                            <span className="italic text-gray-600">Orginale lån</span>
                                        ) : (
                                            <span className="text-green-700">
                                                Spart: {Number(item.savings || 0).toLocaleString("no-NO")} kr
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {totalSaved !== null && (
                        <div className="mt-4 text-green-700 font-semibold">
                            Totalt spart ved refinansiering: {totalSaved.toLocaleString("no-NO")} kr 💸
                        </div>
                    )}
                </div>

            )}
            {/* <div className="mt-6">
                <label htmlFor="monthSlider" className="block text-sm font-medium text-gray-700">
                    Simuler tid (i måneder): {sliderValue}
                </label>
                <input
                    id="monthSlider"
                    type="range"
                    min={0}
                    max={60}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full mt-1"
                />
                <button
                    onClick={() => handleSimulate(sliderValue)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Simuler renteendringer
                </button>
            </div> */}

        </div>
    );
};

export default UserProfile;
