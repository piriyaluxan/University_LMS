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
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const courseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Course title is required"],
        trim: true,
        maxlength: [200, "Course title cannot be more than 200 characters"],
    },
    code: {
        type: String,
        required: [true, "Course code is required"],
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [20, "Course code cannot be more than 20 characters"],
    },
    description: {
        type: String,
        required: [true, "Course description is required"],
        trim: true,
        maxlength: [
            1000,
            "Course description cannot be more than 1000 characters",
        ],
    },
    instructor: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Instructor is required"],
    },
    capacity: {
        type: Number,
        required: [true, "Course capacity is required"],
        min: [1, "Capacity must be at least 1"],
        max: [1000, "Capacity cannot exceed 1000"],
    },
    enrolled: {
        type: Number,
        default: 0,
        min: [0, "Enrolled count cannot be negative"],
    },
    duration: {
        type: String,
        required: [true, "Course duration is required"],
        trim: true,
    },
    credits: {
        type: Number,
        required: [true, "Course credits are required"],
        min: [1, "Credits must be at least 1"],
        max: [30, "Credits cannot exceed 30"],
    },
    level: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "beginner",
        required: true,
    },
    category: {
        type: String,
        required: [true, "Course category is required"],
        trim: true,
    },
    tags: [
        {
            type: String,
            trim: true,
        },
    ],
    status: {
        type: String,
        enum: ["active", "inactive", "archived"],
        default: "active",
        required: true,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    syllabus: {
        type: String,
        trim: true,
    },
    prerequisites: [
        {
            type: String,
            trim: true,
        },
    ],
    learningObjectives: [
        {
            type: String,
            trim: true,
        },
    ],
    thumbnail: {
        type: String,
    },
    price: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: 0,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
courseSchema.virtual("enrollmentPercentage").get(function () {
    return this.capacity > 0
        ? Math.round((this.enrolled / this.capacity) * 100)
        : 0;
});
courseSchema.virtual("availableSpots").get(function () {
    return Math.max(0, this.capacity - this.enrolled);
});
courseSchema.virtual("enrollmentStatus").get(function () {
    if (this.enrolled >= this.capacity)
        return "full";
    if (this.enrolled >= this.capacity * 0.8)
        return "almost-full";
    return "available";
});
courseSchema.index({ code: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: "text", description: "text" });
courseSchema.pre("save", function (next) {
    if (this.enrolled > this.capacity) {
        this.enrolled = this.capacity;
    }
    next();
});
exports.Course = mongoose_1.default.model("Course", courseSchema);
//# sourceMappingURL=Course.js.map