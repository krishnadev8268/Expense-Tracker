import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import Transaction from '@/models/Transaction';
import { generatePDFReport } from './pdfGenerator';
import { sendTelegramDocument } from './telegramBot';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function checkAndSendMonthlyReport() {
  try {
    await connectToDatabase();
    
    const today = new Date();
    const day = today.getDate();
    // Only run on the 30th, 31st or 1st of the month
    if (day !== 30 && day !== 31 && day !== 1) return;

    // Determine the target month for the report
    // If today is the 1st, report is for the previous month. Otherwise, for the current month.
    let targetMonthNum = today.getMonth();
    let targetYearNum = today.getFullYear();
    
    if (day === 1) {
      targetMonthNum -= 1;
      if (targetMonthNum < 0) {
        targetMonthNum = 11;
        targetYearNum -= 1;
      }
    }

    const reportMonthStr = `${targetYearNum}-${String(targetMonthNum + 1).padStart(2, '0')}`;

    const settings = await Settings.findOne();
    if (!settings) return;

    // If report already sent for this month, do nothing
    if (settings.lastReportMonth === reportMonthStr) return;

    console.log(`Generating Monthly PDF Report for ${reportMonthStr}...`);

    // Fetch transactions for the target month
    const startStr = `${targetYearNum}-${String(targetMonthNum + 1).padStart(2, '0')}-01`;
    const endStr = `${targetYearNum}-${String(targetMonthNum + 1).padStart(2, '0')}-31`; 

    const transactions = await Transaction.find({
      date: { $gte: startStr, $lte: endStr }
    }).lean();

    if (transactions.length === 0) return; // No data to report

    // Find a chat ID to send to (use the most recent transaction's userId)
    // In a multi-user app, we would loop over users. Here it's a single-user personal app.
    const userTx = transactions.find(t => t.userId && t.userId !== 'system');
    const chatId = userTx?.userId || process.env.TELEGRAM_CHAT_ID;
    if (!chatId) return;

    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    transactions.forEach(t => {
      const cat = t.category.trim();
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      totalSpent += t.amount;
    });

    const salary = settings.monthlySalary || 0;
    const savings = salary - totalSpent;

    // Generate Surgical Hinglish AI Analysis
    const prompt = `You are a strict but helpful AI Financial Advisor. Write a "Surgical Monthly Analysis" in Hinglish (Hindi written in English alphabet) for the user's spending in ${reportMonthStr}.
    
    Income: Rs. ${salary}
    Total Expenses: Rs. ${totalSpent}
    Savings: Rs. ${savings}
    
    Categories:
    ${Object.entries(categoryTotals).map(([cat, amt]) => `- ${cat}: Rs. ${amt}`).join('\n')}
    
    Task:
    1. Analyze where they wasted money (Faltu kharcha).
    2. Suggest which category they should reduce.
    3. Calculate and show them how much they could save in 1 year (saal ka itna bacha loge) if they reduced that unnecessary expense.
    4. Keep it direct, slightly funny but very professional. No markdown bold stars like **, just use plain text or hyphens for formatting since it will go into a PDF. Maximum 200 words.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent(prompt);
    const aiAnalysis = result.response.text();

    // Generate PDF
    const pdfBuffer = await generatePDFReport({
      monthYear: reportMonthStr,
      totalSpent,
      salary,
      savings,
      categoryTotals,
      aiAnalysis
    });

    // Send via Telegram
    await sendTelegramDocument(
      chatId.toString(),
      pdfBuffer,
      `ExpenseTracker_Report_${reportMonthStr}.pdf`,
      `📄 **Monthly Report is Here!**\nYe lijiye aapke ${reportMonthStr} ki fully surgical analysis aur report! Check the PDF.`
    );

    // Update settings so we don't send again
    settings.lastReportMonth = reportMonthStr;
    await settings.save();

    console.log(`Monthly PDF Report sent successfully to ${chatId}!`);
  } catch (error) {
    console.error('Failed to generate and send monthly report:', error);
  }
}
