import mongoose, { Document, Types } from "mongoose";
export type MaterialFileType = "video" | "image" | "pdf" | "docx" | "other";
export interface IMaterial extends Document {
    title: string;
    description?: string;
    course: Types.ObjectId;
    uploadedBy: Types.ObjectId;
    fileUrl: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileType: MaterialFileType;
    size: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Material: mongoose.Model<IMaterial, {}, {}, {}, mongoose.Document<unknown, {}, IMaterial, {}, {}> & IMaterial & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Material.d.ts.map