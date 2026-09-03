import mongoose, { Schema, Document, Model } from 'mongoose';

export type LoanDirection = 'given' | 'borrowed';
export type InterestType = 'simple' | 'compound';
export type CompoundingFrequency = 'annual' | 'half_yearly' | 'quarterly' | 'monthly';
export type LoanStatus = 'active' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface ILoan extends Document {
  userId: mongoose.Types.ObjectId;
  personName: string;
  personId?: mongoose.Types.ObjectId;
  type: LoanDirection; // 'given' = Money given to person, 'borrowed' = Money borrowed from person
  principal: number;
  interestRate: number; // percentage per annum e.g. 12
  interestType: InterestType;
  compoundingFrequency?: CompoundingFrequency;
  startDate: Date;
  dueDate: Date;
  durationMonths?: number;
  notes?: string;
  documentUrl?: string;
  status: LoanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema<ILoan> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    personName: { type: String, required: true, trim: true },
    personId: { type: Schema.Types.ObjectId, ref: 'Person' },
    type: { type: String, enum: ['given', 'borrowed'], required: true },
    principal: { type: Number, required: true, min: 1 },
    interestRate: { type: Number, default: 0, min: 0 },
    interestType: { type: String, enum: ['simple', 'compound'], default: 'simple' },
    compoundingFrequency: {
      type: String,
      enum: ['annual', 'half_yearly', 'quarterly', 'monthly'],
      default: 'annual',
    },
    startDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    durationMonths: { type: Number, default: 12 },
    notes: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

LoanSchema.index({ userId: 1, type: 1, status: 1 });

export const Loan: Model<ILoan> = mongoose.models.Loan || mongoose.model<ILoan>('Loan', LoanSchema);
