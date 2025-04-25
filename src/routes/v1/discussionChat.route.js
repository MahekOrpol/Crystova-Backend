const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const auth = require('../../middlewares/auth');
const {  discussionChatController } = require('../../controllers');

const  router = express.Router();
router.post('/create', auth(),validate(discussionChatController.createDiscussionChat.validation),catchAsync(discussionChatController.createDiscussionChat.handler));
router.get('/get',catchAsync(discussionChatController.getDiscussionChat.handler));
module.exports = router;    

