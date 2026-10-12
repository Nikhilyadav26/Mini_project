const { z } = require("zod");

const createComplaintSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.enum(["academic", "facilities", "administration", "other"], {
    errorMap: () => ({ message: "Category must be academic, facilities, administration, or other" })
  })
});

const updateComplaintStatusSchema = z.object({
  status: z.enum(["submitted", "in_progress", "resolved"], {
    errorMap: () => ({ message: "Status must be submitted, in_progress, or resolved" })
  }),
  teacherResponse: z.string().optional()
});

module.exports = {
  createComplaintSchema,
  updateComplaintStatusSchema
};
