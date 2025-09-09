import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
// import { Slider } from "./ui/slider";
import { Label } from "./ui/label";

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
    const [sliderValue, setSliderValue] = useState([0]);

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
        <div className="min-h-screen bg-gradient-hero py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary mb-2">Min profil</h1>
                    <p className="text-muted-foreground">Administrer ditt lån og refinansieringsinnstillinger</p>
                </div>

                {/* Auto-refinancing Settings */}
                <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="text-primary">Innstillinger</CardTitle>
                        <CardDescription>Konfigurer automatisk refinansiering</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-3">
                            <Checkbox
                                id="autoRefinance"
                                checked={autoRefinance}
                                onCheckedChange={handleAutoRefinanceToggle}
                            />
                            <Label htmlFor="autoRefinance" className="text-sm font-medium">
                                Aktiver automatisk refinansiering
                            </Label>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            Vi overvåker markedet kontinuerlig og flytter lånet ditt til bedre vilkår automatisk
                        </p>
                    </CardContent>
                </Card>

                {/* Loan Authorization */}
                {!loan && (
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-primary">Hent låneinformasjon</CardTitle>
                            <CardDescription>
                                Koble til Gjeldsregisteret for å hente dine lånedetaljer
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleFetchLoan} className="w-full sm:w-auto">
                                Hent via gjeldsregisteret
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Current Loan Details */}
                {loan && (
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-primary">Mitt nåværende lån</CardTitle>
                            <CardDescription>Oversikt over ditt aktive lån</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Bank</Label>
                                        <p className="font-semibold">{loan.bank}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Produkt</Label>
                                        <p className="font-semibold">{loan.produkt}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Effektiv rente</Label>
                                        <p className="font-semibold text-primary">{loan.effektiv_rente.toFixed(2)}%</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Månedlig betaling</Label>
                                        <p className="font-semibold">{loan.monthly_payment.toLocaleString("no-NO")} kr</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Nedbetalt</Label>
                                        <p className="font-semibold text-success-green">{loan.nedbetalt.toLocaleString("no-NO")} kr</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Gjenstående</Label>
                                        <p className="font-semibold">{loan.mangler.toLocaleString("no-NO")} kr</p>
                                    </div>
                                </div>
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Nedbetalingstid</Label>
                                    <p className="font-semibold">
                                        {Math.floor(loan.months / 12)} år og {loan.months % 12} måneder
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Total gjenstående kostnad</Label>
                                    <p className="font-semibold">{loan.gjennstende_total_kostnad?.toLocaleString("no-NO")} kr</p>
                                </div>
                            </div>

                            <Separator />

                            <Button onClick={handleResetConsent} variant="destructive" className="w-full sm:w-auto">
                                Tilbakestill samtykke
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Total Savings Display */}
                {totalSaved !== null && totalSaved > 0 && (
                    <Card className="shadow-card border-success-green bg-success-green-light">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-success-green mb-2">
                                    {totalSaved.toLocaleString("no-NO")} kr
                                </div>
                                <p className="text-success-green font-medium">
                                    Totalt spart ved refinansiering 💸
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loan History */}
                {loanHistory.length > 0 && (
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-primary">Lånehistorikk</CardTitle>
                            <CardDescription>Oversikt over dine refinansieringer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loanHistory.map((item, idx) => (
                                    <Card key={idx} className="border-l-4 border-l-primary/20">
                                        <CardContent className="pt-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold">{item.bank}</h4>
                                                    <p className="text-sm text-muted-foreground">{item.produkt}</p>
                                                </div>
                                                {item.is_initial ? (
                                                    <Badge variant="secondary">Originalt lån</Badge>
                                                ) : (
                                                    <Badge className="bg-success-green text-white">
                                                        Spart: {Number(item.savings || 0).toLocaleString("no-NO")} kr
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Effektiv rente:</span>
                                                    <span className="ml-2 font-medium">{Number(item.effektiv_rente)?.toFixed(2)}%</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Månedlig betaling:</span>
                                                    <span className="ml-2 font-medium">{Number(item.monthly_payment)?.toLocaleString("no-NO")} kr</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Simulation Section - Commented out but styled for future use */}
                {/* <Card className="shadow-card">
                    <CardHeader>
                        <CardTitle className="text-primary">Simulering</CardTitle>
                        <CardDescription>Test ulike scenarier for renteendringer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="monthSlider" className="text-sm font-medium">
                                Simuler tid: {sliderValue[0]} måneder
                            </Label>
                            <Slider
                                id="monthSlider"
                                min={0}
                                max={60}
                                step={1}
                                value={sliderValue}
                                onValueChange={setSliderValue}
                                className="w-full mt-2"
                            />
                        </div>
                        <Button
                            onClick={() => handleSimulate(sliderValue[0])}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            Simuler renteendringer
                        </Button>
                    </CardContent>
                </Card> */}
            </div>
        </div>
    );
};

export default UserProfile;