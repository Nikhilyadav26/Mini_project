const { z } = require("zod");

const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  message: z.string().trim().min(1, "Message is required"),
  targetAudience: z.enum(["all", "students", "teachers"]).optional().default("all")
});

module.exports = {
  createAnnouncementSchema
};
