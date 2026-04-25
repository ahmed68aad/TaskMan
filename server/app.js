const express = require("express");
const userRouter = require("./rootes/user.js");
const tasksRouter = require("./rootes/tasks.js");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((request, response, next) => {
  const origin = request.headers.origin;
  const isAllowed =
    !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin);

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
app.use("/users", userRouter);
app.use("/tasks", tasksRouter);

module.exports = app;
