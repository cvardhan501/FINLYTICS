import mongoose, { Schema, Document, Model } from 'mongoose';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IRecurringTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  account: string;
  frequency: RecurringFrequency;
  startDate: Date;
  nextRunDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTransactionSchema: Schema<IRecurringTransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ['expense', 'income'], required: true },
    category: { type: String, required: true },
    account: { type: String, default: 'Bank' },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' },
    startDate: { type: Date, required: true },
    nextRunDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const RecurringTransaction: Model<IRecurringTransaction> =
  mongoose.models.RecurringTransaction ||
  mongoose.model<IRecurringTransaction>('RecurringTransaction', RecurringTransactionSchema);
