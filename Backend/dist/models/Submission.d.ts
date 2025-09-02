import mongoose, { Document, Types } from "mongoose";
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
export declare const Submission: mongoose.Model<ISubmission, {}, {}, {}, mongoose.Document<unknown, {}, ISubmission, {}, {}> & ISubmission & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Submission.d.ts.map