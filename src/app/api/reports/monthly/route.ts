import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import SIP from '@/models/SIP';
import Settings from '@/models/Settings';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Get Current Month Transactions
    const today = new Date();
    const currentMonthNum = today.getMonth();
    const currentYearNum = today.getFullYear();
    
    // Format as YYYY-MM-DD avoiding timezone offset issues
    const startStr = `${currentYearNum}-${String(currentMonthNum + 1).padStart(2, '0')}-01`;
    const endStr = `${currentYearNum}-${String(currentMonthNum + 1).padStart(2, '0')}-31`; 

    const currentMonthTransactions = await Transaction.find({
      date: { $gte: startStr, $lte: endStr }
    }).lean();

    // 2. Aggregate by Category
    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    currentMonthTransactions.forEach(t => {
      const cat = t.category.trim();
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      totalSpent += t.amount;
    });

    // 3. Get Salary & Budgets
    const settings = await Settings.findOne().lean();
    const salary = settings?.monthlySalary || 0;
    const remaining = salary - totalSpent;

    // 4. Get SIPs
    const activeSIPs = await SIP.find({ isActive: true }).lean();
    const sipList = activeSIPs.map(s => `${s.fundName} (₹${s.amount})`).join(', ');

    // 5. Construct AI Prompt
    const prompt = `You are a friendly, encouraging, and highly professional AI Financial Advisor. 
    Analyze the following financial data for the user for the current month:
    
    Monthly Salary: ₹${salary}
    Total Spent so far: ₹${totalSpent}
    Remaining Cash: ₹${remaining}
    
    Category Breakdown:
    ${Object.entries(categoryTotals).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}
    
    Active Investments (SIPs):
    ${sipList || 'No active SIPs found.'}
    
    Your task:
    1. Give a short, encouraging summary of their spending habits this month.
    2. Point out if they are overspending in any specific category.
    3. Analyze their SIPs based on general market knowledge. Suggest if they should "Hold", "Increase", or "Review" their current funds, and give a 1-sentence reason why based on general trends.
    4. Keep the tone conversational, use emojis, and format the output beautifully using Markdown (bolding, lists). Keep it concise (under 250 words).`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    const reportText = result.response.text();

    return NextResponse.json({ ok: true, report: reportText });
  } catch (error: any) {
    console.error('AI Report Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
