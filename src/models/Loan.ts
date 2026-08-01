import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILoan extends Document {
  type: 'borrowed' | 'lent'; // 'borrowed' = Paise Liye, 'lent' = Paise Diye
  personName: string;
  amount: number;
  date: string;
  status: 'pending' | 'settled';
  description?: string;
  createdAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    type: { type: String, enum: ['borrowed', 'lent'], required: true },
    personName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['pending', 'settled'], default: 'pending' },
    description: { type: String },
  },
  { timestamps: true }
);

const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);

export default Loan;
