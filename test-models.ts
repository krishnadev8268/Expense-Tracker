import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('No GEMINI_API_KEY found');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro'
];

async function testModels() {
  console.log('Testing available models with your API key...\n');
  let workingModel = null;
  
  for (const modelName of modelsToTest) {
    try {
      process.stdout.write(`Testing ${modelName}... `);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say hi');
      const text = result.response.text();
      console.log(`✅ Success! (Response: ${text.trim()})`);
      if (!workingModel) workingModel = modelName;
    } catch (e: any) {
      console.log(`❌ Failed: ${e.message.split('\\n')[0]}`);
    }
  }
  
  if (workingModel) {
    console.log(`\n=> First working model found: ${workingModel}`);
  } else {
    console.log('\n=> No working models found in the list.');
  }
}

testModels();
