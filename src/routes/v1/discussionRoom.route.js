const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const auth = require('../../middlewares/auth');
const { discussionRoomController } = require('../../controllers');

const  router = express.Router();

router.post('/create',auth(),validate(discussionRoomController.createDiscussionRoom.validation),catchAsync(discussionRoomController.createDiscussionRoom.handler));

router.get('/get',auth(),catchAsync(discussionRoomController.getDiscussionRoom.handler));

module.exports = router;    

