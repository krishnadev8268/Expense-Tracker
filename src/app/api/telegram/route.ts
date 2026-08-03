import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Settings from '@/models/Settings';
import Loan from '@/models/Loan';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { appendRowToSheet } from '@/lib/googleSheets';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Helper to send messages back to the user via Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// Helper to get a file buffer from Telegram
async function getTelegramFileBuffer(fileId: string): Promise<ArrayBuffer> {
  // 1. Get file path
  const fileUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${fileId}`;
  const fileRes = await fetch(fileUrl);
  const fileData = await fileRes.json();
  
  if (!fileData.ok) {
    throw new Error('Failed to get file from Telegram');
  }
  
  const filePath = fileData.result.file_path;
  
  // 2. Download file
  const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
  const downloadRes = await fetch(downloadUrl);
  const arrayBuffer = await downloadRes.arrayBuffer();
  return arrayBuffer;
}

// Helper to transcribe audio using Groq Whisper
async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer]), 'audio.oga');
  formData.append('model', 'whisper-large-v3');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Groq API Error:', errorText);
    throw new Error('Failed to transcribe audio');
  }

  const data = await res.json();
  return data.text;
}

// Helper to extract JSON data using Gemini
async function extractDataWithGemini(text: string, imageBuffer?: ArrayBuffer): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Extract the expense information from the following input and return ONLY a valid JSON object with this exact structure, with no markdown formatting or extra text: { "amount": Number, "category": String, "date": "YYYY-MM-DD", "description": String, "splitWith": String | null }. If the user mentions splitting the bill with someone (e.g. "split with Rahul"), set splitWith to that person's name, otherwise null. If the date is not clear, use today's date: ${new Date().toISOString().split('T')[0]}. Text: "${text}"`;

  const contents: any[] = [prompt];

  if (imageBuffer) {
    contents.unshift({
      inlineData: {
        data: Buffer.from(imageBuffer).toString('base64'),
        mimeType: 'image/jpeg',
      },
    });
  }

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: contents.map(c => typeof c === 'string' ? { text: c } : c) }],
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
  
  const responseText = result.response.text();
  console.log("Raw Gemini Response:", responseText);
  
  try {
    const parsed = JSON.parse(responseText.trim());
    console.log("Parsed Gemini Response:", parsed);
    // Ensure fallback for missing fields to avoid Mongoose validation errors
    return {
      amount: parsed.amount || parsed.Amount || 0,
      category: parsed.category || parsed.Category || 'Miscellaneous',
      date: parsed.date || parsed.Date || new Date().toISOString().split('T')[0],
      description: parsed.description || parsed.Description || text,
      splitWith: parsed.splitWith || parsed.SplitWith || null,
    };
  } catch (e) {
    console.error('Failed to parse Gemini output:', responseText);
    throw new Error('Failed to extract valid JSON from Gemini');
  }
}

export async function POST(req: Request) {
  let chatId: number | null = null;
  try {
    const update = await req.json();
    
    // Ignore updates that aren't messages
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    chatId = message.chat.id;
    const userId = message.from.id.toString();

    let extractedText = '';
    let imageBuffer: ArrayBuffer | undefined;

    if (message.text) {
      // 1. Handle Text
      extractedText = message.text;
    } else if (message.voice) {
      // 2. Handle Voice
      await sendTelegramMessage(chatId, "Processing your voice note...");
      const fileId = message.voice.file_id;
      const audioBuffer = await getTelegramFileBuffer(fileId);
      extractedText = await transcribeAudio(audioBuffer);
    } else if (message.photo && message.photo.length > 0) {
      // 3. Handle Photo (take the highest resolution which is the last one in the array)
      await sendTelegramMessage(chatId, "Analyzing your receipt...");
      const fileId = message.photo[message.photo.length - 1].file_id;
      imageBuffer = await getTelegramFileBuffer(fileId);
      extractedText = message.caption || ''; // Use caption if available
    } else {
      await sendTelegramMessage(chatId, "Please send text, a voice note, or an image.");
      return NextResponse.json({ ok: true });
    }

    if (extractedText && !imageBuffer) {
       await sendTelegramMessage(chatId, `Understood: "${extractedText}". Extracting details...`);
    }

    // Process with Gemini
    const expenseData = await extractDataWithGemini(extractedText, imageBuffer);

    // Save to MongoDB
    await connectToDatabase();
    
    // If splitWith is provided, halve the expense and create a Loan
    let finalAmount = expenseData.amount;
    let splitMsg = '';
    
    if (expenseData.splitWith) {
      finalAmount = expenseData.amount / 2;
      splitMsg = `\n*(Split with ${expenseData.splitWith}: ₹${finalAmount} added to Udhari)*`;
      
      await Loan.create({
        type: 'lent',
        personName: expenseData.splitWith,
        amount: finalAmount,
        date: expenseData.date,
        description: `Split for: ${expenseData.description}`,
        status: 'pending'
      });
    }

    const newTransaction = await Transaction.create({
      amount: finalAmount,
      category: expenseData.category,
      date: expenseData.date,
      description: expenseData.description,
      userId: userId,
    });

    const successMsg = `✅ Expense Added!${splitMsg}\n\nAmount: ₹${newTransaction.amount}\nCategory: ${newTransaction.category}\nDate: ${newTransaction.date}\nDescription: ${newTransaction.description}`;
    await sendTelegramMessage(chatId, successMsg);

    // Fire and forget sheet sync
    appendRowToSheet({
      amount: newTransaction.amount,
      category: newTransaction.category,
      date: newTransaction.date,
      description: newTransaction.description,
      source: 'Telegram Bot'
    });

    // Overspend Alert Logic
    try {
      const settings = await Settings.findOne();
      if (settings && settings.categoryBudgets) {
        // Find if this category has a budget
        // Using a case-insensitive check to be safe
        const budgetObj = settings.categoryBudgets.find((b: any) => 
          b.category.trim().toLowerCase() === newTransaction.category.trim().toLowerCase()
        );
        
        if (budgetObj && budgetObj.limit > 0) {
          // Calculate total spend for this category in current month
          const currentMonth = new Date().getMonth();
          const currentYear = new Date().getFullYear();
          
          // Format as YYYY-MM-DD avoiding timezone offset issues
          const startStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
          const endStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-31`; // simplified end of month

          const categoryExpenses = await Transaction.aggregate([
            {
              $match: {
                // Case insensitive match
                category: { $regex: new RegExp(`^${newTransaction.category.trim()}$`, 'i') },
                date: { $gte: startStr, $lte: endStr }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' }
              }
            }
          ]);

          const totalSpent = categoryExpenses.length > 0 ? categoryExpenses[0].total : 0;

          if (totalSpent > budgetObj.limit) {
            const alertMsg = `🚨 OVERSPEND ALERT 🚨\n\nYou have exceeded your monthly budget for *${budgetObj.category}*!\n\nLimit: ₹${budgetObj.limit}\nSpent: ₹${totalSpent}\nOverspent by: ₹${(totalSpent - budgetObj.limit).toFixed(2)}`;
            await sendTelegramMessage(chatId, alertMsg);
          }
        }
      }
    } catch (budgetError) {
      console.error('Failed to check budget for alerts:', budgetError);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    
    if (chatId) {
      try {
        await sendTelegramMessage(chatId, `❌ Sorry, an error occurred: ${error.message}`);
      } catch (e) {
        console.error('Failed to send error message to Telegram:', e);
      }
    }
    
    // Always return 200 to Telegram so it doesn't endlessly retry the webhook
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
