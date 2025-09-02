import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISubmission extends Document {
  assignment: Types.ObjectId;
  student: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  submittedAt: Date;
  grade?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now, required: true },
    grade: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmission>(
  "Submission",
  submissionSchema
);

