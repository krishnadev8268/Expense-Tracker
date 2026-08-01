import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const token = process.env.TELEGRAM_BOT_TOKEN;
console.log('Token exists:', !!token);
console.log('Token length:', token ? token.length : 0);
console.log('Token starts with:', token ? token.substring(0, 5) : 'null');
