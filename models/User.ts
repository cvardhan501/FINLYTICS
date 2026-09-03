import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  currency: string;
  timezone: string;
  preferences: {
    darkMode: boolean;
    compactView: boolean;
  };
  notificationSettings: {
    email: boolean;
    loanReminders: boolean;
    billReminders: boolean;
    subscriptionReminders: boolean;
    recurringAlerts: boolean;
    incomeReminders: boolean;
    budgetAlerts: boolean;
    overdueAlerts: boolean;
    smartSpendingAlerts: boolean;
    aiInsights: boolean;
    reminderDays: number[];
    preferredTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    preferences: {
      darkMode: { type: Boolean, default: false },
      compactView: { type: Boolean, default: false },
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      loanReminders: { type: Boolean, default: true },
      billReminders: { type: Boolean, default: true },
      subscriptionReminders: { type: Boolean, default: true },
      recurringAlerts: { type: Boolean, default: true },
      incomeReminders: { type: Boolean, default: true },
      budgetAlerts: { type: Boolean, default: true },
      overdueAlerts: { type: Boolean, default: true },
      smartSpendingAlerts: { type: Boolean, default: true },
      aiInsights: { type: Boolean, default: true },
      reminderDays: { type: [Number], default: [7, 3, 1, 0] },
      preferredTime: { type: String, default: '09:00 AM' },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
