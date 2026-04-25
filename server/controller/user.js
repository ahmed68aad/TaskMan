const userModel = require("../models/user.js");
const taskModel = require("../models/tasks.js");
const bcrypt = require("bcrypt");
const validator = require("validator");
const jwt = require("jsonwebtoken");

// create JWT token
const createToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// register user
const registerUser = async (request, response) => {
  const name = String(request.body.name || "").trim();
  const email = String(request.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(request.body.password || "");

  try {
    if (!name || !email || !password) {
      return response.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // check if user exists
    const exist = await userModel.findOne({ email });

    if (exist) {
      return response.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // validate email
    if (!validator.isEmail(email)) {
      return response.status(400).json({
        success: false,
        message: "Please enter valid email",
      });
    }

    // validate password
    if (password.length < 8) {
      return response.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // create user
    const newUser = new userModel({
      name,
      email,
      password,
    });

    const user = await newUser.save();

    const token = createToken(user._id);

    response.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log(error);

    response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// login user
const loginUser = async (request, response) => {
  const email = String(request.body.email || "")
    .trim()
    .toLowerCase();
  const password = String(request.body.password || "");

  try {
    if (!email || !password) {
      return response.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return response.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return response.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user._id);

    response.json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    console.log(error);

    response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

//list tasks
const listTasks = async (request, response) => {
  try {
    const list = await taskModel.find({
      user: request.userId,
    }).sort({
      completed: 1,
      dueDate: 1,
      createdAt: -1,
    });

    response.json({
      success: true,
      tasks: list,
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

module.exports = { loginUser, registerUser, listTasks };
