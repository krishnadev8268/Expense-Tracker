import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IGoal extends Document {
  title: string;
  targetAmount: number;
  currentAmount: number;
}

const GoalSchema = new Schema<IGoal>(
  {
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);

export default Goal;
