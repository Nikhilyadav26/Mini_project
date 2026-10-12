const express = require("express");
const cors = require("cors");
const { success } = require("./utils/apiResponse");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Routers
const authRoutes = require("./routes/auth.routes");
const noticeRoutes = require("./routes/notice.routes");
const eventRoutes = require("./routes/event.routes");
const aiRoutes = require("./routes/ai.routes");
const opportunityRoutes = require("./routes/opportunity.routes");
const applicationRoutes = require("./routes/application.routes");
const complaintRoutes = require("./routes/complaint.routes");
const roadmapRoutes = require("./routes/roadmap.routes");
const prepRoutes = require("./routes/prep.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const announcementRoutes = require("./routes/announcement.routes");

const app = express();

// Enable CORS
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true
  })
);

// Body parser
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  return success(res, 200, "Campus Connect API is healthy", {
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Mount exact API routes as per shared contract
app.use("/api/auth", authRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/announcements", announcementRoutes);

// Mount Signature AI Feature Routes
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/prep", prepRoutes);
app.use("/api/assignments", assignmentRoutes);

// 404 Handler for undefined routes
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
