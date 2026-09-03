import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILegacyUser extends Document {
  username: string;
  passwordHash: string;
  name?: string;
  isMigrated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LegacyUserSchema: Schema<ILegacyUser> = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Legacy User' },
    isMigrated: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const LegacyUser: Model<ILegacyUser> =
  mongoose.models.LegacyUser || mongoose.model<ILegacyUser>('LegacyUser', LegacyUserSchema);
