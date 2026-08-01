import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ monthlySalary: 0, categoryBudgets: [] });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    let settings = await Settings.findOneAndUpdate(
      {},
      { 
        $set: {
          ...(body.monthlySalary !== undefined && { monthlySalary: body.monthlySalary }),
          ...(body.categoryBudgets !== undefined && { categoryBudgets: body.categoryBudgets }),
          ...(body.assets !== undefined && { assets: body.assets })
        }
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({ ok: true, settings });
  } catch (error: any) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
