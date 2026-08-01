import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Goal from '@/models/Goal';
import Transaction from '@/models/Transaction';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { addAmount } = await request.json();

    const goal = await Goal.findById(id);
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (addAmount) {
      goal.currentAmount += Number(addAmount);
      await goal.save();

      // Automatically create a transaction for the saved amount to deduct it from remaining balance
      await Transaction.create({
        amount: Number(addAmount),
        category: 'Savings',
        date: new Date().toISOString().split('T')[0],
        description: `Added to Piggy Bank: ${goal.title}`,
        userId: 'system',
      });
    }

    return NextResponse.json({ ok: true, goal });
  } catch (error: any) {
    console.error('Goal Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    const deletedGoal = await Goal.findByIdAndDelete(id);
    if (!deletedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Goal deleted' });
  } catch (error: any) {
    console.error('Goal Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
