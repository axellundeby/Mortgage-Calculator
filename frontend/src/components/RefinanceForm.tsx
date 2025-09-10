import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, TrendingDown, Building2, Calculator } from "lucide-react";

interface Loan {
    bank: string;
    produkt: string;
    effektiv_rente: number;
    monthly_payment: number;
    nedbetalt: number;
    mangler: number;
    months: number;
    gjennstende_total_kostnad: number;
}

const API_URL = process.env.REACT_APP_API_BASE || "";

const CombinedLoanForm: React.FC = () => {
    const [loan, setLoan] = useState<Loan | null>(null);
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [savings, setSavings] = useState<number | null>(null);
    const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
    const [confirmationVisible, setConfirmationVisible] = useState(false);
    const [refinanced, setRefinanced] = useState(false);
    const [userAge, setUserAge] = useState<number | null>(null);
    const [hasConsent, setHasConsent] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchUserLoanAndAlternatives = async () => {
            const username = localStorage.getItem("username");
            if (!username) return;

            try {
                const ageRes = await fetch(`${API_URL}/api/user-age/${username}`);
                const ageData = await ageRes.json();
                setUserAge(ageData.age);

                const res = await fetch(`${API_URL}/api/user-loan/${username}`);
                const data = await res.json();
                setLoan(data);

                const altRes = await fetch(`${API_URL}/api/find-loan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username,
                        age: ageData.age,
                        amount: data.mangler,
                        months: data.months,
                    }),
                });
                const bestLoans = await altRes.json();
                const transformed = bestLoans
                .filter((loan: any) => loan.total || loan.Totalkostnad)
                .map((loan: any) => ({
                    ...loan,
                    total_kostnad: loan.total || loan.Totalkostnad,
                }));
            
                setAlternatives(transformed);

                const currentTotal = data.gjennstende_total_kostnad;
                const bestTotal = transformed[0].total_kostnad;

                console.log("Current Total:", currentTotal);
                console.log("Best Total:", bestTotal);

                const savings = currentTotal - bestTotal;
                console.log("Savings:", savings);
                setSavings(savings);
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
                const res = await fetch(`${API_URL}/api/auto-refinance`, {
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
        const username = localStorage.getItem("username");
        if (!username) return;

        const fetchConsentStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/has-consent/${username}`);
                const data = await res.json();
                setHasConsent(data.has_consent);
            } catch (err) {
                console.error("Feil ved henting av samtykke-status", err);
            }
        };

        fetchConsentStatus();
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
            const res = await fetch(`${API_URL}/api/save-loan`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, loan: selectedLoan }),
            });

            if (res.ok) {
                alert("Lån er refinansiert!");
                setRefinanced(true);
                setConfirmationVisible(false);

                const updatedRes = await fetch(`${API_URL}/api/user-loan/${username}`);
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
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary mb-2">Låneoversikt</h1>
                    <p className="text-muted-foreground">Se ditt nåværende lån og potensielle besparelser</p>
                </div>

                {hasConsent === false && (
                    <Card className="border-warning bg-warning/5">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-warning-foreground">
                                <AlertCircle className="h-5 w-5" />
                                <div>
                                    <p className="font-semibold">Du må gi samtykke for å hente låneinformasjon</p>
                                    <p className="text-sm text-muted-foreground">Gå til profilsiden for å gi samtykke til at vi kan hente dine lånedata.</p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => window.location.href = "/profil"}
                                className="mt-4"
                            >
                                Gå til profilside
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {loan && hasConsent === true && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Ditt nåværende lån
                                </CardTitle>
                                <CardDescription>
                                    Oversikt over ditt aktive forbrukslån
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Bank:</span>
                                            <span className="font-medium">{loan.bank}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Produkt:</span>
                                            <span className="font-medium">{loan.produkt}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Effektiv rente:</span>
                                            <Badge variant="outline">{loan.effektiv_rente?.toFixed(2)}%</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Månedlig betaling:</span>
                                            <span className="font-medium">{(loan.monthly_payment || 0).toLocaleString("no-NO")} kr</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nedbetalt:</span>
                                            <span className="font-medium text-accent">{loan.nedbetalt?.toLocaleString("no-NO")} kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gjenstående:</span>
                                            <span className="font-medium">{loan.mangler?.toLocaleString("no-NO")} kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nedbetalingstid:</span>
                                            <span className="font-medium">
                                                {Math.floor((loan).months / 12)} år og {(loan).months % 12} måneder
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Total gjenstående kostnad:</span>
                                            <span className="font-medium">{loan.gjennstende_total_kostnad?.toLocaleString("no-NO") || 0} kr</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {alternatives.length > 0 ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingDown className="h-5 w-5 text-accent" />
                                            Beste alternative lån
                                        </CardTitle>
                                        <CardDescription>
                                            Sammenlign med bedre lånetilbud på markedet
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {alternatives.map((alt, idx) => (
                                            <Card 
                                                key={idx}
                                                className={`cursor-pointer transition-all hover:shadow-md ${
                                                    selectedLoan === alt ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/30"
                                                }`}
                                                onClick={() => handleLoanClick(alt)}
                                            >
                                                <CardContent className="pt-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h4 className="font-semibold">{alt["Bank"]}</h4>
                                                            <p className="text-sm text-muted-foreground">{alt["Produkt"]}</p>
                                                        </div>
                                                        <Badge variant="secondary">
                                                            {alt["Effektiv rente"]?.toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-muted-foreground">Månedlig betaling:</span>
                                                            <p className="font-medium">{alt["monthly_payment"]?.toLocaleString("no-NO")} kr</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-muted-foreground">Totalkostnad:</span>
                                                            <p className="font-medium">{(alt["total_kostnad"] || 0).toLocaleString("no-NO")} kr</p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </CardContent>
                                </Card>

                                {savings !== null && (
                                    <Card className="border-accent bg-accent/5">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-3 text-accent-foreground">
                                                <Calculator className="h-5 w-5" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Du kan spare {savings.toLocaleString("no-NO")} kr
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">ved å bytte til et bedre lån</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        ) : (
                            <Card className="border-accent bg-accent/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 text-accent-foreground text-center">
                                        <CheckCircle className="h-5 w-5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Du har det beste lånet per dags dato!</p>
                                            <p className="text-sm text-muted-foreground">Vi finner ingen bedre alternativer akkurat nå.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {confirmationVisible && selectedLoan && (
                            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                                <Card className="w-full max-w-md">
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-xl text-accent">Spar penger!</CardTitle>
                                        <CardDescription>
                                            Du kan spare <span className="text-accent font-semibold">{savings?.toLocaleString("no-NO")} kr</span> ved å refinansiere lånet ditt.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Signer med BankID på mobil for å gjennomføre byttet.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={handleConfirmRefinance}
                                                className="flex-1"
                                            >
                                                Signer og bytt lån
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setConfirmationVisible(false);
                                                    setSelectedLoan(null);
                                                }}
                                                className="flex-1"
                                            >
                                                Nei takk
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {refinanced && (
                            <Card className="border-accent bg-accent/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 text-accent-foreground text-center">
                                        <CheckCircle className="h-5 w-5" />
                                        <p className="text-sm text-muted-foreground">Lånet ditt er nå refinansiert! 🎉</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CombinedLoanForm;