import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPerson extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonSchema: Schema<IPerson> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PersonSchema.index({ userId: 1, name: 1 });

export const Person: Model<IPerson> = mongoose.models.Person || mongoose.model<IPerson>('Person', PersonSchema);
