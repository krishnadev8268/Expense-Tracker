export const dynamic = 'force-dynamic';
"use client";

import { useState, useEffect } from 'react';
import { HandCoins, Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';

type Loan = {
  _id: string;
  type: 'borrowed' | 'lent';
  personName: string;
  amount: number;
  date: string;
  status: 'pending' | 'settled';
  description?: string;
};

export default function UdhariPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'borrowed',
    personName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans');
      const data = await res.json();
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personName || !form.amount) return;

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          personName: form.personName,
          amount: Number(form.amount),
          date: form.date,
          description: form.description
        })
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ ...form, personName: '', amount: '', description: '' });
        fetchLoans();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add Udhari entry.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'pending' ? 'settled' : 'pending';
    
    // Optimistic update
    setLoans(prev => prev.map(l => l._id === id ? { ...l, status: newStatus } : l));

    try {
      await fetch(`/api/loans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      fetchLoans(); // Revert on failure
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    setLoans(prev => prev.filter(l => l._id !== id));

    try {
      await fetch(`/api/loans/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
      fetchLoans();
    }
  };

  const borrowed = loans.filter(l => l.type === 'borrowed');
  const lent = loans.filter(l => l.type === 'lent');

  const totalBorrowedPending = borrowed.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0);
  const totalLentPending = lent.filter(l => l.status === 'pending').reduce((sum, l) => sum + l.amount, 0);

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Udhari Ledger...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3 text-white">
              <HandCoins className="w-8 h-8 text-amber-400" />
              <span>Udhari Ledger</span>
            </h1>
            <p className="text-slate-400 mt-2">Track money borrowed and lent professionally.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add Entry</span>
          </button>
        </header>

        {showForm && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-semibold mb-6">New Udhari Entry</h2>
            <form onSubmit={handleAddLoan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="borrowed">Maine Paise Liye (Borrowed)</option>
                  <option value="lent">Maine Paise Diye (Lent)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Person Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul, Office Colleague"
                  value={form.personName}
                  onChange={e => setForm({...form, personName: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. For dinner, Emergency medical"
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors">Save Entry</button>
              </div>

            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Borrowed Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-rose-400">Paise Liye (Borrowed)</h2>
              <span className="text-sm font-medium bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full">
                Total Pending: ₹{totalBorrowedPending}
              </span>
            </div>

            <div className="space-y-4">
              {borrowed.map(l => (
                <div key={l._id} className={`p-4 rounded-2xl border transition-all ${l.status === 'settled' ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-800/50 border-slate-700 hover:border-rose-500/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white">{l.personName}</h3>
                      <p className="text-xs text-slate-400">{new Date(l.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xl font-bold text-rose-400">₹{l.amount}</span>
                  </div>
                  {l.description && <p className="text-sm text-slate-300 mb-4">{l.description}</p>}
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => handleToggleStatus(l._id, l.status)}
                      className={`flex items-center space-x-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${l.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {l.status === 'settled' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span>{l.status === 'settled' ? 'Settled' : 'Mark as Settled'}</span>
                    </button>

                    <button onClick={() => handleDelete(l._id)} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {borrowed.length === 0 && <p className="text-slate-500 text-center py-4">No borrowed money.</p>}
            </div>
          </div>

          {/* Lent Section */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-emerald-400">Paise Diye (Lent)</h2>
              <span className="text-sm font-medium bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">
                Total Pending: ₹{totalLentPending}
              </span>
            </div>

            <div className="space-y-4">
              {lent.map(l => (
                <div key={l._id} className={`p-4 rounded-2xl border transition-all ${l.status === 'settled' ? 'bg-slate-900/50 border-slate-800 opacity-60' : 'bg-slate-800/50 border-slate-700 hover:border-emerald-500/50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white">{l.personName}</h3>
                      <p className="text-xs text-slate-400">{new Date(l.date).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xl font-bold text-emerald-400">₹{l.amount}</span>
                  </div>
                  {l.description && <p className="text-sm text-slate-300 mb-4">{l.description}</p>}
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={() => handleToggleStatus(l._id, l.status)}
                      className={`flex items-center space-x-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${l.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {l.status === 'settled' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span>{l.status === 'settled' ? 'Settled' : 'Mark as Settled'}</span>
                    </button>

                    <button onClick={() => handleDelete(l._id)} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {lent.length === 0 && <p className="text-slate-500 text-center py-4">No lent money.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
