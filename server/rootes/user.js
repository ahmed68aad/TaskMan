const express = require("express");
const { loginUser, registerUser, listTasks } = require("../controller/user.js");
const authMiddleware = require("../middlewares/auth.js");

const userRouter = express.Router();

userRouter.post("/signin", loginUser);
userRouter.post("/signup", registerUser);
userRouter.get("/list", authMiddleware, listTasks);

module.exports = userRouter;
