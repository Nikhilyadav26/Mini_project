const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"]
    },
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
    category: {
      type: String,
      enum: {
        values: ["academic", "facilities", "administration", "other"],
        message: "Category must be academic, facilities, administration, or other"
      },
      required: [true, "Category is required"]
    },
    status: {
      type: String,
      enum: {
        values: ["submitted", "in_progress", "resolved"],
        message: "Status must be submitted, in_progress, or resolved"
      },
      default: "submitted"
    },
    teacherResponse: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

complaintSchema.methods.toJSON = function () {
  const complaint = this.toObject();
  delete complaint.__v;
  return complaint;
};

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;
