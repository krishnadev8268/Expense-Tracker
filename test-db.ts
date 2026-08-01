import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  try {
    console.log('⏳ Attempting to connect to MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ MongoDB Cluster successfully connected!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to connect to MongoDB cluster:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();
