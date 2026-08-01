import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISIP extends Document {
  fundName: string;
  amount: number;
  deductionDate: number; // 1 to 31
  lastProcessedMonth: string; // e.g. "2026-08" to track if it was deducted this month
  isActive: boolean;
}

const SIPSchema = new Schema<ISIP>(
  {
    fundName: { type: String, required: true },
    amount: { type: Number, required: true },
    deductionDate: { type: Number, required: true, min: 1, max: 31 },
    lastProcessedMonth: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const SIP: Model<ISIP> = mongoose.models.SIP || mongoose.model<ISIP>('SIP', SIPSchema);

export default SIP;
