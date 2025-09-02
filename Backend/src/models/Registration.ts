import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRegistration extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  status: "pending" | "enrolled" | "completed" | "dropped";
  registrationDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const registrationSchema = new Schema<IRegistration>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student is required"],
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "enrolled", "completed", "dropped"],
      default: "pending",
      required: true,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate registrations of the same student to the same course
registrationSchema.index({ student: 1, course: 1 }, { unique: true });

export const Registration = mongoose.model<IRegistration>(
  "Registration",
  registrationSchema
);

