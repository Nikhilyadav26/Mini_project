const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
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
    eventDate: {
      type: Date,
      required: [true, "Event date is required"]
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true
    },
    registrationLink: {
      type: String,
      default: "",
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"]
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true
  }
);

eventSchema.methods.toJSON = function () {
  const event = this.toObject();
  delete event.__v;
  return event;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
