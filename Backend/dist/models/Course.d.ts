import mongoose, { Document } from "mongoose";
export interface ICourse extends Document {
    title: string;
    code: string;
    description: string;
    instructor: mongoose.Types.ObjectId;
    capacity: number;
    enrolled: number;
    duration: string;
    credits: number;
    level: "beginner" | "intermediate" | "advanced";
    category: string;
    tags: string[];
    status: "active" | "inactive" | "archived";
    startDate?: Date;
    endDate?: Date;
    syllabus?: string;
    prerequisites?: string[];
    learningObjectives?: string[];
    thumbnail?: string;
    price?: number;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Course: mongoose.Model<ICourse, {}, {}, {}, mongoose.Document<unknown, {}, ICourse, {}, {}> & ICourse & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Course.d.ts.map