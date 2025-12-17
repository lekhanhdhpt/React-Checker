import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
console.log('Connecting to MongoDB at', uri);

if (!uri) {
  console.error('Missing MONGODB_URI in environment.');
}

mongoose.set('strictQuery', true);

(async () => {
  try {
    await mongoose.connect(uri, {
      dbName: 'DATN',
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
})();
