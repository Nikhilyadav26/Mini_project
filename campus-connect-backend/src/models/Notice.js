const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "published"],
        message: "Status must be draft or published"
      },
      default: "draft"
    },
    category: {
      type: String,
      default: "general",
      trim: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "createdBy is required"]
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

noticeSchema.methods.toJSON = function () {
  const notice = this.toObject();
  delete notice.__v;
  return notice;
};

const Notice = mongoose.model("Notice", noticeSchema);

module.exports = Notice;
