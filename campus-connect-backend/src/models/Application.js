const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "studentId is required"]
    },
    opportunityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Opportunity",
      required: [true, "opportunityId is required"]
    },
    status: {
      type: String,
      enum: {
        values: ["saved", "applied", "shortlisted", "rejected", "selected"],
        message: "Status must be saved, applied, shortlisted, rejected, or selected"
      },
      default: "saved"
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index on studentId and opportunityId
applicationSchema.index({ studentId: 1, opportunityId: 1 }, { unique: true });

applicationSchema.methods.toJSON = function () {
  const application = this.toObject();
  delete application.__v;
  return application;
};

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
