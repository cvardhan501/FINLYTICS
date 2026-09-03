import mongoose, { Schema, Document, Model } from 'mongoose';

export type AccountType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'debit_card' | 'savings' | 'custom';

export interface IAccount extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isDefault: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema: Schema<IAccount> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['cash', 'bank', 'upi', 'credit_card', 'debit_card', 'savings', 'custom'],
      default: 'bank',
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    isDefault: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, name: 1 });

export const Account: Model<IAccount> = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
