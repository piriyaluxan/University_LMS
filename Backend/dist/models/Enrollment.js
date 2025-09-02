"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Enrollment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enrollmentSchema = new mongoose_1.Schema({
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Student is required"],
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Course",
        required: [true, "Course is required"],
    },
    enrollmentDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "completed", "dropped", "suspended"],
        default: "active",
        required: true,
    },
    progress: {
        type: Number,
        default: 0,
        min: [0, "Progress cannot be negative"],
        max: [100, "Progress cannot exceed 100"],
    },
    lastAccessed: {
        type: Date,
    },
    completionDate: {
        type: Date,
    },
    grade: {
        type: String,
        enum: [
            "A+",
            "A",
            "A-",
            "B+",
            "B",
            "B-",
            "C+",
            "C",
            "C-",
            "D+",
            "D",
            "D-",
            "F",
            "P",
            "NP",
            "I",
            "W",
        ],
        trim: true,
    },
    score: {
        type: Number,
        min: [0, "Score cannot be negative"],
        max: [100, "Score cannot exceed 100"],
    },
    feedback: {
        type: String,
        trim: true,
        maxlength: [1000, "Feedback cannot exceed 1000 characters"],
    },
    certificateIssued: {
        type: Boolean,
        default: false,
    },
    certificateUrl: {
        type: String,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: 1 });
enrollmentSchema.index({ completionDate: 1 });
enrollmentSchema.virtual("duration").get(function () {
    if (!this.enrollmentDate)
        return 0;
    const endDate = this.completionDate || new Date();
    return Math.ceil((endDate.getTime() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
});
exports.Enrollment = mongoose_1.default.model("Enrollment", enrollmentSchema);
//# sourceMappingURL=Enrollment.js.map