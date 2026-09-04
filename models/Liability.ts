import mongoose, { Schema, Document } from 'mongoose';

export type LiabilityType =
  | 'money_borrowed'
  | 'credit_card'
  | 'personal_loan'
  | 'vehicle_loan'
  | 'education_loan'
  | 'other';

export interface ILiability extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: LiabilityType;
  amount: number;
  date: Date;
  notes?: string;
  attachment?: string;
  loanId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LiabilitySchema: Schema<ILiability> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'money_borrowed',
        'credit_card',
        'personal_loan',
        'vehicle_loan',
        'education_loan',
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

LiabilitySchema.index({ userId: 1, date: -1 });
LiabilitySchema.index({ userId: 1, type: 1 });

export const Liability =
  mongoose.models.Liability || mongoose.model<ILiability>('Liability', LiabilitySchema);

