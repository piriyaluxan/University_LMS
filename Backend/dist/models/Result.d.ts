import mongoose, { Document } from "mongoose";
export interface IResult extends Document {
    student: mongoose.Types.ObjectId;
    course: mongoose.Types.ObjectId;
    caScore?: number;
    finalExamScore?: number;
    finalGrade?: string;
    finalPercentage: number;
    status: "passed" | "failed" | "pending" | "incomplete";
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IResult, {}, {}, {}, mongoose.Document<unknown, {}, IResult, {}, {}> & IResult & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Result.d.ts.map