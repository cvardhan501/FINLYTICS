import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType = 'loan_due' | 'bill_due' | 'budget_warning' | 'recurring' | 'income_expected' | 'cash_flow' | 'spending_alert' | 'system';
export type NotificationCategory = 'loans' | 'bills' | 'subscriptions' | 'budgets' | 'income' | 'smart_alerts' | 'system';
export type NotificationPriority = 'info' | 'warning' | 'urgent';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  isRead: boolean;
  linkUrl?: string;
  relatedEntityType?: 'Loan' | 'BillSubscription' | 'Budget' | 'RecurringTransaction' | 'Transaction';
  relatedEntityId?: mongoose.Types.ObjectId;
  deduplicationKey?: string;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['loan_due', 'bill_due', 'budget_warning', 'recurring', 'income_expected', 'cash_flow', 'spending_alert', 'system'],
      default: 'system',
    },
    category: {
      type: String,
      enum: ['loans', 'bills', 'subscriptions', 'budgets', 'income', 'smart_alerts', 'system'],
      default: 'system',
      index: true,
    },
    priority: {
      type: String,
      enum: ['info', 'warning', 'urgent'],
      default: 'info',
    },
    isRead: { type: Boolean, default: false, index: true },
    linkUrl: { type: String, default: '' },
    relatedEntityType: { type: String, default: '' },
    relatedEntityId: { type: Schema.Types.ObjectId },
    deduplicationKey: { type: String, unique: true, sparse: true, index: true },
    scheduledFor: { type: Date, default: Date.now },
    sentAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, category: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
