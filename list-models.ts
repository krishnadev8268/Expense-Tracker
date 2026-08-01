import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
  .then(res => res.json())
  .then(data => {
    const flashModels = data.models.filter((m: any) => m.name.includes('flash')).map((m: any) => m.name);
    console.log('Available Flash Models:', flashModels);
  });
