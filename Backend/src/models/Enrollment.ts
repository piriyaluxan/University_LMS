import mongoose, { Document, Schema } from "mongoose";

export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  status: "active" | "completed" | "dropped" | "suspended";
  progress: number;
  lastAccessed?: Date;
  completionDate?: Date;
  grade?: string;
  score?: number;
  feedback?: string;
  certificateIssued?: boolean;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "dropped", "suspended"],
      default: "active",
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: [0, "Progress cannot be negative"],
      max: [100, "Progress cannot exceed 100"],
    },
    lastAccessed: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    grade: {
      type: String,
      enum: [
        "A+",
        "A",
        "A-",
        "B+",
        "B",
        "B-",
        "C+",
        "C",
        "C-",
        "D+",
        "D",
        "D-",
        "F",
        "P",
        "NP",
        "I",
        "W",
      ],
      trim: true,
    },
    score: {
      type: Number,
      min: [0, "Score cannot be negative"],
      max: [100, "Score cannot exceed 100"],
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    certificateIssued: {
      type: Boolean,
      default: false,
    },
    certificateUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index to prevent duplicate enrollments
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Indexes for better query performance
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });
enrollmentSchema.index({ completionDate: 1 });

// Virtual for enrollment duration
enrollmentSchema.virtual("duration").get(function () {
  if (!this.enrollmentDate) return 0;
  const endDate = this.completionDate || new Date();
  return Math.ceil(
    (endDate.getTime() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
});

export const Enrollment = mongoose.model<IEnrollment>(
  "Enrollment",
  enrollmentSchema
);
