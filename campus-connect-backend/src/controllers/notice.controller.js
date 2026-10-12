const mongoose = require("mongoose");
const Notice = require("../models/Notice");
const { success, failure } = require("../utils/apiResponse");

const getNotices = async (req, res, next) => {
  try {
    // Teachers see all notices (or drafts and published); students see published
    const filter = req.user && req.user.role === "teacher" ? {} : { status: "published" };

    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role");

    return success(res, 200, "Notices retrieved successfully", notices);
  } catch (error) {
    next(error);
  }
};

const getNoticeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid notice ID format");
    }

    const notice = await Notice.findById(id).populate("createdBy", "name email role");
    if (!notice) {
      return failure(res, 404, "Notice not found");
    }

    return success(res, 200, "Notice retrieved successfully", notice);
  } catch (error) {
    next(error);
  }
};

const createNotice = async (req, res, next) => {
  try {
    const { title, content, status, category } = req.body;

    const noticeStatus = status === "draft" ? "draft" : "published";
    const publishedAt = noticeStatus === "published" ? new Date() : null;

    const notice = await Notice.create({
      title,
      content,
      status: noticeStatus,
      category: category || "general",
      publishedAt,
      createdBy: req.user._id
    });

    const populated = await Notice.findById(notice._id).populate("createdBy", "name email role");

    return success(res, 201, "Notice created successfully", populated || notice);
  } catch (error) {
    next(error);
  }
};

const updateNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid notice ID format");
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return failure(res, 404, "Notice not found");
    }

    const { title, content, status } = req.body;
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (status) {
      notice.status = status;
      if (status === "published" && !notice.publishedAt) {
        notice.publishedAt = new Date();
      }
    }

    await notice.save();
    const populated = await Notice.findById(notice._id).populate("createdBy", "name email role");

    return success(res, 200, "Notice updated successfully", populated || notice);
  } catch (error) {
    next(error);
  }
};

const deleteNotice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid notice ID format");
    }

    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) {
      return failure(res, 404, "Notice not found");
    }

    return success(res, 200, "Notice deleted successfully");
  } catch (error) {
    next(error);
  }
};

const publishNotice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid notice ID format");
    }

    const notice = await Notice.findById(id);
    if (!notice) {
      return failure(res, 404, "Notice not found");
    }

    notice.status = "published";
    notice.publishedAt = new Date();
    await notice.save();

    const populated = await Notice.findById(notice._id).populate("createdBy", "name email role");

    return success(res, 200, "Notice published successfully", populated || notice);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice,
  publishNotice
};
