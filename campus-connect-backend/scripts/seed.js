require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../src/config/db");

const User = require("../src/models/User");
const Notice = require("../src/models/Notice");
const Event = require("../src/models/Event");
const Opportunity = require("../src/models/Opportunity");
const Application = require("../src/models/Application");
const Complaint = require("../src/models/Complaint");

const seedDatabase = async () => {
  try {
    console.log("[Seed] Connecting to MongoDB...");
    await connectDB();

    const teacherPassword = process.env.DEMO_TEACHER_PASSWORD || "Teacher@123";
    const studentPassword = process.env.DEMO_STUDENT_PASSWORD || "Student@123";

    const teacherHash = await bcrypt.hash(teacherPassword, 10);
    const studentHash = await bcrypt.hash(studentPassword, 10);

    // 1. Seed Teacher (Safe Upsert)
    const teacher = await User.findOneAndUpdate(
      { email: "teacher@example.com" },
      {
        name: "Prof. Sarah Jenkins",
        email: "teacher@example.com",
        passwordHash: teacherHash,
        role: "teacher"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Seed] Teacher ready: ${teacher.email} (${teacher.name})`);

    // 2. Seed Student 1 (Safe Upsert)
    const student1 = await User.findOneAndUpdate(
      { email: "student@example.com" },
      {
        name: "Alex Rivera",
        email: "student@example.com",
        passwordHash: studentHash,
        role: "student"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Seed] Student 1 ready: ${student1.email} (${student1.name})`);

    // 3. Seed Student 2 (Safe Upsert)
    const student2 = await User.findOneAndUpdate(
      { email: "student2@example.com" },
      {
        name: "Maya Patel",
        email: "student2@example.com",
        passwordHash: studentHash,
        role: "student"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Seed] Student 2 ready: ${student2.email} (${student2.name})`);

    // 4. Seed Notices (Published & Draft)
    await Notice.deleteMany({ createdBy: teacher._id });

    const publishedNotice = await Notice.create({
      title: "Mid-Term Examination Schedule Announcement",
      content: "The mid-term examinations for Computer Science will commence from November 10th. All students must ensure their laboratory records are submitted.",
      status: "published",
      createdBy: teacher._id,
      publishedAt: new Date()
    });

    const draftNotice = await Notice.create({
      title: "Guest Lecture on Distributed Systems (Draft)",
      content: "Dr. Alan Turing from TechCorp will be visiting for a special session next week. Timing and hall allocation to be finalized.",
      status: "draft",
      createdBy: teacher._id,
      publishedAt: null
    });
    console.log(`[Seed] Notices created: 1 published, 1 draft`);

    // 5. Seed Events
    await Event.deleteMany({ createdBy: teacher._id });

    const demoEventDate = new Date();
    demoEventDate.setDate(demoEventDate.getDate() + 7); // 7 days from now

    const demoEvent = await Event.create({
      title: "Annual Hackathon 2026",
      description: "24-hour coding challenge focusing on AI and Web Innovations. Form teams of 2 to 4 students.",
      eventDate: demoEventDate,
      location: "Auditorium Hall B",
      registrationLink: "https://campusconnect.edu/hackathon",
      createdBy: teacher._id
    });
    console.log(`[Seed] Event created: "${demoEvent.title}" on ${demoEvent.eventDate.toISOString()}`);

    // 6. Seed Opportunity
    await Opportunity.deleteMany({ createdBy: teacher._id });

    const demoDeadline = new Date();
    demoDeadline.setDate(demoDeadline.getDate() + 14); // 14 days from now

    const opportunity = await Opportunity.create({
      company: "CloudScale Technologies",
      role: "Junior Software Engineer Intern",
      description: "Full-stack development internship focusing on Node.js and React. Opportunity for PPO based on performance.",
      eligibility: "B.Tech CSE/IT, CGPA 7.5 and above, no active backlogs",
      packageOrStipend: "$1,200 / month",
      deadline: demoDeadline,
      applicationLink: "https://cloudscale.careers/apply/intern2026",
      createdBy: teacher._id
    });
    console.log(`[Seed] Opportunity created: ${opportunity.company} - ${opportunity.role}`);

    // 7. Seed Applications (Safe Upsert)
    await Application.findOneAndUpdate(
      { studentId: student1._id, opportunityId: opportunity._id },
      {
        studentId: student1._id,
        opportunityId: opportunity._id,
        status: "applied"
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[Seed] Application created: ${student1.name} applied to ${opportunity.company}`);

    // 8. Seed Complaints
    await Complaint.deleteMany({ studentId: { $in: [student1._id, student2._id] } });

    await Complaint.create({
      studentId: student1._id,
      title: "Laboratory Air Conditioning Issue",
      description: "The AC unit in Lab 3 is not functioning properly, making afternoon practical sessions difficult.",
      category: "facilities",
      status: "in_progress",
      teacherResponse: "Maintenance team has been notified and scheduled for repair tomorrow morning."
    });

    await Complaint.create({
      studentId: student2._id,
      title: "Library Book Loan Extension Request",
      description: "Requesting additional 7-day loan period for reference textbooks during exam preparation.",
      category: "academic",
      status: "submitted",
      teacherResponse: ""
    });
    console.log(`[Seed] Complaints created: 2 student complaints`);

    console.log("\n==========================================");
    console.log("   DEMO CREDENTIALS SEEDED SUCCESSFULLY   ");
    console.log("==========================================");
    console.log(` Teacher: ${teacher.email} | Password: ${teacherPassword}`);
    console.log(` Student 1: ${student1.email} | Password: ${studentPassword}`);
    console.log(` Student 2: ${student2.email} | Password: ${studentPassword}`);
    console.log("==========================================\n");

    await mongoose.connection.close();
    console.log("[Seed] Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error(`[Seed] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
