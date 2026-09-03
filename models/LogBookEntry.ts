import mongoose, { Schema, Document, Model } from 'mongoose';

export type LogCategory = 'personal' | 'financial' | 'loan' | 'goal' | 'reminder' | 'other';

export interface ILogBookEntry extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  date: Date;
  category: LogCategory;
  linkedTransactionId?: mongoose.Types.ObjectId;
  linkedLoanId?: mongoose.Types.ObjectId;
  attachmentUrl?: string;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LogBookEntrySchema: Schema<ILogBookEntry> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    category: {
      type: String,
      enum: ['personal', 'financial', 'loan', 'goal', 'reminder', 'other'],
      default: 'financial',
    },
    linkedTransactionId: { type: Schema.Types.ObjectId, ref: 'Transaction' },
    linkedLoanId: { type: Schema.Types.ObjectId, ref: 'Loan' },
    attachmentUrl: { type: String, default: '' },
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LogBookEntrySchema.index({ userId: 1, date: -1 });

export const LogBookEntry: Model<ILogBookEntry> =
  mongoose.models.LogBookEntry || mongoose.model<ILogBookEntry>('LogBookEntry', LogBookEntrySchema);
