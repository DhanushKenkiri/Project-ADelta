const functions = require('firebase-functions');
const admin = require('firebase-admin');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Create an HTTP server for Socket.io
const server = http.createServer();
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Handle joining a room
  socket.on('join-room', (roomId) => {
    console.log(`Client ${socket.id} joining room ${roomId}`);
    socket.join(roomId);
  });
  
  // Handle leaving a room
  socket.on('leave-room', (roomId) => {
    console.log(`Client ${socket.id} leaving room ${roomId}`);
    socket.leave(roomId);
  });
  
  // Handle chat messages
  socket.on('chat-message', (data) => {
    console.log(`Message in room ${data.roomId}:`, data.message);
    io.to(data.roomId).emit('chat-message', {
      id: Date.now().toString(),
      text: data.message,
      sender: data.sender,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Create a Firebase Function that starts the server
exports.socket = functions.https.onRequest((req, res) => {
  // This function is only used for the initial trigger
  // The actual socket.io handling happens on the raw server
  res.status(200).send('Socket.io server is running');
});

// Create a server instance that can be called by the Firebase Function
exports.io = functions.https.onRequest(server); 