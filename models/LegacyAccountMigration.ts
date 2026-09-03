import mongoose, { Schema, Document, Model } from 'mongoose';

export type MigrationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface ILegacyAccountMigration extends Document {
  legacyUserId: string;
  newUserId: mongoose.Types.ObjectId;
  legacyUsername: string;
  status: MigrationStatus;
  migrationVersion: number;
  counts: {
    transactions: number;
    income: number;
    expenses: number;
    loans: number;
    loanPayments: number;
    budgets: number;
    categories: number;
    logs: number;
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyAccountMigrationSchema: Schema<ILegacyAccountMigration> = new Schema(
  {
    legacyUserId: { type: String, required: true, unique: true, index: true },
    newUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    legacyUsername: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'completed',
    },
    migrationVersion: { type: Number, default: 1 },
    counts: {
      transactions: { type: Number, default: 0 },
      income: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      loans: { type: Number, default: 0 },
      loanPayments: { type: Number, default: 0 },
      budgets: { type: Number, default: 0 },
      categories: { type: Number, default: 0 },
      logs: { type: Number, default: 0 },
    },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const LegacyAccountMigration: Model<ILegacyAccountMigration> =
  mongoose.models.LegacyAccountMigration ||
  mongoose.model<ILegacyAccountMigration>('LegacyAccountMigration', LegacyAccountMigrationSchema);
