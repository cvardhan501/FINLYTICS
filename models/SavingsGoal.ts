import mongoose, { Schema, Document, Model } from 'mongoose';

export type GoalPriority = 'low' | 'medium' | 'high';
export type GoalStatus = 'active' | 'completed' | 'overdue';

export interface ISavingsGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category?: string;
  priority?: GoalPriority;
  notes?: string;
  status: GoalStatus;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema: Schema<ISavingsGoal> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, default: 0, min: 0 },
    targetDate: { type: Date, required: true },
    category: { type: String, default: 'General' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'completed', 'overdue'], default: 'active' },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SavingsGoal: Model<ISavingsGoal> =
  mongoose.models.SavingsGoal || mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);
