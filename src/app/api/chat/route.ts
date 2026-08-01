import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Settings from '@/models/Settings';
import SIP from '@/models/SIP';
import Goal from '@/models/Goal';
import Loan from '@/models/Loan';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    // 1. Fetch live data context
    await connectToDatabase();
    
    // Get last 100 transactions to save tokens/latency
    const transactions = await Transaction.find().sort({ date: -1 }).limit(100).lean();
    const settings = await Settings.findOne().lean();
    const sips = await SIP.find({ isActive: true }).lean();
    const goals = await Goal.find().lean();
    const loans = await Loan.find({ status: 'active' }).lean();

    const totalNetWorth = (settings?.monthlySalary || 0) + (settings?.assets || []).reduce((sum, a) => sum + a.value, 0);

    const dbContext = {
      totalNetWorth,
      userMonthlySalary: settings?.monthlySalary || 0,
      userAssets: settings?.assets || [],
      monthlyBudgets: settings?.categoryBudgets || [],
      recentTransactions: transactions.map(t => ({ desc: t.description, amount: t.amount, category: t.category, date: t.date })),
      activeSIPs: sips.map(s => ({ name: s.fundName, amount: s.amount, deductionDate: s.deductionDate })),
      savingsGoals: goals.map(g => ({ name: g.title, target: g.targetAmount, current: g.currentAmount })),
      activeUdhari: loans.map(l => ({ person: l.personName, amount: l.amount, type: l.type })) // type = 'borrowed' or 'lent'
    };

    // 2. Setup Gemini Model with System Instructions
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.6-flash',
      systemInstruction: `You are the user's personal financial assistant embedded in their Expense Tracker app.
You have PERFECT memory of their finances. Here is their real-time live database data in JSON format:
${JSON.stringify(dbContext)}

Rules:
1. Answer their questions accurately based ONLY on the provided JSON data.
2. If they ask about something not in the data, politely say you don't have that information.
3. Be friendly, conversational, and use emojis. 
4. Respond in Hinglish (Hindi written in English alphabet) or English, matching their tone.
5. Keep answers concise and strictly to the point.`
    });

    // 3. Convert client messages format to Gemini format
    let formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Gemini requires the first message in history to be from the 'user'.
    // If the first message is the hardcoded greeting from the model, remove it.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const lastMessage = messages[messages.length - 1].content;

    // 4. Start Chat and get response
    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ ok: true, text: responseText });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
