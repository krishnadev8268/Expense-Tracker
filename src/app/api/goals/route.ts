import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Goal from '@/models/Goal';

export async function GET() {
  try {
    await connectToDatabase();
    const goals = await Goal.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(goals);
  } catch (error: any) {
    console.error('Goals GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newGoal = await Goal.create(body);
    return NextResponse.json({ ok: true, goal: newGoal });
  } catch (error: any) {
    console.error('Goals POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
