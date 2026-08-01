export const dynamic = 'force-dynamic';
import connectToDatabase from '@/lib/mongodb';
import Transaction, { ITransaction } from '@/models/Transaction';
import Settings from '@/models/Settings';
import SIP from '@/models/SIP';
import Loan from '@/models/Loan';
import { checkAndSendMonthlyReport } from '@/lib/monthlyReportJob';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, List, PieChart as PieChartIcon, Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import DashboardCharts from './components/DashboardCharts';
import TransactionList from './components/TransactionList';
import BudgetCards from './components/BudgetCards';
import AIReportButton from './components/AIReportButton';
import SavingsGoals from './components/SavingsGoals';

// A Next.js Server Component
export default async function Home() {
  // Fetch data from MongoDB
  // Fetch data from MongoDB
  await connectToDatabase();

  // --- AUTO-DEDUCT SIPs LOGIC ---
  const today = new Date();
  const currentMonthNum = today.getMonth();
  const currentYearNum = today.getFullYear();
  const todayDate = today.getDate();
  const currentMonthStr = `${currentYearNum}-${String(currentMonthNum + 1).padStart(2, '0')}`;

  const sips = await SIP.find({ isActive: true });
  for (const sip of sips) {
    if (todayDate >= sip.deductionDate && sip.lastProcessedMonth !== currentMonthStr) {
      // Create new transaction for this SIP
      await Transaction.create({
        amount: sip.amount,
        category: 'Investment',
        date: today.toISOString().split('T')[0],
        description: `Auto-deducted SIP: ${sip.fundName}`,
        userId: 'system', // Automatically generated
      });
      
      // Update SIP record
      sip.lastProcessedMonth = currentMonthStr;
      await sip.save();
    }
  }
  // --- END AUTO-DEDUCT LOGIC ---

  // --- TRIGGER MONTHLY REPORT ---
  // We fire this asynchronously and don't await it so page loads fast.
  checkAndSendMonthlyReport().catch(console.error);

  const transactions: ITransaction[] = await Transaction.find({}).sort({ date: -1 }).lean();

  // Calculate total expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalCurrentMonth = currentMonthExpenses.reduce((acc, t) => acc + t.amount, 0);

  // Group by category for current month (case-insensitive)
  const categoryData: Record<string, number> = {};
  currentMonthExpenses.forEach((t) => {
    const key = t.category.trim().toLowerCase();
    categoryData[key] = (categoryData[key] || 0) + t.amount;
  });

  const pieChartData = Object.keys(categoryData).map((key) => ({
    // Capitalize first letter for display
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: categoryData[key],
  }));

  // Fetch Settings
  let settings = await Settings.findOne().lean();
  const salary = settings?.monthlySalary || 0;
  
  // Calculate Budgets Progress
  const budgetsProgress = settings?.categoryBudgets?.map((b: any) => {
    const spent = categoryData[b.category.trim().toLowerCase()] || 0;
    const remaining = b.limit - spent;
    const percent = Math.min((spent / b.limit) * 100, 100);
    return { ...b, spent, remaining, percent };
  }) || [];

  const remainingSalary = salary - totalCurrentMonth;

  const assets = settings?.assets || [];
  const totalNetWorth = assets.reduce((sum: number, a: any) => sum + a.value, 0);

  // Fetch pending loans
  const pendingLoans = await Loan.find({ status: 'pending' }).lean();
  const totalBorrowed = pendingLoans.filter(l => l.type === 'borrowed').reduce((acc, l) => acc + l.amount, 0);
  const totalLent = pendingLoans.filter(l => l.type === 'lent').reduce((acc, l) => acc + l.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
              Dashboard
            </h1>
            <p className="text-slate-400 mt-2">Welcome back! Here's your financial overview.</p>
          </div>
          <AIReportButton />
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Summary Card */}
          <div className="col-span-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 flex flex-col justify-center">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-300">This Month</h2>
            </div>
            <p className="text-5xl font-bold tracking-tight text-white mb-2">
              ₹{totalCurrentMonth.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500 mb-6">Across {currentMonthExpenses.length} transactions</p>

            <div className="pt-4 border-t border-slate-800/50">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Monthly Salary</span>
                <span className="font-medium text-emerald-400">₹{salary}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Remaining Balance</span>
                <span className={`font-medium ${remainingSalary >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  ₹{remainingSalary.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <div className="col-span-1 md:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 h-96">
            <div className="flex items-center space-x-3 mb-4">
              <PieChartIcon className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-slate-300">Expense Distribution</h2>
            </div>
            <div className="w-full h-[300px]">
               <DashboardCharts data={pieChartData} />
            </div>
          </div>
        </div>

        {/* Udhari Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Udhar Liya Box */}
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.05)]">
            <div>
               <p className="text-sm font-medium text-rose-400 mb-1">Udhar Liya (You Owe)</p>
               <h3 className="text-3xl font-bold text-white">₹{totalBorrowed.toFixed(2)}</h3>
               <p className="text-xs text-rose-500/70 mt-1">Paise lautane hain</p>
            </div>
            <div className="p-3 bg-rose-500/20 rounded-2xl">
              <ArrowDownRight className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          
          {/* Udhar Diya Box */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            <div>
               <p className="text-sm font-medium text-emerald-400 mb-1">Udhar Diya (To Receive)</p>
               <h3 className="text-3xl font-bold text-white">₹{totalLent.toFixed(2)}</h3>
               <p className="text-xs text-emerald-500/70 mt-1">Paise aane hain</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-2xl">
              <ArrowUpRight className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Budgets Section */}
        <BudgetCards budgetsProgress={budgetsProgress} />

        {/* Savings Goals */}
        <SavingsGoals />

        {/* Recent Transactions */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <List className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-slate-300">Recent Transactions</h2>
          </div>
          
          <TransactionList initialTransactions={JSON.parse(JSON.stringify(transactions))} />
        </div>

      </div>
    </div>
  );
}
