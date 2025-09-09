import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft } from "lucide-react";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_URL = process.env.REACT_APP_API_BASE || "";

    const res = await fetch(`${API_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      localStorage.setItem("username", username);

      const loanRes = await fetch(`${API_URL}/api/user-loan/${username}`);
      if (loanRes.ok) {
        const loan = await loanRes.json();
        localStorage.setItem("userLoan", JSON.stringify(loan));
        localStorage.setItem("loanAlreadyFetched", "true");
      }

      navigate("/profil");
    } else {
      alert("Feil brukernavn eller passord");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Card className="p-8 shadow-card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Logg inn til Flytta</h1>
            <p className="text-muted-foreground">Velkommen tilbake</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" placeholder="din@epost.no" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <Button className="w-full" size="lg" type="submit">
              Logg inn
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Har du ikke konto?{" "}
              <button 
                onClick={() => navigate("/reg")}
                className="text-primary-blue hover:underline font-medium"
              >
                Registrer deg her
              </button>
            </p>
          </div>
        </Card>
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til forsiden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
