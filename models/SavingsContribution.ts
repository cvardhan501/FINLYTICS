import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISavingsContribution extends Document {
  userId: mongoose.Types.ObjectId;
  goalId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  paymentMethod: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsContributionSchema: Schema<ISavingsContribution> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'SavingsGoal', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    paymentMethod: { type: String, default: 'UPI', trim: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export const SavingsContribution: Model<ISavingsContribution> =
  mongoose.models.SavingsContribution ||
  mongoose.model<ISavingsContribution>('SavingsContribution', SavingsContributionSchema);
