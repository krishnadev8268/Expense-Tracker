import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';
import Transaction from '@/models/Transaction';
import { appendRowToSheet } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function sendTelegramMessage(chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function GET(req: Request) {
  try {
    // Check Authorization header for Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectToDatabase();
    
    // We need to know who to send the message to.
    // For a single-user app, we can just find any transaction and use its userId as the chat ID, 
    // or hardcode the chat ID if it's available. The best way is to fetch the first transaction's userId 
    // if it's numeric (Telegram ID).
    const anyTx = await Transaction.findOne({ userId: { $regex: /^[0-9]+$/ } });
    const chatId = anyTx ? anyTx.userId : null;

    const settings = await Settings.findOne();
    if (!settings) {
      return NextResponse.json({ ok: true, msg: 'No settings found' });
    }

    const today = new Date();
    // Use IST timezone for dates
    const istDateString = today.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istDate = new Date(istDateString);
    
    const dayOfMonth = istDate.getDate();
    const currentMonth = `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}`;
    const fullDate = `${currentMonth}-${String(dayOfMonth).padStart(2, '0')}`;

    let processedCount = 0;
    let addedMsg = "";

    // Process Recurring Expenses
    if (settings.recurringExpenses && settings.recurringExpenses.length > 0) {
      const expensesToProcess = settings.recurringExpenses.filter((r: any) => 
        r.dayOfMonth === dayOfMonth && r.lastProcessedMonth !== currentMonth
      );

      for (const expense of expensesToProcess) {
        // Create Transaction
        await Transaction.create({
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          date: fullDate,
          userId: 'system-recurring'
        });

        // Sync to Sheets
        appendRowToSheet({
          amount: expense.amount,
          category: expense.category,
          date: fullDate,
          description: expense.description,
          source: 'Auto-Recurring'
        });

        // Mark as processed
        expense.lastProcessedMonth = currentMonth;
        processedCount++;
        addedMsg += `\n- ₹${expense.amount} for ${expense.description}`;
      }

      if (processedCount > 0) {
        await settings.save();
        if (chatId) {
          await sendTelegramMessage(chatId, `🤖 *Auto-Pilot Update*\nMaine aaj ke Fixed Expenses daal diye hain:${addedMsg}`);
        }
      }
    }

    // Send Nightly Reminder (Only send if it's evening, e.g. 9 PM IST)
    const currentHourIST = istDate.getHours();
    if (currentHourIST >= 20 && currentHourIST <= 22) {
      if (chatId) {
        await sendTelegramMessage(chatId, `🌙 Boss, din bhar me aaj koi aur kharcha hua jo aapne nahi likha? Mujhe abhi Voice note me bata do ya Photo bhej do, main sambhal lunga!`);
      }
    }

    return NextResponse.json({ ok: true, processedCount });
  } catch (error: any) {
    console.error('Cron daily error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
