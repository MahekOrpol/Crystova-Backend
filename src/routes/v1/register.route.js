const express = require('express');
const validate = require('../../middlewares/validate');
const admin = require('../../middlewares/admin');
const catchAsync = require('../../utils/catchAsync');
const { registerController } = require('../../controllers');


const router = express.Router();

router.post('/register', validate(registerController.register.validation), catchAsync(registerController.register.handler));
router.post('/login', validate(registerController.login.validation), catchAsync(registerController.login.handler));

module.exports = router;