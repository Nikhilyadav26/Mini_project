const Announcement = require("../models/Announcement");
const { success, failure } = require("../utils/apiResponse");

const getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    return success(res, 200, "Announcements retrieved successfully", announcements);
  } catch (error) {
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetAudience } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      targetAudience: targetAudience || "all",
      createdBy: req.user._id
    });

    return success(res, 201, "Announcement posted successfully", announcement);
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid announcement ID format");
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return failure(res, 404, "Announcement not found");
    }

    await Announcement.findByIdAndDelete(id);
    return success(res, 200, "Announcement deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};
