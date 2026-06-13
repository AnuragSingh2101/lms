import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB with URI: ${uri ? uri.replace(/:([^@]+)@/, ':****@') : 'undefined'}`); // Hide password for security
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection FAILED: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
