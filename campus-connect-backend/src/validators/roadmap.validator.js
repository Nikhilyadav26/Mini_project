const { z } = require("zod");

const generateRoadmapSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  semester: z.string().trim().min(1, "Semester is required"),
  syllabusText: z.string().trim().min(10, "Syllabus text must be at least 10 characters"),
  startDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Valid start date is required"),
  endDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Valid end date is required"),
  classesPerWeek: z.coerce.number().int().min(1).max(7),
  holidays: z
    .array(
      z.object({
        date: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Valid holiday date"),
        name: z.string().optional()
      })
    )
    .optional()
    .default([])
});

const createRoadmapSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  semester: z.string().trim().min(1, "Semester is required"),
  startDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Valid start date is required"),
  endDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), "Valid end date is required"),
  classesPerWeek: z.coerce.number().int().min(1).max(7),
  holidays: z.array(z.any()).optional().default([]),
  schedule: z.array(
    z.object({
      classNumber: z.number().int().positive(),
      date: z.string().or(z.date()),
      topic: z.string().trim().min(1),
      type: z.enum(["lecture", "revision", "quiz", "test", "lab"]).default("lecture"),
      status: z.enum(["planned", "completed", "missed", "rescheduled"]).default("planned"),
      notes: z.string().optional().default("")
    })
  ).min(1, "Schedule must contain at least one session")
});

const updateSessionStatusSchema = z.object({
  status: z.enum(["planned", "completed", "missed", "rescheduled"], {
    errorMap: () => ({ message: "Status must be planned, completed, missed, or rescheduled" })
  }),
  notes: z.string().optional()
});

const rescheduleRoadmapSchema = z.object({
  missedClassNumbers: z.array(z.number().int().positive()).min(1, "At least one missed class number must be provided"),
  reason: z.string().optional().default("Class missed / cancelled")
});

module.exports = {
  generateRoadmapSchema,
  createRoadmapSchema,
  updateSessionStatusSchema,
  rescheduleRoadmapSchema
};
