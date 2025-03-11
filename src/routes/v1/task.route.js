const express = require('express');
const validate = require('../../middlewares/validate');
const catchAsync = require('../../utils/catchAsync');
const auth = require('../../middlewares/auth');
const { taskController } = require('../../controllers');


const router = express.Router();

router.post('/create', auth(), validate(taskController.createTask.validation), catchAsync(taskController.createTask.handler));
router.get('/get',catchAsync(taskController.getTask.handler));
router.put('/update/:id', validate(taskController.updateTask.validation), catchAsync(taskController.updateTask.handler));
router.delete('/delete/:id', catchAsync(taskController.deleteTask.handler));


module.exports = router;