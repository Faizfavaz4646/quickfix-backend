require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const clientProfileRouter = require("./routes/client.routes");
const workerProfileRouter = require("./routes/worker.routes");

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

const corsCredentials = process.env.CORS_CREDENTIALS === "true";

app.use(cors({
  origin: process.env.CLIENT_URL, // fixed the double "process.env"
  credentials: corsCredentials,
}));

// Routes
app.use("/auth", authRouter);
app.use("/client", clientProfileRouter);
app.use("/worker", workerProfileRouter);

module.exports =app;
