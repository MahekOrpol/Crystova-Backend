const mongoose = require("mongoose");
const http = require("http"); // 👈 Add this
const socketIo = require("socket.io"); // 👈 Add this
const app = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");

let server;
let io;

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info("Connected to MongoDB");
  mongoose.set("debug", true);

  // ✅ Create HTTP server and bind it to Express app
  server = http.createServer(app);

  // ✅ Initialize Socket.IO
  io = socketIo(server, {
    cors: {
      origin: "*", // Replace with frontend origin if needed
      methods: ["GET", "POST"],
    },
  });

  // ✅ Handle socket connections
  // Maintain product-wise viewer counts
  const productViewers = {};

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join_product", (productId) => {
        socket.join(productId); // Join room
      
        if (!productViewers[productId]) {
          productViewers[productId] = new Set();
        }
      
        productViewers[productId].add(socket.id);
      
        const count = productViewers[productId].size;
        console.log(`JOIN: Product ${productId} → ${count} viewer(s)`);
        io.to(productId).emit("viewer_count", count);
      });
      
      socket.on("leave_product", (productId) => {
        socket.leave(productId);
      
        if (productViewers[productId]) {
          productViewers[productId].delete(socket.id);
          const count = productViewers[productId].size;
          console.log(`LEAVE: Product ${productId} → ${count} viewer(s)`);
          io.to(productId).emit("viewer_count", count);
console.log(`Broadcasted viewer_count ${count} to room ${productId}`);

        }
      });
      
      socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        for (const [productId, viewers] of Object.entries(productViewers)) {
          if (viewers.has(socket.id)) {
            viewers.delete(socket.id);
            const count = viewers.size;
            console.log(`DISCONNECT: Product ${productId} → ${count} viewer(s)`);
            io.to(productId).emit("viewer_count", count);
          }
        }
      });
  });

  server.listen(config.port, () => {
    logger.info(`Listening on port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
