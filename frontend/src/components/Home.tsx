import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { TrendingUp, Shield, Zap, Calculator, CheckCircle, ArrowRight } from "lucide-react";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header
      <header className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-primary-blue">Flytta</div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Logg inn
            </Button>
            <Button variant="default" onClick={() => navigate("/reg")}>
              Registrer deg
            </Button>
          </div>
        </div>
      </header> */}

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Automatisk refinansiering
            <span className="block text-primary-blue">som sparer deg penger</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Vi overvåker lånemarkedet kontinuerlig og bytter automatisk til bedre lånevilkår når de oppstår. 
            Spar tusenvis av kroner uten å løfte en finger.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/reg")}>
              Kom i gang gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/how-it-works")}>
              Se hvordan det virker
            </Button>
          </div>
        </div>
      </section>

      {/* Savings Examples */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Se hvor mye du kan spare
          </h2>
          <p className="text-lg text-muted-foreground">
            Reelle eksempler på besparelser med Flytta
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="p-8 shadow-card bg-card/50 backdrop-blur-sm border border-success-green/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-green mb-2">120 000 kr</div>
              <div className="text-sm text-muted-foreground mb-4">i gjeld</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fra:</span>
                  <span className="font-semibold">3 200 kr/mnd (21%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Til:</span>
                  <span className="font-semibold text-success-green">2 700 kr/mnd</span>
                </div>
                <div className="border-t pt-3">
                  <div className="text-2xl font-bold text-success-green">28 000 kr</div>
                  <div className="text-sm text-muted-foreground">totalt spart</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-card bg-card/50 backdrop-blur-sm border border-success-green/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-green mb-2">500 000 kr</div>
              <div className="text-sm text-muted-foreground mb-4">i gjeld</div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fra:</span>
                  <span className="font-semibold">13 350 kr/mnd (21%)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Til:</span>
                  <span className="font-semibold text-success-green">11 400 kr/mnd</span>
                </div>
                <div className="border-t pt-3">
                  <div className="text-2xl font-bold text-success-green">117 000 kr</div>
                  <div className="text-sm text-muted-foreground">totalt spart</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Slik fungerer det
          </h2>
          <p className="text-lg text-muted-foreground">
            En helt automatisk prosess som tar seg av alt
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="p-6 text-center shadow-card hover:shadow-soft transition-all duration-300">
            <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-blue" />
            </div>
            <h3 className="text-xl font-semibold mb-3">1. Sikker tilkobling</h3>
            <p className="text-muted-foreground">
              Vi henter dine lånedata trygt fra Gjeldsregisteret med ditt samtykke
            </p>
          </Card>

          <Card className="p-6 text-center shadow-card hover:shadow-soft transition-all duration-300">
            <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary-blue" />
            </div>
            <h3 className="text-xl font-semibold mb-3">2. Kontinuerlig overvåking</h3>
            <p className="text-muted-foreground">
              Vårt system analyserer markedet 24/7 og identifiserer bedre lånevilkår
            </p>
          </Card>

          <Card className="p-6 text-center shadow-card hover:shadow-soft transition-all duration-300">
            <div className="w-16 h-16 bg-success-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-success-green" />
            </div>
            <h3 className="text-xl font-semibold mb-3">3. Automatisk bytte</h3>
            <p className="text-muted-foreground">
              Du får ferdig refinansieringstilbud og kan bytte med én digital signatur
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Hvorfor velge Flytta?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-green mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Spar tid og penger</h3>
                    <p className="text-muted-foreground">Ingen manuelle prosesser eller søknader</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-green mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Alltid oppdatert</h3>
                    <p className="text-muted-foreground">Kontinuerlig overvåking av lånemarkedet</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-green mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Trygg og sikker</h3>
                    <p className="text-muted-foreground">Bank-nivå sikkerhet og full transparens</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-success-green mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Økonomisk gevinst</h3>
                    <p className="text-muted-foreground">Dokumenterte besparelser på titusenvis av kroner</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-primary p-8 rounded-2xl text-white shadow-soft">
                <Calculator className="h-16 w-16 mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-bold mb-4">Klar til å starte?</h3>
                <p className="mb-6 opacity-90">
                  Få oversikt over ditt sparepotensial på under 2 minutter
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-primary-blue hover:bg-white/90"
                  onClick={() => navigate("/reg")}
                >
                  Beregn besparelse
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <img src={require("../flytta.png")} alt="Flytta" className="h-8 w-auto mb-4 md:mb-0" />
            <div className="text-sm text-muted-foreground">
              © 2025 Flytta. Gjør refinansiering enkelt og problemfri.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;