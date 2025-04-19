import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState<number>(25); // 💡 Ny tilstand for alder
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const res = await fetch("http://localhost:8000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, age }),
    });
  
    if (!res.ok) {
      const errorData = await res.json();
      alert(`Feil: ${errorData.detail}`);
      return;
    }
  
    const data = await res.json();
    console.log(data);
  
    localStorage.setItem("username", username);
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
        />
        <input
          type="password"
          placeholder="Passord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-4 py-2 w-full mb-4"
        />
        <input
          type="number"
          placeholder="Alder"
          value={age}
          onChange={(e) => setAge(parseInt(e.target.value))}
          className="border px-4 py-2 w-full mb-4"
        />
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
