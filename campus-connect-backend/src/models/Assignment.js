const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    rubric: {
      type: String,
      required: [true, "Rubric and evaluation criteria are required"],
      trim: true
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"]
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 1
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"]
    }
  },
  {
    timestamps: true
  }
);

assignmentSchema.methods.toJSON = function () {
  const assignment = this.toObject();
  delete assignment.__v;
  return assignment;
};

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
