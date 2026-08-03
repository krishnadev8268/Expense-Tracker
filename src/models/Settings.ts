import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategoryBudget {
  category: string;
  limit: number;
}

export interface IRecurringExpense {
  amount: number;
  category: string;
  description: string;
  dayOfMonth: number;
  lastProcessedMonth: string;
}

export interface ISettings extends Document {
  monthlySalary: number;
  categoryBudgets: ICategoryBudget[];
  recurringExpenses: IRecurringExpense[];
  lastReportMonth: string;
  assets: { name: string; value: number }[];
}

const CategoryBudgetSchema = new Schema<ICategoryBudget>({
  category: { type: String, required: true },
  limit: { type: Number, required: true },
});

const RecurringExpenseSchema = new Schema<IRecurringExpense>({
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  dayOfMonth: { type: Number, required: true, min: 1, max: 31 },
  lastProcessedMonth: { type: String, default: '' },
});

const SettingsSchema = new Schema<ISettings>(
  {
    monthlySalary: { type: Number, default: 0 },
    categoryBudgets: { type: [CategoryBudgetSchema], default: [] },
    recurringExpenses: { type: [RecurringExpenseSchema], default: [] },
    lastReportMonth: { type: String, default: '' },
    assets: {
      type: [
        {
          name: { type: String, required: true },
          value: { type: Number, required: true },
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

// We use a singleton pattern for Settings
const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
