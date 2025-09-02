import mongoose, { Document, Schema, Types } from "mongoose";

export type MaterialFileType = "video" | "image" | "pdf" | "docx" | "other";

export interface IMaterial extends Document {
  title: string;
  description?: string;
  course: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  fileUrl: string; // served via /uploads
  fileName: string; // stored filename on disk
  originalName: string;
  mimeType: string;
  fileType: MaterialFileType;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileType: {
      type: String,
      enum: ["video", "image", "pdf", "docx", "other"],
      default: "other",
    },
    size: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Material = mongoose.model<IMaterial>("Material", materialSchema);

