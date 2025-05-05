const express = require('express');
const { reviewController } = require("../../controllers");
const catchAsync = require("../../utils/catchAsync");
const validate = require('../../middlewares/validate');

const router = express.Router();

router.post('/create',validate(reviewController.createReviewPro.validation),catchAsync(reviewController.createReviewPro.handler));

module.exports = router;