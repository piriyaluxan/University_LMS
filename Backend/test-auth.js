const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Test password hashing and comparison
async function testPasswordHashing() {
  console.log("Testing password hashing...");

  const password = "password123";
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, password);

  console.log("Original password:", password);
  console.log("Hashed password:", hashedPassword);

  const isMatch = await bcrypt.compare(password, hashedPassword);
  console.log("Password match:", isMatch);

  return { password, hashedPassword, isMatch };
}

// Test the User model methods
async function testUserModel() {
  console.log("\nTesting User model...");

  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/ead-lms");
    console.log("Connected to MongoDB");

    // Get the User model
    const User = require("./dist/models/User").User;

    // Find a user
    const user = await User.findOne({ email: "admin@university.edu" });
    if (user) {
      console.log("Found user:", {
        email: user.email,
        role: user.role,
        hasPassword: !!user.password,
      });

      // Test password comparison
      if (user.password) {
        const isMatch = await user.comparePassword("password123");
        console.log("Password comparison result:", isMatch);
      } else {
        console.log("User has no password set");
      }
    } else {
      console.log("No user found");
    }
  } catch (error) {
    console.error("Error testing User model:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run tests
async function runTests() {
  console.log("Starting authentication tests...\n");

  await testPasswordHashing();
  await testUserModel();

  console.log("\nTests completed!");
}

runTests().catch(console.error);

