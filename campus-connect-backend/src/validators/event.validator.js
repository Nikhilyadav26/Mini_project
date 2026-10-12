const { z } = require("zod");

const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  eventDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Valid ISO date format is required for eventDate"
  }),
  location: z.string().trim().min(1, "Location is required"),
  registrationLink: z.string().trim().optional().default("")
});

module.exports = {
  createEventSchema
};
