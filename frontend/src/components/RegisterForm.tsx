import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState<number>(25);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_URL = (process.env.REACT_APP_API_BASE || "");

    if (age < 18) {
      setError("Du må være minst 18 år for å registrere deg.");
      return;
    }

    setError(null);
    const res = await fetch(`${API_URL}/api/register`, {
      
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, age }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.detail || "Noe gikk galt ved registrering.");
      return;
    }

    const data = await res.json();
    console.log(data);

    localStorage.setItem("username", username);
    localStorage.removeItem("userLoan");
    localStorage.removeItem("loanAlreadyFetched");
    alert("Registrert!");
    navigate("/profil");
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Registrer deg</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Brukernavn"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border px-4 py-2 w-full mb-4"
          required
        />
        <input
          type="password"
          placeholder="Passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-4 py-2 w-full mb-4"
          required
        />
        <input
          type="number"
          placeholder="Alder"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value))}
          className="border px-4 py-2 w-full mb-4"
        />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Registrer
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
