const mongoose = require("mongoose");

const feedbackEntrySchema = new mongoose.Schema(
  {
    draftContent: {
      type: String,
      required: true
    },
    readinessScore: {
      type: String,
      default: "Moderate"
    },
    strengths: [String],
    missingPoints: [String],
    improvementSuggestions: [String],
    evaluatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "assignmentId is required"]
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"]
    },
    content: {
      type: String,
      required: [true, "Submission content is required"],
      trim: true
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft"
    },
    aiFeedbackHistory: [feedbackEntrySchema],
    teacherGrade: {
      type: Number,
      default: null
    },
    teacherFeedback: {
      type: String,
      default: ""
    },
    submittedAt: {
      type: Date,
      default: null
    },
    gradedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

submissionSchema.methods.toJSON = function () {
  const submission = this.toObject();
  delete submission.__v;
  return submission;
};

const Submission = mongoose.model("Submission", submissionSchema);

module.exports = Submission;
