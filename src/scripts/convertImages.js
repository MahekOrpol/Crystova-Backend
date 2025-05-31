const mongoose = require('mongoose');
const config = require('../config/config');
const { convertAllProductImages } = require('../utils/helper');
const { Products } = require('../models');
const path = require('path');
const fs = require('fs');

// Ensure the public/images directory exists
const ensureUploadDirs = () => {
    const uploadPath = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    return uploadPath;
};

const convertImages = async () => {
    try {
        // Create necessary directories
        ensureUploadDirs();

        // Connect to MongoDB
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('✅ Connected to MongoDB');

        // Convert all product images
        console.log('🔄 Starting image conversion...');
        const result = await convertAllProductImages(Products);
        
        console.log('\n📊 Conversion Results:');
        console.log(`Total Products: ${result.totalProducts}`);
        console.log(`Converted Images: ${result.convertedImages}`);
        console.log(`Errors: ${result.errors}`);

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Run the conversion
convertImages(); 