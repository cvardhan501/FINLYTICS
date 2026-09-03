import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILoanPayment extends Document {
  userId: mongoose.Types.ObjectId;
  loanId: mongoose.Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoanPaymentSchema: Schema<ILoanPayment> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, default: 'UPI', trim: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const LoanPayment: Model<ILoanPayment> =
  mongoose.models.LoanPayment || mongoose.model<ILoanPayment>('LoanPayment', LoanPaymentSchema);
