const express = require('express');
const validate = require('../../middlewares/validate');
const resourcesController = require('../../controllers/resources.controller');
const auth = require('../../middlewares/auth');
const catchAsync = require('../../utils/catchAsync');

const router = express.Router();

router.post('/create',auth(),validate(resourcesController.creacteResources.validation),catchAsync(resourcesController.creacteResources.handler));
router.put('/update/:id',validate(resourcesController.updateResources.validation),catchAsync(resourcesController.updateResources.handler));
router.delete('/delete/:id',catchAsync(resourcesController.deleteResources.handler));
router.get('/get',auth(),catchAsync(resourcesController.getResources.handler));

module.exports = router;