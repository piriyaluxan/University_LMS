import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  description?: string;
  course: Types.ObjectId;
  dueDate?: Date;
  createdBy: Types.ObjectId; // instructor/admin
  attachmentUrl?: string; // optional reference document
  attachmentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    dueDate: { type: Date },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    attachmentUrl: { type: String },
    attachmentName: { type: String },
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignment>(
  "Assignment",
  assignmentSchema
);

