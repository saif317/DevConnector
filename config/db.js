// Dependencies
import mongoose from 'mongoose';
import config from 'config';

// Connect to MongoDB
const db = config.get('mongoURI');
export const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
