import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET() {
  try {
    await connectToDatabase();
    
    const transactions = await Transaction.find().sort({ date: -1 }).lean();
    
    // Create CSV Header
    let csvData = "Date,Description,Category,Amount\n";
    
    // Create CSV Rows
    transactions.forEach(t => {
      // Escape commas in description
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const date = new Date(t.date).toLocaleDateString('en-IN');
      csvData += `${date},${desc},${t.category},${t.amount}\n`;
    });

    const response = new NextResponse(csvData);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="expenses_report.csv"');
    
    return response;
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
