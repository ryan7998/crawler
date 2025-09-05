#!/usr/bin/env node

/**
 * Database optimization script
 * Run this script to optimize database performance
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { optimizeDatabase } = require('../utils/databaseOptimization');

const runOptimization = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/crawler_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB');

        // Run optimization
        await optimizeDatabase();

        console.log('🎉 Database optimization completed successfully!');
        
    } catch (error) {
        console.error('❌ Database optimization failed:', error.message);
        process.exit(1);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the optimization
runOptimization();
