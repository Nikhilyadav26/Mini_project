const { z } = require("zod");

const createAssignmentSchema = z.object({
  title: z.coerce.string().trim().min(1, "Title is required"),
  description: z.coerce.string().trim().min(1, "Description is required"),
  rubric: z.coerce.string().trim().optional(),
  rubricCriteria: z.union([z.array(z.string()), z.string()]).optional(),
  deadline: z.coerce.string().optional(),
  dueDate: z.coerce.string().optional(),
  maxScore: z.coerce.number().optional(),
  maxMarks: z.coerce.number().optional(),
  subject: z.coerce.string().optional()
}).refine(data => data.rubric || data.rubricCriteria, {
  message: "Rubric / evaluation criteria are required"
}).refine(data => {
  const d = data.deadline || data.dueDate;
  return d && !isNaN(new Date(d).getTime());
}, {
  message: "Valid deadline date is required"
});

const aiFeedbackSchema = z.object({
  draftContent: z.string().trim().optional(),
  submissionText: z.string().trim().optional()
}).refine(data => (data.draftContent || data.submissionText || "").length >= 5, {
  message: "Draft content must be at least 5 characters"
});

const submitAssignmentSchema = z.object({
  content: z.string().trim().optional(),
  submissionText: z.string().trim().optional()
}).refine(data => (data.content || data.submissionText || "").length >= 5, {
  message: "Submission content must be at least 5 characters"
});

const gradeSubmissionSchema = z.object({
  teacherGrade: z.coerce.number().optional(),
  marks: z.coerce.number().optional(),
  teacherFeedback: z.string().optional(),
  feedback: z.string().optional()
}).refine(data => data.teacherGrade !== undefined || data.marks !== undefined, {
  message: "Grade / marks must be provided"
});

module.exports = {
  createAssignmentSchema,
  aiFeedbackSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema
};
