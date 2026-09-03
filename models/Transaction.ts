import mongoose, { Schema, Document, Model } from 'mongoose';

export type TransactionType = 'expense' | 'income';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  category: string; // name or icon tag
  categoryId?: mongoose.Types.ObjectId;
  account: string; // e.g. Cash, Bank, UPI
  accountId?: mongoose.Types.ObjectId;
  paymentMethod: string;
  date: Date;
  time?: string;
  description: string;
  notes?: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    account: { type: String, default: 'Bank', trim: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    paymentMethod: { type: String, default: 'UPI', trim: true },
    date: { type: Date, required: true, index: true },
    time: { type: String, default: '12:00' },
    description: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    isRecurring: { type: Boolean, default: false },
    recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringTransaction' },
  },
  { timestamps: true }
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, category: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
