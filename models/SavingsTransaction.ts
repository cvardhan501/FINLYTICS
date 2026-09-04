import mongoose, { Schema, Document, Model } from 'mongoose';

export type SavingsTransactionType = 'deposit' | 'withdrawal';

export interface ISavingsTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: SavingsTransactionType;
  amount: number;
  date: Date;
  goalId?: mongoose.Types.ObjectId;
  paymentMethod: string;
  note?: string;
  attachment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsTransactionSchema: Schema<ISavingsTransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['deposit', 'withdrawal'], required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'SavingsGoal', required: false, index: true },
    paymentMethod: { type: String, default: 'UPI', trim: true },
    note: { type: String, default: '' },
    attachment: { type: String, default: '' },
  },
  { timestamps: true }
);

SavingsTransactionSchema.index({ userId: 1, date: -1 });
SavingsTransactionSchema.index({ userId: 1, type: 1 });
SavingsTransactionSchema.index({ userId: 1, goalId: 1 });

export const SavingsTransaction: Model<ISavingsTransaction> =
  mongoose.models.SavingsTransaction ||
  mongoose.model<ISavingsTransaction>('SavingsTransaction', SavingsTransactionSchema);
