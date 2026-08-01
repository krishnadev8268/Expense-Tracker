"use client";

import { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TransactionList({ initialTransactions }: { initialTransactions: any[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    // Optimistic update
    setTransactions(prev => prev.filter(t => t._id !== id));
    
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh(); // Refresh server component data
    } catch (err) {
      console.error(err);
      alert('Failed to delete transaction.');
      // Revert optimistic update by reloading page
      window.location.reload();
    }
  };

  const handleEditClick = (t: any) => {
    setEditingId(t._id);
    setEditForm({
      amount: t.amount,
      category: t.category,
      date: new Date(t.date).toISOString().split('T')[0],
      description: t.description
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`/api/transactions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(editForm.amount),
          category: editForm.category,
          date: editForm.date,
          description: editForm.description
        })
      });
      
      if (!res.ok) throw new Error('Failed to update');
      const data = await res.json();
      
      // Update local state
      setTransactions(prev => prev.map(t => t._id === editingId ? data.transaction : t));
      setEditingId(null);
      router.refresh(); // Tell Next.js to re-fetch the server component for the PieChart
    } catch (err) {
      console.error(err);
      alert('Failed to update transaction.');
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        No transactions found. Add some via Telegram!
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {transactions.map((t) => (
          <div key={`mobile-${t._id}`} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
            {editingId === t._id ? (
              <div className="space-y-3">
                <input type="date" className="bg-slate-900 text-white px-3 py-2 rounded-lg w-full text-sm" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                <input type="text" className="bg-slate-900 text-white px-3 py-2 rounded-lg w-full text-sm" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Description" />
                <input type="text" className="bg-slate-900 text-white px-3 py-2 rounded-lg w-full text-sm" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} placeholder="Category" />
                <input type="number" className="bg-slate-900 text-white px-3 py-2 rounded-lg w-full text-sm" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} placeholder="Amount" />
                <div className="flex justify-end space-x-2 pt-2">
                  <button onClick={handleCancelEdit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg text-sm transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-medium">{t.description || '—'}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
                      }).format(new Date(t.createdAt || t.date))}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">₹{t.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="px-3 py-1 bg-slate-900 text-xs font-medium rounded-full text-slate-300">
                    {t.category}
                  </span>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditClick(t)} className="p-2 bg-slate-900 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="p-2 bg-slate-900 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-sm">
              <th className="pb-4 font-medium">Date</th>
              <th className="pb-4 font-medium">Description</th>
              <th className="pb-4 font-medium">Category</th>
              <th className="pb-4 font-medium text-right">Amount</th>
              <th className="pb-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={`desktop-${t._id}`} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                
                {editingId === t._id ? (
                  <>
                    <td className="py-4">
                      <input type="date" className="bg-slate-900 text-white px-2 py-1 rounded w-full max-w-[130px] text-sm border border-slate-700" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} />
                    </td>
                    <td className="py-4">
                      <input type="text" className="bg-slate-900 text-white px-2 py-1 rounded w-full text-sm border border-slate-700" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                    </td>
                    <td className="py-4">
                      <input type="text" className="bg-slate-900 text-white px-2 py-1 rounded w-full max-w-[120px] text-sm border border-slate-700" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
                    </td>
                    <td className="py-4 text-right">
                      <input type="number" className="bg-slate-900 text-white px-2 py-1 rounded w-24 text-right text-sm border border-slate-700" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 rounded-lg transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={handleCancelEdit} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-300" /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-4 text-slate-300">
                      {new Intl.DateTimeFormat('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      }).format(new Date(t.createdAt || t.date))}
                    </td>
                    <td className="py-4 text-white font-medium">{t.description || '—'}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 bg-slate-800 text-xs font-medium rounded-full text-slate-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold text-emerald-400">₹{t.amount.toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEditClick(t)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t._id)} className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
