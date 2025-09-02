import mongoose, { Document, Schema } from "mongoose";

export interface IResult extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  caScore?: number; // Continuous Assessment score (0-100)
  finalExamScore?: number; // Final examination score (0-100)
  finalGrade?: string; // Calculated final grade (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F)
  finalPercentage: number; // Calculated final percentage
  status: "passed" | "failed" | "pending" | "incomplete";
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    caScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    finalExamScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    finalGrade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"],
    },
    finalPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["passed", "failed", "pending", "incomplete"],
      default: "pending",
    },
    remarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to ensure one result per student per course
resultSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model<IResult>("Result", resultSchema);
