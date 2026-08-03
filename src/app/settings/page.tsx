"use client";

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [salary, setSalary] = useState<number>(0);
  const [budgets, setBudgets] = useState<{ category: string; limit: number }[]>([]);
  const [recurring, setRecurring] = useState<{ amount: number; category: string; description: string; dayOfMonth: number; lastProcessedMonth: string }[]>([]);
  const [assets, setAssets] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSalary(data.monthlySalary || 0);
        setBudgets(data.categoryBudgets || []);
        setRecurring(data.recurringExpenses || []);
        setAssets(data.assets || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleAddBudget = () => {
    setBudgets([...budgets, { category: '', limit: 0 }]);
  };

  const handleUpdateBudget = (index: number, field: 'category' | 'limit', value: string | number) => {
    const newBudgets = [...budgets];
    newBudgets[index] = { ...newBudgets[index], [field]: value };
    setBudgets(newBudgets);
  };

  const handleRemoveBudget = (index: number) => {
    setBudgets(budgets.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlySalary: salary, categoryBudgets: budgets, recurringExpenses: recurring, assets }),
      });
      if (res.ok) {
        alert('Settings saved successfully!');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  if (loading) return <div className="p-12 text-center">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold text-white">Settings & Budgeting</h1>
          <p className="text-slate-400 mt-2">Manage your monthly salary and category limits.</p>
        </header>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 space-y-8">
          
          {/* Salary Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Monthly Salary</h2>
            <div className="flex items-center space-x-4">
              <span className="text-2xl font-medium text-slate-300">₹</span>
              <input
                type="number"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
                className="bg-slate-800 text-white text-lg px-4 py-3 rounded-xl w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter Monthly Salary"
              />
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Budgets Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-cyan-400">Category Budgets</h2>
              <button
                onClick={handleAddBudget}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {budgets.map((b, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    value={b.category}
                    onChange={(e) => handleUpdateBudget(i, 'category', e.target.value)}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g. Grocery, Rent"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={b.limit}
                      onChange={(e) => handleUpdateBudget(i, 'limit', Number(e.target.value))}
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Limit Amount"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveBudget(i)}
                    className="p-3 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {budgets.length === 0 && (
                <p className="text-slate-500 text-sm">No category budgets set. Add some to start tracking overspending!</p>
              )}
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Recurring Expenses Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-orange-400">Fixed / Recurring Expenses</h2>
                <p className="text-sm text-slate-400">Expenses that will be auto-added every month.</p>
              </div>
              <button
                onClick={() => setRecurring([...recurring, { amount: 0, category: '', description: '', dayOfMonth: 1, lastProcessedMonth: '' }])}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Fixed Expense</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {recurring.map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    value={r.description}
                    onChange={(e) => {
                      const newR = [...recurring];
                      newR[i].description = e.target.value;
                      setRecurring(newR);
                    }}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Rent, Netflix, SIP"
                  />
                  <input
                    type="text"
                    value={r.category}
                    onChange={(e) => {
                      const newR = [...recurring];
                      newR[i].category = e.target.value;
                      setRecurring(newR);
                    }}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Category"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={r.amount}
                      onChange={(e) => {
                        const newR = [...recurring];
                        newR[i].amount = Number(e.target.value);
                        setRecurring(newR);
                      }}
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Amount"
                    />
                  </div>
                  <div className="flex items-center space-x-2 w-32 shrink-0">
                    <span className="text-slate-400 text-sm">Day:</span>
                    <input
                      type="number"
                      min="1" max="31"
                      value={r.dayOfMonth}
                      onChange={(e) => {
                        const newR = [...recurring];
                        newR[i].dayOfMonth = Number(e.target.value);
                        setRecurring(newR);
                      }}
                      className="bg-slate-800 text-white px-3 py-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                      placeholder="Date (1-31)"
                    />
                  </div>
                  <button
                    onClick={() => setRecurring(recurring.filter((_, idx) => idx !== i))}
                    className="p-3 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {recurring.length === 0 && (
                <p className="text-slate-500 text-sm">No recurring expenses set. Save time by automating your Rent, Gym, and EMI entries!</p>
              )}
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Assets / Net Worth Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-fuchsia-400">Total Assets / Wealth</h2>
                <p className="text-sm text-slate-400">Track your Salary Account, EPFO, Mutual Funds, etc.</p>
              </div>
              <button
                onClick={() => setAssets([...assets, { name: '', value: 0 }])}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Asset</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {assets.map((a, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <input
                    type="text"
                    value={a.name}
                    onChange={(e) => {
                      const newAssets = [...assets];
                      newAssets[i].name = e.target.value;
                      setAssets(newAssets);
                    }}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl flex-1 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g. Salary A/c, EPFO, SIPs"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={a.value}
                      onChange={(e) => {
                        const newAssets = [...assets];
                        newAssets[i].value = Number(e.target.value);
                        setAssets(newAssets);
                      }}
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    onClick={() => setAssets(assets.filter((_, idx) => idx !== i))}
                    className="p-3 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {assets.length === 0 && (
                <p className="text-slate-500 text-sm">No assets added. Add your bank accounts or investments to see your Net Worth on the Dashboard!</p>
              )}
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
