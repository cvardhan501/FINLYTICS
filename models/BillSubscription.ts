import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  amount: number;
  dueDate: Date;
  isSubscription: boolean;
  frequency: 'monthly' | 'yearly' | 'custom';
  status: 'unpaid' | 'paid' | 'overdue';
  account?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillSubscriptionSchema: Schema<IBillSubscription> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    dueDate: { type: Date, required: true, index: true },
    isSubscription: { type: Boolean, default: false },
    frequency: { type: String, enum: ['monthly', 'yearly', 'custom'], default: 'monthly' },
    status: { type: String, enum: ['unpaid', 'paid', 'overdue'], default: 'unpaid' },
    account: { type: String, default: 'Bank' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BillSubscription: Model<IBillSubscription> =
  mongoose.models.BillSubscription || mongoose.model<IBillSubscription>('BillSubscription', BillSubscriptionSchema);
