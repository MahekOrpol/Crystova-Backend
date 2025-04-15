const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // change to your frontend URL in production
    methods: ['GET', 'POST'],
  },
});

const productRooms = {}; // store viewers per product

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join_product', (productId) => {
    socket.join(productId);

    if (!productRooms[productId]) productRooms[productId] = new Set();
    productRooms[productId].add(socket.id);

    // Broadcast updated viewer count
    io.to(productId).emit('viewer_count', productRooms[productId].size);
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach((room) => {
      if (productRooms[room]) {
        productRooms[room].delete(socket.id);
        io.to(room).emit('viewer_count', productRooms[room].size);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
