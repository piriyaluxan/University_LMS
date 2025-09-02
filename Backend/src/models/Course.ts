import mongoose, { Document, Schema } from "mongoose";

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

const courseSchema = new Schema<ICourse>(
  {
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
      type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for enrollment percentage
courseSchema.virtual("enrollmentPercentage").get(function () {
  return this.capacity > 0
    ? Math.round((this.enrolled / this.capacity) * 100)
    : 0;
});

// Virtual for available spots
courseSchema.virtual("availableSpots").get(function () {
  return Math.max(0, this.capacity - this.enrolled);
});

// Virtual for course status based on enrollment
courseSchema.virtual("enrollmentStatus").get(function () {
  if (this.enrolled >= this.capacity) return "full";
  if (this.enrolled >= this.capacity * 0.8) return "almost-full";
  return "available";
});

// Indexes for better query performance
courseSchema.index({ code: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ title: "text", description: "text" });

// Pre-save middleware to ensure enrolled doesn't exceed capacity
courseSchema.pre("save", function (next) {
  if (this.enrolled > this.capacity) {
    this.enrolled = this.capacity;
  }
  next();
});

export const Course = mongoose.model<ICourse>("Course", courseSchema);
