import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

const models = [
  'gemini-2.0-flash-lite-001',
  'gemini-2.0-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-pro',
  'gemini-2.5-flash-lite'
];

async function testModels() {
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('hi');
      console.log(`✅ SUCCESS: ${modelName} - ${result.response.text()}`);
    } catch (e: any) {
      console.log(`❌ FAILED: ${modelName} - ${e.message.substring(0, 150)}`);
    }
  }
}

testModels();
