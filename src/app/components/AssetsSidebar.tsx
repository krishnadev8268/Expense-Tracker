"use client";

import { useState, useEffect } from 'react';
import { Wallet, X, Gem } from 'lucide-react';

export default function AssetsSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/settings')
        .then(res => res.json())
        .then(settingsData => {
          const defaultAssets = settingsData.monthlySalary ? [{ name: 'Monthly Salary', value: settingsData.monthlySalary }] : [];
          setAssets([...defaultAssets, ...(settingsData.assets || [])]);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  const totalNetWorth = assets.reduce((sum, a) => sum + a.value, 0);

  return (
    <>
      {/* Sidebar Toggle Button (Fixed on Left) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 left-0 -translate-y-1/2 bg-slate-800 hover:bg-slate-700 border border-slate-700 border-l-0 rounded-r-2xl p-3 shadow-xl transition-all z-40 flex items-center space-x-2 group"
      >
        <Wallet className="w-6 h-6 text-fuchsia-400" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 bg-slate-950 border-r border-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-fuchsia-500/20 rounded-xl">
                <Gem className="w-6 h-6 text-fuchsia-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">My Wealth</h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {loading ? (
              <div className="text-slate-500 text-sm animate-pulse">Loading assets...</div>
            ) : assets.length === 0 ? (
              <div className="text-slate-500 text-sm">
                No assets added. Go to Settings to track your Salary, EPFO, and SIPs!
              </div>
            ) : (
              assets.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl">
                  <span className="font-medium text-slate-300">{a.name}</span>
                  <span className="text-emerald-400 font-semibold">₹{a.value.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>

          {/* Total Footer */}
          {!loading && assets.length > 0 && (
            <div className="mt-auto pt-6 border-t border-slate-800">
              <div className="p-5 bg-gradient-to-br from-fuchsia-600/20 to-purple-900/20 border border-fuchsia-500/30 rounded-2xl text-center">
                <p className="text-sm text-fuchsia-400/80 mb-1">Total Net Worth</p>
                <p className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                  ₹{totalNetWorth.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
