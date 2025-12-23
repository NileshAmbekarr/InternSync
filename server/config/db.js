const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('Full error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;