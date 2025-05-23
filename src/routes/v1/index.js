const express = require('express');
const router = express.Router();

// Import all route files
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const wishlistRoutes = require('./wishlist.route');
const registerRoutes = require('./register.route');
const reviewRoutes = require('./review.route');
const paymentRoutes = require('./payment.route');
const priceFilterRoutes = require('./priceFilter.route');
const productsRoutes = require('./products.route');
const orderRoutes = require('./order.route');
const orderDetailsRoutes = require('./orderDetails.route');
const notificationRoutes = require('./notification.route');
const contactUsRoutes = require('./contactUs.route');
const customJewelsRoutes = require('./customJewels.route');
const categoryRoutes = require('./category.route');
const adminRoutes = require('./admin.route');
const assignmentsRoutes = require('./assignments.route');
const whatsappRoutes = require('./whatsapp.route')
const blogsRoute = require('./blogs.route')
const aboutUsRoute = require('./aboutUs.route')
// Use all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/register', registerRoutes);
router.use('/review', reviewRoutes);
router.use('/payment', paymentRoutes);
router.use('/priceFilter', priceFilterRoutes);
router.use('/product', productsRoutes);
router.use('/order', orderRoutes);
router.use('/order-details', orderDetailsRoutes);
router.use('/notification', notificationRoutes);
router.use('/contact-us', contactUsRoutes);
router.use('/custom-jewels', customJewelsRoutes);
router.use('/category', categoryRoutes);
router.use('/admin', adminRoutes);
router.use('/assignments', assignmentsRoutes);
// router.use('/whatsapp/custome', whatsappRoutes);
router.use('/blog', blogsRoute);
router.use('/about-us', aboutUsRoute);

module.exports = router; 