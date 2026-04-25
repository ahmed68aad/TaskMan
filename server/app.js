const express = require("express");
const userRouter = require("./rootes/user.js");
const tasksRouter = require("./rootes/tasks.js");
const connectDB = require("./config/db.js");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const configuredAllowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...new Set([...defaultAllowedOrigins, ...configuredAllowedOrigins]),
];
const vercelOriginPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;
const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

app.use((request, response, next) => {
  const origin = request.headers.origin;
  const isAllowed =
    !origin ||
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin) ||
    localhostOriginPattern.test(origin) ||
    vercelOriginPattern.test(origin);

  if (isAllowed) {
    response.setHeader(
      "Access-Control-Allow-Origin",
      origin || allowedOrigins[0] || "*",
    );
  }

  response.setHeader("Vary", "Origin");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, token",
  );
  response.setHeader("Access-Control-Max-Age", "86400");

  if (request.method === "OPTIONS") {
    return response.sendStatus(204);
  }

  next();
});
app.use(express.json());
app.get("/", (request, response) => {
  response.json({
    success: true,
    message: "Task manager API is running",
  });
});

const ensureDatabase = async (request, response, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    response.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
};

app.use("/users", ensureDatabase, userRouter);
app.use("/tasks", ensureDatabase, tasksRouter);

module.exports = app;
