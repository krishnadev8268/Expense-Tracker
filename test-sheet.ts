import { appendRowToSheet } from './src/lib/googleSheets';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSheet() {
  console.log('Testing sheet sync...');
  await appendRowToSheet({
    amount: 100,
    category: 'Rent',
    date: '2026-08-03',
    description: 'test rent',
    source: 'Telegram'
  });
  console.log('Done testing.');
}

testSheet();
