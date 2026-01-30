require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const app = require("./app");

const PORT = process.env.PORT || 5001;

// Track online users
const onlineUsers = {};

// Allowed origins for CORS (local dev + deployed frontend)
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL?.replace(/\/$/, "") // remove trailing slash just in case
];

// Convert string env to boolean
const corsCredentials = process.env.CORS_CREDENTIALS === "true";

connectDB()
  .then(() => {
    console.log("✅ Database connection established!");

    // HTTP Server for Socket.IO
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: corsCredentials,
      },
    });

    io.on("connection", (socket) => {
      console.log("⚡ User connected:", socket.id);

      // Client sends userId after login
      socket.on("register", (userId) => {
        onlineUsers[userId] = socket;
        socket.userId = userId;
        console.log(`User registered for real-time notifications: ${userId}`);
      });

      socket.on("disconnect", () => {
        if (socket.userId) delete onlineUsers[socket.userId];
        console.log("❌ User disconnected:", socket.userId);
      });
    });

    // Helper to emit notifications in real-time
    global.SendNotificationRealTime = (notification) => {
      const socket = onlineUsers[notification.userId?.toString()];
      if (socket && socket.connected) {
        socket.emit("notification", notification);
        console.log("📩 Notification sent to:", notification.userId);
      }
    };

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
