// src/components/Home.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto text-center py-20 px-4">
      <h1 className="text-4xl font-bold text-blue-600 mb-6">Velkommen til Flytta</h1>
      <p className="text-lg text-gray-700 mb-8">
        En smartere måte å refinansiere forbrukslån og spare penger. Logg inn for å se ditt lån, eller registrer deg og kom i gang.
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Logg inn
        </button>
        <button
          onClick={() => navigate("/reg")}
          className="bg-gray-200 text-blue-600 px-6 py-2 rounded hover:bg-gray-300"
        >
          Registrer deg
        </button>
      </div>
    </div>
  );
};

export default Home;
