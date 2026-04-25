const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    completed: {
      type: Boolean,
      default: false,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value > new Date();
        },
        message: "Due date must be in the future",
      },
    },
  },
  { timestamps: true },
);

const taskModel = mongoose.models.task || mongoose.model("task", taskSchema);

module.exports = taskModel;
