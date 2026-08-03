import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function appendRowToSheet(data: {
  amount: number;
  category: string;
  date: string;
  description: string;
  source: string;
}) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!sheetId || !clientEmail || !privateKey) {
      console.warn('Google Sheets API credentials missing. Skipping sheet sync.');
      return;
    }

    // Initialize auth
    const serviceAccountAuth = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    await doc.loadInfo(); // loads document properties and worksheets

    // Determine the month tab name (e.g. "August 2026")
    const dateObj = new Date(data.date);
    const tabName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

    let sheet = doc.sheetsByTitle[tabName];

    // If the tab doesn't exist, create it with headers
    if (!sheet) {
      sheet = await doc.addSheet({ title: tabName, headerValues: ['Date', 'Category', 'Description', 'Amount', 'Source', 'Timestamp'] });
    }

    // Append the row
    await sheet.addRow({
      Date: data.date,
      Category: data.category,
      Description: data.description,
      Amount: data.amount,
      Source: data.source,
      Timestamp: new Date().toISOString()
    });

    console.log(`Successfully synced expense to Google Sheet: ${tabName}`);
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
  }
}
