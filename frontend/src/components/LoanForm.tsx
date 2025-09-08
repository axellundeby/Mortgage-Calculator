import React, { useState } from "react";

const LoanForm: React.FC = () => {
  const [age, setAge] = useState("");
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const API_URL = process.env.REACT_APP_API_BASE || "";


    try {
      const response = await fetch(`${API_URL}/api/find-loan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age: Number(age),
          amount: Number(amount),
          years: Number(years),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      setResults(data);
    } catch (error) {
      console.error("Error fetching loan data:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 py-12 px-4">
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
            
        <h2 className="text-2xl font-bold mb-6 text-center">Lånekalkulator</h2>

        <div className="mb-4 ">
          <label className="block text-gray-700 font-medium mb-2">Alder</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="25"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Lånebeløp (kr)
          </label>
          <input
            type="number"
            value={amount}
            placeholder="30000"
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Løpetid (år)
          </label>
          <input
            type="number"
            value={years}
            placeholder="3"
            onChange={(e) => setYears(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Finn beste lån
        </button>
      </form>

      {results.length > 0 && (
        <div className="mt-8 w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">
            Beste lånealternativer
          </h3>
          <ul className="space-y-4">
            {results.map((loan, index) => (
              <li
                key={index}
                className="border p-4 rounded-md shadow-sm bg-gray-50"
              >
                <p className="font-bold">{loan.Bank} - {loan.Produkt}</p>
                <p>Månedlig betaling: {loan["Måndlig betaling"]} kr</p>
                <p>Effektiv rente: {loan["Effektiv rente"]}%</p>
                <p>Nominell rente: {loan["Nominell rente"]}%</p>

              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LoanForm;
