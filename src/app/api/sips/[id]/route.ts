import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import SIP from '@/models/SIP';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const body = await request.json();

    const updatedSIP = await SIP.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedSIP) {
      return NextResponse.json({ error: 'SIP not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, sip: updatedSIP });
  } catch (error: any) {
    console.error('SIP Update Error:', error);
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

    const deletedSIP = await SIP.findByIdAndDelete(id);
    if (!deletedSIP) {
      return NextResponse.json({ error: 'SIP not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'SIP deleted' });
  } catch (error: any) {
    console.error('SIP Delete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
