const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const {chatController } = require('../../controllers');
const auth = require('../../middlewares/auth');

const  router = express.Router();
router.post('/create', auth(),validate(chatController.createChat.validation),catchAsync(chatController.createChat.handler));
router.get('/get',catchAsync(chatController.getChat.handler));
router.delete('/delete/:id',catchAsync(chatController.deleteChat.handler));
module.exports = router;    

