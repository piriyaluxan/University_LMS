import mongoose, { Document } from "mongoose";
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
export declare const Enrollment: mongoose.Model<IEnrollment, {}, {}, {}, mongoose.Document<unknown, {}, IEnrollment, {}, {}> & IEnrollment & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Enrollment.d.ts.map