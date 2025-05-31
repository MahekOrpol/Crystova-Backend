const config = require("../config/config");
const moment = require('moment');
const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// Ensure upload directories exist
const ensureUploadDirs = () => {
    const uploadPath = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    return uploadPath;
};

const saveFile = async (files) => {
    const uploadPath = ensureUploadDirs();
    const timestamp = moment().unix();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const fileName = `${timestamp}${randomNum}.webp`;
    
    return new Promise(async (resolve, reject) => {
        try {
            // Create a temporary path for the original file
            const tempPath = path.join(uploadPath, 'temp_' + files.name);
            
            // Save the original file temporarily
            await files.mv(tempPath);
            
            // Convert to WebP with high quality
            await sharp(tempPath)
                .webp({
                    quality: 90,
                    lossless: false,
                    effort: 6
                })
                .toFile(path.join(uploadPath, fileName));
            
            // Remove the temporary file
            fs.unlinkSync(tempPath);
            
            resolve({
                upload_path: '/images/' + fileName,
                file_name: fileName
            });
        } catch (err) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            reject(err);
        }
    });
};

const removeFile = (file_name) => {
    const filePath = path.join(process.cwd(), 'public', file_name);
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    // File doesn't exist, log and resolve gracefully
                    console.warn("⚠️ File not found, skipping deletion:", filePath);
                    resolve(false);
                } else {
                    // Other errors, reject
                    console.error("❌ Error deleting file:", err);
                    reject(err);
                }
            } else {
                console.log("✅ File deleted:", filePath);
                resolve(true);
            }
        });
    });
};

const convertToWebP = async (imagePath) => {
    try {
        const uploadPath = ensureUploadDirs();
        // Remove leading slash if present
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const fullPath = path.join(process.cwd(), 'public', cleanPath);
        
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${fullPath}`);
            return null;
        }

        const timestamp = moment().unix();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newFileName = `${timestamp}${randomNum}.webp`;
        const newPath = path.join(uploadPath, newFileName);

        // Convert to WebP with high quality
        await sharp(fullPath)
            .webp({
                quality: 90,
                lossless: false,
                effort: 6
            })
            .toFile(newPath);

        // Remove the original file
        fs.unlinkSync(fullPath);

        return '/images/' + newFileName;
    } catch (err) {
        console.error(`❌ Error converting image ${imagePath}:`, err);
        return null;
    }
};

const convertAllProductImages = async (Products) => {
    try {
        const products = await Products.find({});
        let convertedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            if (product.image && Array.isArray(product.image)) {
                const newImages = [];
                const imageExtensions = ['.png', '.jpg', '.jpeg'];
                for (const imagePath of product.image) {
                    const ext = path.extname(imagePath).toLowerCase();
                    if (!imageExtensions.includes(ext)) {
                        // Skip non-image files
                        continue;
                    }
                    const newPath = await convertToWebP(imagePath);
                    if (newPath) {
                        newImages.push(newPath);
                        convertedCount++;
                    } else {
                        errorCount++;
                    }
                }
                if (newImages.length > 0) {
                    product.image = newImages;
                    await product.save();
                }
            }
        }

        return {
            totalProducts: products.length,
            convertedImages: convertedCount,
            errors: errorCount
        };
    } catch (err) {
        console.error('❌ Error in convertAllProductImages:', err);
        throw err;
    }
};

module.exports = {
    saveFile,
    removeFile,
    convertToWebP,
    convertAllProductImages
}