const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const { chatController, roomController } = require('../../controllers');
const auth = require('../../middlewares/auth');

const  router = express.Router();

router.post('/create',auth(),validate(roomController.createRoom.validation),catchAsync(roomController.createRoom.handler));
router.delete('/delete/:id',catchAsync(roomController.deleteRoom.handler));
router.get('/get',auth(),catchAsync(roomController.getRoom.handler));
router.put('/block/update/:id', auth(), validate(roomController.updateBlockRoom.validation),catchAsync(roomController.updateBlockRoom.handler));
router.get('/block/get', auth(),catchAsync(roomController.getBlockRoom.handler));
router.put('/unblock/update/:id', auth(), validate(roomController.updateUnblockRoom.validation),catchAsync(roomController.updateUnblockRoom.handler));
module.exports = router;    

