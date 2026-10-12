const { z } = require("zod");

const createOpportunitySchema = z.object({
  company: z.coerce.string().trim().min(1, "Company name is required"),
  role: z.coerce.string().trim().min(1, "Role/Designation is required"),
  description: z.coerce.string().trim().min(1, "Job description is required"),
  eligibility: z.coerce.string().trim().min(1, "Eligibility criteria description is required"),
  packageOrStipend: z.coerce.string().trim().min(1, "Package or stipend description is required (e.g. 12 LPA)"),
  deadline: z.coerce.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "Valid date format is required for deadline (e.g. 2026-11-30)"
  }),
  applicationLink: z.coerce.string().trim().min(1, "Application link or portal URL is required")
});

module.exports = {
  createOpportunitySchema
};
