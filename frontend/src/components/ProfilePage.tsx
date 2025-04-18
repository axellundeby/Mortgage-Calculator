import React, { useEffect, useState } from "react";

interface Loan {
  bank: string;
  produkt: string;
  effektiv_rente: number;
  måntlig_betaling: number;
  nedbetalt: number;
  mangler: number;
  years: number;
  total_kostnad?: number;
}

const ProfilePage: React.FC = () => {
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserLoan = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        const res = await fetch(`http://localhost:8000/api/user-loan/${username}`);
        const data = await res.json();
        setLoan(data);
      } catch (err) {
        console.error("Kunne ikke hente lån for bruker", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserLoan();
  }, []);

  if (loading) {
    return <p className="text-gray-500 text-center mt-8">Laster lånedata...</p>;
  }

  if (!loan) {
    return <p className="text-red-600 text-center mt-8">Fant ingen lån registrert for deg.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Min låneprofil</h2>
      <ul className="space-y-2">
        <li><strong>Bank:</strong> {loan.bank}</li>
        <li><strong>Produkt:</strong> {loan.produkt}</li>
        <li><strong>Effektiv rente:</strong> {loan.effektiv_rente?.toFixed(2)}%</li>
        <li><strong>Månedlig betaling:</strong> {loan.måntlig_betaling?.toLocaleString("no-NO")} kr</li>
        <li><strong>Nedbetalt:</strong> {loan.nedbetalt?.toLocaleString("no-NO")} kr</li>
        <li><strong>Gjenstående:</strong> {loan.mangler?.toLocaleString("no-NO")} kr</li>
        <li><strong>Antall år igjen:</strong> {loan.years} år</li>
        <li><strong>Total gjenstående kostnad:</strong> {(loan.total_kostnad || loan.måntlig_betaling * loan.years * 12).toLocaleString("no-NO")} kr</li>
      </ul>
    </div>
  );
};

export default ProfilePage;
