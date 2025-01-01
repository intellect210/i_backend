// FILE: I_BACKEND/config/dbConfig.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error(
        'MongoDB connection string (MONGODB_URI) is not defined in environment variables.'
      );
    }

    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully'); // Use console.log instead
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message); // Use console.error
    process.exit(1); // Exit the process if MongoDB connection fails
  }
};

module.exports = { connectDB };