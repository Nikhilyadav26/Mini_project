const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(1, "Password is required")
});

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["teacher", "student"], {
    errorMap: () => ({ message: "Role must be teacher or student" })
  }),
  department: z.string().trim().optional(),
  year: z.coerce.number().int().min(1).max(4).optional()
});

module.exports = {
  loginSchema,
  registerSchema
};

