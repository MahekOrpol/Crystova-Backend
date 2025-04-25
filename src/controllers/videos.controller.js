const { GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const { Videos } = require('../models');

// Initialize MongoDB connection for GridFS
const client = new mongoose.mongo.MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });
let gridfsBucket;

client.connect().then(() => {
  const db = client.db('videoUploads');
  gridfsBucket = new GridFSBucket(db, { bucketName: 'videos' });
});

// Controller to handle video upload
exports.uploadVideo = async (req, res) => {
  try {
    const videoBuffer = req.body;
    const videoName = Date.now() + '.mp4'; // You can customize the filename

    const uploadStream = gridfsBucket.openUploadStream(videoName);
    uploadStream.end(videoBuffer);

    // Create a new video document in the database
    const video = new Videos({
      fileName: videoName,
      filePath: `/videos/${videoName}`,
    });

    await video.save();

    res.status(200).json({
      message: 'Video uploaded successfully',
      video: {
        fileName: video.fileName,
        filePath: video.filePath,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
};

// Controller to serve the uploaded video
exports.getVideo = (req, res) => {
  const { filename } = req.params;
  const downloadStream = gridfsBucket.openDownloadStreamByName(filename);

  downloadStream.pipe(res);
};
