const mongoose = require("mongoose");
const Event = require("../models/Event");
const { success, failure } = require("../utils/apiResponse");

const getEvents = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let events = await Event.find({ eventDate: { $gte: todayStart } })
      .sort({ eventDate: 1 })
      .populate("createdBy", "name email role");

    // Fall back to all events sorted ascending if no future events exist
    if (!events || events.length === 0) {
      events = await Event.find()
        .sort({ eventDate: 1 })
        .populate("createdBy", "name email role");
    }

    return success(res, 200, "Upcoming events retrieved successfully", events);
  } catch (error) {
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, eventDate, location, registrationLink } = req.body;

    const parsedDate = new Date(eventDate);
    if (isNaN(parsedDate.getTime())) {
      return failure(res, 400, "Invalid eventDate format");
    }

    const event = await Event.create({
      title,
      description,
      eventDate: parsedDate,
      location,
      registrationLink: registrationLink || "",
      createdBy: req.user._id
    });

    return success(res, 201, "Event created successfully", event);
  } catch (error) {
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid event ID format");
    }

    const event = await Event.findById(id);
    if (!event) {
      return failure(res, 404, "Event not found");
    }

    const { title, description, eventDate, location, registrationLink } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (eventDate) {
      const parsedDate = new Date(eventDate);
      if (!isNaN(parsedDate.getTime())) {
        event.eventDate = parsedDate;
      }
    }
    if (location) event.location = location;
    if (registrationLink !== undefined) event.registrationLink = registrationLink;

    await event.save();
    return success(res, 200, "Event updated successfully", event);
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid event ID format");
    }

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return failure(res, 404, "Event not found");
    }

    return success(res, 200, "Event deleted successfully");
  } catch (error) {
    next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return failure(res, 400, "Invalid event ID format");
    }

    const event = await Event.findById(id);
    if (!event) {
      return failure(res, 404, "Event not found");
    }

    // Avoid double registration
    const alreadyRegistered = event.participants && event.participants.some(
      p => p.toString() === req.user._id.toString()
    );
    if (alreadyRegistered) {
      return failure(res, 409, "You are already registered for this event");
    }

    if (!event.participants) event.participants = [];
    event.participants.push(req.user._id);
    await event.save();

    return success(res, 200, "Successfully registered for event", event);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent
};

