const express = require("express");
const tasksController = require("../controller/tasks.js");
const authMiddleware = require("../middlewares/auth.js");

const tasksRouter = express.Router();

tasksRouter.get("/list", authMiddleware, tasksController.listTasks);
tasksRouter.post("/add", authMiddleware, tasksController.addTask);
tasksRouter.post("/delete/:id", authMiddleware, tasksController.removeTask);
tasksRouter.post("/update/:id", authMiddleware, tasksController.updateTask);

// REST aliases used by the frontend. The original routes above stay available.
tasksRouter.post("/", authMiddleware, tasksController.addTask);
tasksRouter.delete("/:id", authMiddleware, tasksController.removeTask);
tasksRouter.patch("/:id", authMiddleware, tasksController.updateTask);

module.exports = tasksRouter;
