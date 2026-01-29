require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const app = require("./app");
const notifications = require("./model/notifications");

const PORT = process.env.PORT || 5001;

// Track online users
const onlineUsers = {};

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",      // local frontend
  process.env.CLIENT_URL        // deployed frontend (Vercel)
];

// Convert string env to boolean
const corsCredentials = process.env.CORS_CREDENTIALS === "true";

connectDB()
  .then(() => {
    console.log("Database connection established..!!");

    // HTTP Server for Socket.IO
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: corsCredentials,
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected", socket.id);

      // Client sends userId after login
      socket.on("register", (userId) => {
        onlineUsers[userId] = socket;
        socket.userId = userId;
      });

      socket.on("disconnect", () => {
        if (socket.userId) delete onlineUsers[socket.userId];
        console.log("User disconnected", socket.userId);
      });
    });

    // Helper to emit notifications in real-time
    global.SendNotificationRealTime = (notification) => {
      const socket = onlineUsers[notification.userId.toString()];
      if (socket && socket.connected) {
        socket.emit("notification", notification);
      }
    };

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected..!!", err);
  });
