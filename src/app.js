require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const clientProfileRouter = require("./routes/client.routes");
const workerProfileRouter = require("./routes/worker.routes");
const jobRequestRoutes = require("./routes/jobRequest.routes");
const notificationRoutes = require("./routes/notification.routes");
const postsRoutes = require("./routes/post.routes");
const adminRoutes = require("./routes/admin.routes");
const reviewRoutes = require("./routes/reviews.routes")
const commentRoutes = require("./routes/comment.routes")
const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

const corsCredentials = process.env.CORS_CREDENTIALS === "true";
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: corsCredentials,
}));

// Routes
app.use("/auth", authRouter);
app.use("/client", clientProfileRouter);
app.use("/worker", workerProfileRouter);
app.use("/job-requests", jobRequestRoutes);
app.use("/notifications", notificationRoutes);
app.use("/posts",postsRoutes);
app.use("/admin",adminRoutes);
app.use("/reviews",reviewRoutes);
app.use("/comments",commentRoutes)

module.exports = app;
