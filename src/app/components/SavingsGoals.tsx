"use client";

import { useState, useEffect } from 'react';
import { Target, Plus, PiggyBank, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Goal = {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
};

export default function SavingsGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFundId, setAddFundId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '' });
  const router = useRouter();

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.targetAmount) return;
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal.title,
          targetAmount: Number(newGoal.targetAmount)
        })
      });
      setNewGoal({ title: '', targetAmount: '' });
      setShowAddForm(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFunds = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!fundAmount) return;
    try {
      await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addAmount: Number(fundAmount) })
      });
      setFundAmount('');
      setAddFundId(null);
      fetchGoals();
      router.refresh(); // Refresh dashboard stats
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-slate-300">Savings Goals</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm bg-slate-800 hover:bg-slate-700 text-amber-400 px-4 py-2 rounded-xl transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateGoal} className="bg-slate-900/60 p-4 rounded-2xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-800">
          <input
            type="text"
            placeholder="Goal Title (e.g. MacBook)"
            required
            value={newGoal.title}
            onChange={e => setNewGoal({...newGoal, title: e.target.value})}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg"
          />
          <input
            type="number"
            placeholder="Target Amount"
            required
            value={newGoal.targetAmount}
            onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg"
          />
          <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors">
            Create
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => {
          const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          
          return (
            <div key={goal._id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:border-amber-500/30 transition-all text-center relative group">
              <h3 className="font-semibold text-white mb-4">{goal.title}</h3>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="currentColor" 
                    strokeWidth="8" 
                    strokeLinecap="round"
                    className="text-amber-500"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * percent) / 100}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-amber-400">{percent}%</span>
                </div>
              </div>

              <div className="flex justify-between text-sm text-slate-400 mb-4">
                <span>₹{goal.currentAmount}</span>
                <span>₹{goal.targetAmount}</span>
              </div>

              {addFundId === goal._id ? (
                <form onSubmit={(e) => handleAddFunds(e, goal._id)} className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Amt"
                    autoFocus
                    required
                    value={fundAmount}
                    onChange={e => setFundAmount(e.target.value)}
                    className="bg-slate-900 text-white px-3 py-1.5 rounded-lg w-full text-sm"
                  />
                  <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-sm">Add</button>
                  <button type="button" onClick={() => setAddFundId(null)} className="text-slate-400 hover:text-white px-2">X</button>
                </form>
              ) : (
                <button 
                  onClick={() => setAddFundId(goal._id)}
                  className="flex items-center justify-center space-x-2 w-full bg-slate-900 hover:bg-slate-950 text-amber-400 py-2 rounded-xl transition-colors border border-slate-700 hover:border-amber-500/50 text-sm font-medium"
                >
                  <PiggyBank className="w-4 h-4" />
                  <span>Add Funds</span>
                </button>
              )}
            </div>
          );
        })}

        {goals.length === 0 && !showAddForm && (
          <div className="col-span-full text-center py-8 text-slate-500 text-sm">
            You don't have any savings goals yet. Create one to start tracking!
          </div>
        )}
      </div>
    </div>
  );
}
