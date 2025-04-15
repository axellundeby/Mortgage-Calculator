import React, { useState } from 'react';

type Loan = {
  Bank: string;
  Produkt: string;
  'Nominell rente': number;
  'Effektiv rente': number;
  'Etableringsgebyr': number;
  'Termingebyr': number;
  'Maks løpetid': number;
  'Måndlig betaling': number;
};

export default function LoanForm() {
  const [form, setForm] = useState({ age: '', amount: '', years: '' });
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLoans([]);

    try {
        const res = await fetch('http://localhost:8000/api/find-loan', {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              age: parseInt(form.age),
              amount: parseFloat(form.amount),
              years: parseInt(form.years),
            }),
          });
          

      if (!res.ok) throw new Error('API-feil');

      const data = await res.json();
      if (data.length === 0) setError('Ingen lån kvalifiserer.');
      else setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Ukjent feil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Finn beste lån</h1>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input name="age" type="number" placeholder="Alder" required value={form.age} onChange={handleChange} className="border p-2 rounded" />
        <input name="amount" type="number" placeholder="Lånebeløp (kr)" required value={form.amount} onChange={handleChange} className="border p-2 rounded" />
        <input name="years" type="number" placeholder="Løpetid (år)" required value={form.years} onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white rounded py-2 hover:bg-blue-700 transition">Finn lån</button>
      </form>

      {loading && <p className="mt-4">🔍 Søker etter lån...</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {loans.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Topp 3 lån</h2>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Bank</th>
                <th className="border p-2 text-left">Effektiv %</th>
                <th className="border p-2 text-left">Nominell %</th>
                <th className="border p-2 text-left">Månedlig betaling</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, i) => (
                <tr key={i}>
                  <td className="border p-2">{loan.Bank}</td>
                  <td className="border p-2">{loan['Effektiv rente']}</td>
                  <td className="border p-2">{loan['Nominell rente']}</td>
                  <td className="border p-2">{loan['Måndlig betaling']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
