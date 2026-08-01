import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Loan from '@/models/Loan';

export async function GET() {
  try {
    await connectToDatabase();
    const loans = await Loan.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(loans);
  } catch (error: any) {
    console.error('Loans GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newLoan = await Loan.create(body);
    return NextResponse.json({ ok: true, loan: newLoan });
  } catch (error: any) {
    console.error('Loans POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
