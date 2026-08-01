"use client";

import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BudgetCards({ budgetsProgress }: { budgetsProgress: any[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddExpense = async (category: string) => {
    if (!amount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          category: category,
          description: description || `Manual ${category} Expense`,
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setAmount('');
        setDescription('');
        setActiveCategory(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!budgetsProgress || budgetsProgress.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {budgetsProgress.map((b: any, i: number) => (
        <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl relative group hover:border-slate-700 transition-colors">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-semibold text-slate-300">{b.category}</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-500">
                <span className="text-white font-medium">₹{b.spent}</span> / ₹{b.limit}
              </span>
              <button 
                onClick={() => setActiveCategory(b.category)}
                className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                title="Add Expense"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${b.percent > 90 ? 'bg-rose-500' : b.percent > 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} 
              style={{ width: `${b.percent}%` }}
            ></div>
          </div>
          <p className={`text-xs ${b.remaining < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {b.remaining < 0 ? `Overspent by ₹${Math.abs(b.remaining)}` : `₹${b.remaining} remaining`}
          </p>

          {activeCategory === b.category && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col animate-in fade-in duration-200">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-emerald-400">Add to {b.category}</span>
                <button onClick={() => setActiveCategory(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-slate-950 text-white px-3 py-2 rounded-lg text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="bg-slate-950 text-white px-3 py-2 rounded-lg text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleAddExpense(b.category)}
                disabled={loading || !amount}
                className="flex items-center justify-center space-x-2 bg-emerald-500 text-slate-950 font-semibold py-2 rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Save Expense</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
