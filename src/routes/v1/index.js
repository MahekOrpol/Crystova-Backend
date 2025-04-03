const express = require("express");
const userRoute = require("./user.route");
const adminRoute = require("./admin.route");
const authRoute = require("./auth.route");
const gameRoute = require("./game.route");
const aboutUsRoute = require("./aboutUs.route");
const assignmentsRoute = require("./assignments.route");
const toDosRoute = require("./todos.route");
const eventRoute = require("./event.route");
const resourcesRouter = require("./resources.route");
const notificationRoute = require("./notification.route");
const roomRoute = require("./room.route");
const chatRoute = require("./chat.route");
const taskRoute = require("./task.route");
const discussionRoomRoute = require("./discussionRoom.route");
const discussionChatRoute = require("./discussionChat.route");
const registerRoute = require("./register.route");
const productRoute=require('./products.route')
const wishlistRoute=require('./wishlist.route')
const categoryRoute=require('./category.route')
const orderDetailsRoute=require('./orderDetails.route')
const orderRoute=require('./order.route')
const paymentRoute=require('./payment.route')
const contactRoutes = require('./contactUs.route')
const router = express.Router();

const defaultRoutes = [
  {
    path: "/auth",
    route: authRoute, 
  },
  {
    path: "/event",
    route: eventRoute,
  },
  {
    path: "/admin",
    route: adminRoute,
  },
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/todos",
    route: toDosRoute,
  },
  {
    path: "/resources",
    route: resourcesRouter,
  },
  {
    path: "/games",
    route: gameRoute,
  },
  {
    path: "/aboutUs",
    route: aboutUsRoute,
  },
  {
    path: "/assignments",
    route: assignmentsRoute,
  },
  {
    path: "/notification",
    route: notificationRoute,
  },
  {
    path: "/room",
    route: roomRoute,
  },
  {
    path: "/chat",
    route: chatRoute,
  },
  {
    path: "/task",
    route: taskRoute,
  },
  {
    path: "/discussionRoom",
    route: discussionRoomRoute,
  },
  {
    path: "/discussionChat",
    route: discussionChatRoute,
  },
  {
    path: "/register",
    route: registerRoute,
  },
  {
    path: '/product',
    route: productRoute,
  },
  {
    path: '/category',
    route: categoryRoute,
  },
  {
    path: '/wishlist',
    route: wishlistRoute,
  },
  {
    path: '/contact-us',
    route: contactRoutes,
  },
  {
    path: '/order-details',
    route: orderDetailsRoute,
  },
  {
    path: '/order',
    route: orderRoute,
  },
  {
    path: '/payment',
    route: paymentRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
