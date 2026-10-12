const { z } = require("zod");

const createNoticeSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  category: z.string().trim().optional().default("general")
});

module.exports = {
  createNoticeSchema
};
