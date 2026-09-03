import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  period: 'monthly' | 'custom';
  category?: string; // Optional: empty means total monthly budget
  categoryId?: mongoose.Types.ObjectId;
  warningThreshold: number; // e.g. 80 for 80%
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema<IBudget> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    period: { type: String, enum: ['monthly', 'custom'], default: 'monthly' },
    category: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    warningThreshold: { type: Number, default: 80 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, category: 1 });

export const Budget: Model<IBudget> = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
