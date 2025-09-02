import mongoose, { Document, Types } from "mongoose";
export interface IAssignment extends Document {
    title: string;
    description?: string;
    course: Types.ObjectId;
    dueDate?: Date;
    createdBy: Types.ObjectId;
    attachmentUrl?: string;
    attachmentName?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Assignment: mongoose.Model<IAssignment, {}, {}, {}, mongoose.Document<unknown, {}, IAssignment, {}, {}> & IAssignment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Assignment.d.ts.map