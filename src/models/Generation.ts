import mongoose, { Schema, type Document } from 'mongoose';

export interface IGeneration extends Document {
  code: string;        // flexible: H1, H2, H1a, H2b, etc.
  nameJa: string;
  nameEn: string;
  description: string;
  releaseDate: Date;
  isActive: boolean;
}

const GenerationSchema = new Schema<IGeneration>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    nameJa: {
      type: String,
      required: true,
      trim: true,
    },
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Generation =
  mongoose.models.Generation ||
  mongoose.model<IGeneration>('Generation', GenerationSchema);
export default Generation;
