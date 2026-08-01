import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SIP from '@/models/SIP';

export async function GET() {
  try {
    await connectToDatabase();
    const sips = await SIP.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(sips);
  } catch (error: any) {
    console.error('SIPs GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newSIP = await SIP.create(body);
    return NextResponse.json({ ok: true, sip: newSIP });
  } catch (error: any) {
    console.error('SIPs POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
