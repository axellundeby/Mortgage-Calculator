import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Shield, TrendingUp, Zap, FileText, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";

const HowItWorks: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Shield,
      title: "1. Sikker registrering",
      description: "Du registrerer deg og gir samtykke til at vi henter dine lånedata fra Gjeldsregisteret. All data behandles med banknivå sikkerhet.",
      details: ["Ingen manuelle utfyllinger", "Trygg tilkobling til Gjeldsregisteret", "Full transparens om databruk"]
    },
    {
      icon: TrendingUp,
      title: "2. Kontinuerlig overvåking",
      description: "Vårt system analyserer lånemarkedet 24/7 og sammenligner renter og vilkår fra alle relevante banker.",
      details: ["Daglig markedsanalyse", "Sammenligning av alle banker", "Identifisering av bedre tilbud"]
    },
    {
      icon: FileText,
      title: "3. Ferdig tilbud",
      description: "Når vi finner et bedre lånetilbud, forbereder vi alt papirarbeid og presenterer deg for et ferdig tilbud.",
      details: ["Ferdig utfylt søknad", "Sammenligning med nåværende lån", "Klar besparelsesberegning"]
    },
    {
      icon: Zap,
      title: "4. Enkel signering",
      description: "Med én digital signatur godkjenner du byttet. Vi tar seg av resten - det gamle lånet betales og det nye aktiveres.",
      details: ["Kun én signatur kreves", "Automatisk overføring", "Umiddelbar aktivering"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Slik fungerer 
            <span className="block text-primary-blue">Flytta</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            En helt automatisk prosess som sparer deg for tid, penger og hodebry. 
            Fra registrering til refinansiering på under 2 minutter.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-8 shadow-card bg-card/50 backdrop-blur-sm">
              <div className="grid md:grid-cols-3 gap-6 items-center">
                <div className="text-center md:text-left">
                  <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto md:mx-0 mb-4">
                    <step.icon className="h-8 w-8 text-primary-blue" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                </div>
                
                <div className="md:col-span-2">
                  <p className="text-muted-foreground mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-success-green flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Hvorfor er Flytta så effektivt?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="p-6 shadow-card bg-card/50 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 text-primary-blue">Tradisjonell refinansiering</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">Manuell søking etter bedre tilbud</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">Tidkrevende søknadsprosess</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">Komplekst papirarbeid</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground">Går glipp av nye tilbud</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 shadow-card bg-card/50 backdrop-blur-sm border border-success-green/20">
              <h3 className="text-xl font-semibold mb-4 text-success-green">Med Flytta</h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Automatisk markedsovervåking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Ferdig utfylt dokumentasjon</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Kun én digital signatur</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-5 w-5 text-success-green mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Fanger opp alle nye tilbud</span>
                </li>
              </ul>
            </Card>
          </div>

          <div className="bg-gradient-primary p-8 rounded-2xl text-white shadow-soft">
            <h3 className="text-2xl font-bold mb-4">Klar til å spare penger?</h3>
            <p className="mb-6 opacity-90">
              Bli med tusenvis av nordmenn som allerede sparer penger med Flytta
            </p>
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-primary-blue hover:bg-white/90"
              onClick={() => navigate("/reg")}
            >
              Kom i gang nå
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-2xl font-bold text-primary-blue mb-4 md:mb-0">Flytta</div>
            <div className="text-sm text-muted-foreground">
              © 2024 Flytta. Gjør refinansiering enkelt og problemfri.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HowItWorks;