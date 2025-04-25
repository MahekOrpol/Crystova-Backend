const express = require('express');
const router = express.Router();
const { videosController } = require('../../controllers');

// POST route to upload video
router.post('/upload/video', express.raw({  type: 'video/mp4' }), videosController.uploadVideo);

// GET route to fetch video
router.get('/videos/:filename', videosController.getVideo);

module.exports = router;
