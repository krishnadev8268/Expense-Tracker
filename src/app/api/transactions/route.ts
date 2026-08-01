import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    // Create new transaction
    // userId is required by schema, we will default to "web-manual" for UI-added transactions
    const newTx = await Transaction.create({
      amount: body.amount,
      category: body.category,
      description: body.description,
      date: body.date,
      userId: 'web-manual'
    });

    return NextResponse.json({ ok: true, transaction: newTx });
  } catch (error: any) {
    console.error('Transactions POST Error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
