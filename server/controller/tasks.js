const mongoose = require("mongoose");
const taskModel = require("../models/tasks.js");

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const buildTaskPayload = (body, { requireTitle = false } = {}) => {
  const payload = {};

  if (hasOwn(body, "title") || requireTitle) {
    const title = String(body.title || "").trim();

    if (!title) {
      return {
        error: "Title is required",
      };
    }

    payload.title = title;
  }

  if (hasOwn(body, "description")) {
    payload.description = String(body.description || "").trim();
  }

  if (hasOwn(body, "completed")) {
    payload.completed = body.completed === true || body.completed === "true";
  }

  if (hasOwn(body, "dueDate")) {
    if (!body.dueDate) {
      payload.dueDate = null;
    } else {
      const dueDate = new Date(body.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        return {
          error: "Due date is invalid",
        };
      }

      payload.dueDate = dueDate;
    }
  }

  return {
    payload,
  };
};

const validateTaskId = (id, response) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return true;
  }

  response.status(400).json({
    success: false,
    message: "Invalid task id",
  });

  return false;
};

// list tasks owned by the signed-in user
const listTasks = async (request, response) => {
  try {
    const list = await taskModel
      .find({
        user: request.userId,
      })
      .sort({
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
    return response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// add a new task
const addTask = async (request, response) => {
  const { payload, error } = buildTaskPayload(request.body, {
    requireTitle: true,
  });

  if (error) {
    return response.status(400).json({
      success: false,
      message: error,
    });
  }

  try {
    const newTask = await taskModel.create({
      ...payload,
      user: request.userId,
    });

    response.status(201).json({
      success: true,
      message: "Task added successfully",
      task: newTask,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// remove a task owned by the signed-in user
const removeTask = async (request, response) => {
  try {
    const { id } = request.params;

    if (!validateTaskId(id, response)) {
      return;
    }

    const deletedTask = await taskModel.findOneAndDelete({
      _id: id,
      user: request.userId,
    });

    if (!deletedTask) {
      return response.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return response.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

// update a task owned by the signed-in user
const updateTask = async (request, response) => {
  const { id } = request.params;

  if (!validateTaskId(id, response)) {
    return;
  }

  const { payload, error } = buildTaskPayload(request.body);

  if (error) {
    return response.status(400).json({
      success: false,
      message: error,
    });
  }

  if (Object.keys(payload).length === 0) {
    return response.status(400).json({
      success: false,
      message: "No task changes provided",
    });
  }

  try {
    const updatedTask = await taskModel.findOneAndUpdate(
      {
        _id: id,
        user: request.userId,
      },
      payload,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedTask) {
      return response.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    response.json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

module.exports = { addTask, removeTask, updateTask, listTasks };
