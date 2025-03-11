const express = require('express');
const validate = require('../../middlewares/validate');
const admin = require('../../middlewares/admin');
const adminController = require('../../controllers/admin.controller')
const catchAsync = require('../../utils/catchAsync');


const router = express.Router();

router.post('/register', validate(adminController.register.validation), catchAsync(adminController.register.handler));
router.post('/login', validate(adminController.login.validation), catchAsync(adminController.login.handler));

module.exports = router;