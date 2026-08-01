"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SIP = {
  _id: string;
  fundName: string;
  amount: number;
  deductionDate: number;
  lastProcessedMonth: string;
  isActive: boolean;
};

export default function InvestmentsPage() {
  const [sips, setSips] = useState<SIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState({
    fundName: '',
    amount: '',
    deductionDate: '15'
  });

  const fetchSIPs = async () => {
    try {
      const res = await fetch('/api/sips');
      const data = await res.json();
      setSips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSIPs();
  }, []);

  const handleAddSIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fundName || !form.amount || !form.deductionDate) return;

    try {
      const res = await fetch('/api/sips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fundName: form.fundName,
          amount: Number(form.amount),
          deductionDate: Number(form.deductionDate)
        })
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ fundName: '', amount: '', deductionDate: '15' });
        fetchSIPs();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add SIP.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SIP?')) return;
    setSips(prev => prev.filter(s => s._id !== id));
    try {
      await fetch(`/api/sips/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      console.error(err);
      fetchSIPs();
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading Investments...</div>;

  const totalMonthlySIP = sips.reduce((sum, sip) => sum + sip.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3 text-white">
              <TrendingUp className="w-8 h-8 text-indigo-400" />
              <span>Investments & SIPs</span>
            </h1>
            <p className="text-slate-400 mt-2">Manage your recurring investments and auto-deductions.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Add SIP</span>
          </button>
        </header>

        {showForm && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-xl font-semibold mb-6">New SIP Setup</h2>
            <form onSubmit={handleAddSIP} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">Fund / Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parag Parikh Flexi Cap"
                  value={form.fundName}
                  onChange={e => setForm({...form, fundName: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Monthly Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="5000"
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Deduction Date</label>
                <select
                  value={form.deductionDate}
                  onChange={e => setForm({...form, deductionDate: e.target.value})}
                  className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-bold rounded-xl transition-colors">Save SIP</button>
              </div>

            </form>
          </div>
        )}

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-slate-300">Active SIPs</h2>
            <div className="bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
              <span className="text-sm text-indigo-300">Total Monthly SIP: </span>
              <span className="font-bold text-indigo-400">₹{totalMonthlySIP}</span>
            </div>
          </div>

          <div className="space-y-4">
            {sips.map(sip => (
              <div key={sip._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-indigo-500/30 transition-colors">
                
                <div className="mb-4 sm:mb-0">
                  <h3 className="font-bold text-lg text-white">{sip.fundName}</h3>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-slate-400">
                    <CalendarClock className="w-4 h-4" />
                    <span>Deducts on the {sip.deductionDate}{sip.deductionDate === 1 ? 'st' : sip.deductionDate === 2 ? 'nd' : sip.deductionDate === 3 ? 'rd' : 'th'} of every month</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end sm:space-x-6 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Amount</p>
                    <p className="text-xl font-bold text-indigo-400">₹{sip.amount}</p>
                  </div>
                  <button onClick={() => handleDelete(sip._id)} className="p-3 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors ml-4">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

              </div>
            ))}
            
            {sips.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400">No active SIPs found. Add one to start tracking your investments automatically!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
