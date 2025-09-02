"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/ead-lms";
        const conn = await mongoose_1.default.connect(mongoURI);
        console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
        mongoose_1.default.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            console.log("MongoDB disconnected");
        });
        process.on("SIGINT", async () => {
            await mongoose_1.default.connection.close();
            console.log("MongoDB connection closed through app termination");
            process.exit(0);
        });
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        console.log("MongoDB disconnected");
    }
    catch (error) {
        console.error("Error disconnecting from MongoDB:", error);
    }
};
exports.disconnectDB = disconnectDB;
//# sourceMappingURL=database.js.map