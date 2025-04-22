import React, { useState, useEffect } from "react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    monthly_payment: number;
    nedbetalt: number;
    mangler: number;
    years: number;
    gjennstende_total_kostnad?: number;
}

const normalizeLoanData = (data: any): Loan => ({
    bank: data.bank || data.Bank || "",
    produkt: data.produkt || data.Produkt || "",
    effektiv_rente: data.effektiv_rente || 0,
    monthly_payment: data.monthly_payment || 0,
    nedbetalt: data.nedbetalt ?? 0,
    mangler: data.mangler ?? 0,
    years: data.years ?? 0,
    gjennstende_total_kostnad: data.gjennstende_total_kostnad || data.total || data.total_kostnad || 0,
});

const UserProfile: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [loanFetched, setLoanFetched] = useState(false);
    const [simMonths, setSimMonths] = useState(0);
    const [simulatedLoan, setSimulatedLoan] = useState<Loan | null>(null);
    const [autoRefinance, setAutoRefinance] = useState(false);
    const [loanHistory, setLoanHistory] = useState<any[]>([]);
    const [totalSaved, setTotalSaved] = useState<number | null>(null);
    const username = localStorage.getItem("username");
    const isAdmin = username === "admin";

    useEffect(() => {
        if (!username) return;

        const fetchAutoRefinance = async () => {
            const res = await fetch(`http://localhost:8000/api/get-auto-refinansiering/${username}`);
            const data = await res.json();
            setAutoRefinance(data.auto_refinansiering);
        };

        fetchAutoRefinance();
    }, [username]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!username) return;

            try {
                const histRes = await fetch(`http://localhost:8000/api/loan-history/${username}`);
                const historyData = await histRes.json();
                setLoanHistory(historyData);

                const totalRes = await fetch(`http://localhost:8000/api/total-savings/${username}`);
                const totalData = await totalRes.json();
                setTotalSaved(totalData.total_saved);
            } catch (err) {
                console.error("Feil ved henting av lånehistorikk", err);
            }
        };

        fetchHistory();
    }, [username]);


    const handleAutoRefinanceToggle = async () => {
        const newStatus = !autoRefinance;
        setAutoRefinance(newStatus);

        await fetch("http://localhost:8000/api/set-auto-refinansiering", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, auto_refinansiering: newStatus }),
        });
    };

    const handleSimulateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const months = parseInt(e.target.value);
        setSimMonths(months);

        const res = await fetch("http://localhost:8000/api/simulate-loan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, months }),
        });

        const data = await res.json();
        setSimulatedLoan(data);
    };

    const handleFetchLoan = async () => {
        try {
            const response = await fetch("http://localhost:8000/api/authorize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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

    const handleResetConsent = async () => {
        localStorage.removeItem("userLoan");
        localStorage.removeItem("loanAlreadyFetched");
        setLoan(null);
        setLoanFetched(false);
        setSimMonths(0);
        setLoanHistory([]);
        setTotalSaved(null);

        try {
            await fetch("http://localhost:8000/api/clear-loan-history", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
        }
        catch (err) {
            console.error("Feil ved sletting av historikk", err);
        }
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

            {!loanFetched && (
                <button
                    onClick={handleFetchLoan}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Hent via gjeldsregisteret
                </button>
            )}

            {loanFetched && loan && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Mitt lån</h3>
                    <ul>
                        <li><strong>Bank:</strong> {(simulatedLoan || loan).bank}</li>
                        <li><strong>Produkt:</strong> {(simulatedLoan || loan).produkt}</li>
                        <li><strong>Effektiv rente:</strong> {(simulatedLoan || loan).effektiv_rente.toFixed(2)}%</li>
                        <li><strong>Månedlig betaling:</strong> {(simulatedLoan || loan).monthly_payment.toLocaleString("no-NO")} kr</li>
                        <li><strong>Nedbetalt:</strong> {(simulatedLoan || loan).nedbetalt.toLocaleString("no-NO")} kr</li>
                        <li><strong>Gjenstående:</strong> {(simulatedLoan || loan).mangler.toLocaleString("no-NO")} kr</li>
                        <li><strong>Antall år igjen:</strong> {(simulatedLoan || loan).years} år</li>
                        <li><strong>Total gjenstående kostnad:</strong> {(simulatedLoan || loan).gjennstende_total_kostnad?.toLocaleString("no-NO")} kr</li>
                    </ul>

                    <button
                        onClick={handleResetConsent}
                        className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                        Tilbakestill samtykke
                    </button>

                    {isAdmin && (
                        <>
                            <p className="mt-6 text-sm text-gray-600">
                                Simulert tid: {simMonths} måneder ({Math.floor(simMonths / 12)} år og {simMonths % 12} måneder)
                            </p>

                            <input
                                type="range"
                                min="0"
                                max={loan.years * 12}
                                value={simMonths}
                                onChange={handleSimulateChange}
                                className="w-full mb-4"
                            />

                            {simMonths > 0 && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={async () => {
                                            if (!simulatedLoan || !username) return;

                                            const res = await fetch("http://localhost:8000/api/save-loan", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ username, loan: { ...simulatedLoan, simulert: true } }),
                                            });

                                            if (res.ok) {
                                                alert("Simulert lån lagret!");
                                                localStorage.setItem("userLoan", JSON.stringify(simulatedLoan));
                                                setLoan(simulatedLoan);
                                                setSimulatedLoan(null);
                                                setSimMonths(0);
                                            } else {
                                                alert("Noe gikk galt ved lagring.");
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                    >
                                        Lagre simulert lån
                                    </button>

                                    <button
                                        onClick={() => {
                                            setSimMonths(0);
                                            setSimulatedLoan(null);
                                        }}
                                        className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-50"
                                    >
                                        Tilbakestill simulering
                                    </button>
                                </div>
                            )}

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
                                                    <span className="italic text-gray-600">Første lån</span>
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

                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;
