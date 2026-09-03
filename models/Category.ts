import mongoose, { Schema, Document, Model } from 'mongoose';

export type CategoryType = 'expense' | 'income';

export interface ICategory extends Document {
  userId?: mongoose.Types.ObjectId; // null for system defaults
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
    icon: { type: String, default: 'tag' },
    color: { type: String, default: '#187A4E' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, type: 1 });

export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
