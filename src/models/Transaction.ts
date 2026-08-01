import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  amount: number;
  category: string;
  date: string;
  description: string;
  userId: string; // Telegram user ID
  createdAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent mongoose from compiling the model multiple times during Next.js hot reloads
const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
