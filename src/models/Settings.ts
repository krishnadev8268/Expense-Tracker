import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ICategoryBudget {
  category: string;
  limit: number;
}

export interface ISettings extends Document {
  monthlySalary: number;
  categoryBudgets: ICategoryBudget[];
  lastReportMonth: string;
  assets: { name: string; value: number }[];
}

const CategoryBudgetSchema = new Schema<ICategoryBudget>({
  category: { type: String, required: true },
  limit: { type: Number, required: true },
});

const SettingsSchema = new Schema<ISettings>(
  {
    monthlySalary: { type: Number, default: 0 },
    categoryBudgets: { type: [CategoryBudgetSchema], default: [] },
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
