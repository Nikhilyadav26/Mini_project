const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    eligibility: {
      type: String,
      required: [true, "Eligibility criteria is required"],
      trim: true
    },
    packageOrStipend: {
      type: String,
      required: [true, "Package or stipend is required"],
      trim: true
    },
    deadline: {
      type: Date,
      required: [true, "Application deadline is required"]
    },
    applicationLink: {
      type: String,
      required: [true, "Application link is required"],
      trim: true
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

opportunitySchema.methods.toJSON = function () {
  const opportunity = this.toObject();
  delete opportunity.__v;
  return opportunity;
};

const Opportunity = mongoose.model("Opportunity", opportunitySchema);

module.exports = Opportunity;
