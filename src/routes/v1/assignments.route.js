const express = require('express');
const validate = require('../../middlewares/validate');
const assignmentsController = require('../../controllers/assignments.controller');
const catchAsync = require('../../utils/catchAsync');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.post('/create',auth(),validate(assignmentsController.createAssignments.validation),catchAsync(assignmentsController.createAssignments.handler));
router.put('/update/:id',auth(),validate(assignmentsController.updateAssignments.validation),catchAsync(assignmentsController.updateAssignments.handler));
router.delete('/delete/:id',catchAsync(assignmentsController.deleteAssignments.handler));
router.get('/get',auth(),catchAsync(assignmentsController.getAssignments.handler));
router.get('/getstatus',auth(),catchAsync(assignmentsController.getAssignmentsStatus.handler));
router.get('/getUser',auth(),catchAsync(assignmentsController.getUser.handler));
module.exports = router;    
