const { z } = require("zod");

const prepQuizSchema = z.object({
  opportunityId: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
  numberOfQuestions: z.coerce.number().int().min(1).max(10).optional().default(5)
}).refine((data) => data.opportunityId || (data.role && data.description), {
  message: "Either opportunityId or role and description must be provided"
});

const prepInterviewSchema = z.object({
  opportunityId: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
  level: z.enum(["entry", "mid", "senior"]).optional().default("entry")
}).refine((data) => data.opportunityId || (data.role && data.description), {
  message: "Either opportunityId or role and description must be provided"
});

const prepSkillGapSchema = z.object({
  opportunityId: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  description: z.string().optional(),
  studentSkills: z.array(z.string().trim()).min(1, "At least one skill must be provided"),
  studentExperience: z.string().optional().default("Student with basic coursework")
}).refine((data) => data.opportunityId || (data.role && data.description), {
  message: "Either opportunityId or role and description must be provided"
});

module.exports = {
  prepQuizSchema,
  prepInterviewSchema,
  prepSkillGapSchema
};
