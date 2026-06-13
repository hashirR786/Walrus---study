import mongoose from 'mongoose';

const connectDB = async () => {
  const primaryURI = process.env.MONGO_URI;
  const fallbackURI = 'mongodb://127.0.0.1:27017/walrus';

  if (primaryURI) {
    try {
      console.log('Connecting to primary MongoDB Atlas...');
      const conn = await mongoose.connect(primaryURI, {
        serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds to fallback quickly
      });
      console.log(`MongoDB Connected (Primary Atlas): ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Atlas Connection failed: ${error.message}`);
      console.log('\n========================================================================');
      console.log('⚠️  Atlas IP Whitelist / Network Issue Detected!');
      console.log('If your IP address changed, MongoDB Atlas may be blocking the connection.');
      console.log('To fix this:');
      console.log('1. Go to your MongoDB Atlas Dashboard -> Network Access.');
      console.log('2. Click "Add IP Address" and add your current IP address, or add "0.0.0.0/0"');
      console.log('   (allow access from anywhere) for easy development access.');
      console.log('========================================================================\n');
      console.log('Attempting connection to local MongoDB fallback...');
    }
  }

  try {
    const conn = await mongoose.connect(fallbackURI, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
  } catch (error) {
    console.error(`Local Fallback MongoDB Connection Error: ${error.message}`);
    console.error('All MongoDB connection attempts failed. Exiting backend server.');
    process.exit(1);
  }
};

export default connectDB;
