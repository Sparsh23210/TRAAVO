const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI_ATLAS || process.env.MONGODB_URI || 'mongodb://localhost:27017/transport_db';
        const conn = await mongoose.connect(uri);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;
