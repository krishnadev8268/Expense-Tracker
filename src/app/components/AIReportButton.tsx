"use client";

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

export default function AIReportButton() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setShowModal(true);
    setReport(null);
    try {
      const res = await fetch('/api/reports/monthly');
      const data = await res.json();
      if (data.ok) {
        setReport(data.report);
      } else {
        setReport("Failed to generate report.");
      }
    } catch (err) {
      console.error(err);
      setReport("An error occurred while generating the report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={generateReport}
        className="flex items-center space-x-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(219,39,119,0.5)]"
      >
        <Sparkles className="w-5 h-5" />
        <span>Generate AI Advisor Report</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-xl font-bold flex items-center space-x-2 text-fuchsia-400">
                <Sparkles className="w-6 h-6" />
                <span>Your Monthly Financial Insights</span>
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto prose prose-invert prose-fuchsia max-w-none">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 text-fuchsia-500 animate-spin" />
                  <p className="text-slate-400 animate-pulse">Gemini is analyzing your finances...</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-slate-300 text-base leading-relaxed">
                  {report}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
