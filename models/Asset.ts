import mongoose, { Schema, Document } from 'mongoose';

export type AssetType =
  | 'cash'
  | 'bank'
  | 'upi'
  | 'investment'
  | 'gold'
  | 'property'
  | 'vehicle'
  | 'money_given'
  | 'other';

export interface IAsset extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: AssetType;
  amount: number;
  date: Date;
  notes?: string;
  attachment?: string;
  loanId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema<IAsset> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'cash',
        'bank',
        'upi',
        'investment',
        'gold',
        'property',
        'vehicle',
        'money_given',
        'other',
      ],
      default: 'other',
    },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    attachment: { type: String, default: '' },
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', default: null },
  },
  { timestamps: true }
);

export const Asset = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
