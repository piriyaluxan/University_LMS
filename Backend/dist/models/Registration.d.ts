import mongoose, { Document, Types } from "mongoose";
export interface IRegistration extends Document {
    student: Types.ObjectId;
    course: Types.ObjectId;
    status: "pending" | "enrolled" | "completed" | "dropped";
    registrationDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Registration: mongoose.Model<IRegistration, {}, {}, {}, mongoose.Document<unknown, {}, IRegistration, {}, {}> & IRegistration & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Registration.d.ts.map