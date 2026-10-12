const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    classNumber: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    topic: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["lecture", "revision", "quiz", "test", "lab"],
      default: "lecture"
    },
    status: {
      type: String,
      enum: ["planned", "completed", "missed", "rescheduled"],
      default: "planned"
    },
    notes: {
      type: String,
      default: ""
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },
    holidays: [
      {
        date: { type: Date, required: true },
        name: { type: String, default: "Holiday" }
      }
    ],
    classesPerWeek: {
      type: Number,
      required: [true, "Classes per week is required"],
      min: 1,
      max: 7
    },
    totalPlannedClasses: {
      type: Number,
      default: 0
    },
    syllabusSummary: {
      type: String,
      default: ""
    },
    schedule: [sessionSchema],
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

roadmapSchema.methods.toJSON = function () {
  const roadmap = this.toObject();
  delete roadmap.__v;
  return roadmap;
};

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

module.exports = Roadmap;
