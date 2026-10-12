# Campus Connect — Backend

Campus Connect is a single-classroom college application backend connecting students and teachers. Built with Express, MongoDB Atlas, Mongoose, and Google Gemini AI, strictly adhering to the **Campus Connect Master Backend Contract**.

---

## 1. Architecture & Tech Stack

- **Runtime:** Node.js (CommonJS: `require` / `module.exports`)
- **Web Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens) with Bearer token authentication
- **Password Security:** bcryptjs hashing (cost factor 10)
- **Request Validation:** Zod schemas
- **AI Integration:** Google Gemini API (`@google/generative-ai`)
- **Port:** `5000` (API base: `/api`)

---

## 2. Directory Structure

```
campus-connect-backend/
├── src/
│   ├── app.js                          # Express application configuration & route mounting
│   ├── server.js                       # HTTP server entrypoint
│   ├── config/
│   │   └── db.js                       # Mongoose MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                     # JWT Bearer token authentication middleware
│   │   ├── requireRole.js              # Role-based authorization middleware (teacher/student)
│   │   ├── errorHandler.js             # Centralized error handler
│   │   ├── notFound.js                 # 404 handler
│   │   └── validate.js                 # Zod validation middleware
│   ├── utils/
│   │   └── apiResponse.js              # Shared standard success/failure response helper
│   ├── models/
│   │   ├── User.js                     # User model (name, email, passwordHash, role)
│   │   ├── Notice.js                   # Notice model (draft/published, timestamps)
│   │   ├── Event.js                    # Event model (eventDate, location, etc.)
│   │   ├── Opportunity.js              # Opportunity model (placement/internships)
│   │   ├── Application.js              # Application model (student/opportunity pair)
│   │   └── Complaint.js                # Complaint model (categories, status, teacher response)
│   ├── routes/
│   │   ├── auth.routes.js              # /api/auth/login, /api/auth/me
│   │   ├── notice.routes.js            # /api/notices, /api/notices/:id/publish
│   │   ├── event.routes.js             # /api/events
│   │   ├── ai.routes.js                # /api/ai/rewrite-notice
│   │   ├── opportunity.routes.js       # /api/opportunities
│   │   ├── application.routes.js       # /api/applications, /api/applications/mine
│   │   └── complaint.routes.js         # /api/complaints, /api/complaints/mine
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── notice.controller.js
│   │   ├── event.controller.js
│   │   ├── ai.controller.js
│   │   ├── opportunity.controller.js
│   │   ├── application.controller.js
│   │   └── complaint.controller.js
│   ├── services/
│   │   └── ai.service.js               # Gemini notice drafting service
│   └── validators/
│       ├── auth.validator.js
│       ├── notice.validator.js
│       ├── event.validator.js
│       ├── opportunity.validator.js
│       ├── application.validator.js
│       └── complaint.validator.js
├── scripts/
│   └── seed.js                         # Database demo seeder (safe upsert)
├── tests/
│   └── acceptance.test.js              # Acceptance test suite (verifies all 17 rules)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 3. Developer Handshake & Shared Interfaces

### Standard Response Format
Every endpoint returns JSON with the exact shape:
- **Success:**
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": {}
  }
  ```
- **Error:**
  ```json
  {
    "success": false,
    "message": "A useful error message"
  }
  ```
- **Helper export:** `const { success, failure } = require("./src/utils/apiResponse");`

### Authentication Middleware
- **Export:** `module.exports = authenticateToken`
- **Usage:** `router.get("/", authenticateToken, handler)`
- **Header:** `Authorization: Bearer <token>`
- Sets `req.user` to the authenticated Mongoose user object.

### Role Authorization Middleware
- **Export:** `module.exports = requireRole`
- **Usage:** `router.post("/", authenticateToken, requireRole("teacher"), handler)`
- Validates `req.user.role`. Returns `403` on mismatch.

---

## 4. Setup & Running

### Prerequisites
- Node.js (v18+)
- MongoDB connection URI (MongoDB Atlas or local MongoDB instance)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI`, `JWT_SECRET`, and optionally `GEMINI_API_KEY` are populated.

### 3. Seed Demo Data
Populates 1 teacher and 2 students along with sample notices, events, opportunities, applications, and complaints:
```bash
npm run seed
```

**Demo Accounts:**
| Role | Email | Password |
|---|---|---|
| Teacher | `teacher@example.com` | `Teacher@123` |
| Student 1 | `student@example.com` | `Student@123` |
| Student 2 | `student2@example.com` | `Student@123` |

### 4. Start Development Server
```bash
npm run dev
```
The server will run at `http://localhost:5000`.

### 5. Run Automated Acceptance Tests
Executes end-to-end acceptance tests verifying all 17 contract requirements:
```bash
npm test
```

---

## 5. API Endpoints Reference

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/login` | Public | Login with email and password |
| `GET` | `/api/auth/me` | Logged-in | Return current user |
| `GET` | `/api/notices` | Logged-in | List published notices |
| `POST` | `/api/notices` | Teacher | Create draft or published notice |
| `PATCH` | `/api/notices/:id/publish` | Teacher | Publish a draft notice |
| `POST` | `/api/ai/rewrite-notice` | Teacher | Generate AI notice draft |
| `GET` | `/api/events` | Logged-in | List upcoming events |
| `POST` | `/api/events` | Teacher | Create event |
| `GET` | `/api/opportunities` | Logged-in | List placement opportunities |
| `POST` | `/api/opportunities` | Teacher | Create placement opportunity |
| `POST` | `/api/applications` | Student | Save or apply to opportunity |
| `GET` | `/api/applications/mine` | Student | List own applications |
| `PATCH` | `/api/applications/:id/status` | Teacher | Update application status |
| `POST` | `/api/complaints` | Student | Submit complaint |
| `GET` | `/api/complaints/mine` | Student | List own complaints |
| `GET` | `/api/complaints` | Teacher | List classroom complaints |
| `PATCH` | `/api/complaints/:id/status` | Teacher | Update complaint status & teacher response |

---

## 6. Working cURL Examples

### 1. Login (Teacher)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"Teacher@123"}'
```

### 2. Login (Student)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"Student@123"}'
```

### 3. Create a Draft Notice (Teacher)
```bash
curl -X POST http://localhost:5000/api/notices \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Semester Registration Deadline",
    "content": "All students must complete subject enrollment by Friday.",
    "status": "draft"
  }'
```

### 4. Publish a Notice (Teacher)
```bash
curl -X PATCH http://localhost:5000/api/notices/<NOTICE_ID>/publish \
  -H "Authorization: Bearer <TEACHER_TOKEN>"
```

### 5. Create an Event (Teacher)
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Robotics Workshop",
    "description": "Hands-on session with microcontrollers and sensors.",
    "eventDate": "2026-10-25T14:00:00.000Z",
    "location": "Makerspace Lab 4",
    "registrationLink": "https://campusconnect.edu/robotics"
  }'
```

### 6. AI Notice Rewrite (Teacher)
```bash
curl -X POST http://localhost:5000/api/ai/rewrite-notice \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "hey guys bring your lab records tmrw otherwise internal marks will be deducted. also submission before 4pm at room 204."
  }'
```

### 7. Create Opportunity (Teacher)
```bash
curl -X POST http://localhost:5000/api/opportunities \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Apex Analytics",
    "role": "Data Analyst Trainee",
    "description": "SQL and Python data pipeline internship.",
    "eligibility": "60% aggregate in B.Tech/BCA",
    "packageOrStipend": "$1,000 / month",
    "deadline": "2026-11-15T00:00:00.000Z",
    "applicationLink": "https://apex.careers/apply"
  }'
```

### 8. Apply to Opportunity (Student)
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "<OPPORTUNITY_ID>",
    "status": "applied"
  }'
```

### 9. Update Application Status (Teacher)
```bash
curl -X PATCH http://localhost:5000/api/applications/<APPLICATION_ID>/status \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shortlisted"
  }'
```

### 10. Submit Complaint (Student)
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Projector Malfunction",
    "description": "Projector in Room 302 flickers continuously during lectures.",
    "category": "facilities"
  }'
```

### 11. Update Complaint Status & Response (Teacher)
```bash
curl -X PATCH http://localhost:5000/api/complaints/<COMPLAINT_ID>/status \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress",
    "teacherResponse": "AV maintenance ticket #412 has been logged."
  }'
```

---

## 7. Signature AI Features

### Feature 1: AI Adaptive Teaching Roadmap
- **Generate schedule from syllabus (Teacher):**
```bash
curl -X POST http://localhost:5000/api/roadmaps/generate \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Distributed Systems",
    "semester": "Fall 2026",
    "syllabusText": "Module 1: RPC, RMI. Module 2: Raft and Paxos consensus. Module 3: MapReduce and Spark. Module 4: Fault tolerance.",
    "startDate": "2026-09-01T00:00:00.000Z",
    "endDate": "2026-12-15T00:00:00.000Z",
    "classesPerWeek": 3,
    "holidays": [{"date": "2026-10-02T00:00:00.000Z", "name": "National Holiday"}]
  }'
```
- **Mark class complete (Teacher):**
```bash
curl -X PATCH http://localhost:5000/api/roadmaps/<ROADMAP_ID>/sessions/1 \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Covered RPC and message passing"
  }'
```
- **Adaptively reschedule after missed class (Teacher):**
```bash
curl -X POST http://localhost:5000/api/roadmaps/<ROADMAP_ID>/reschedule \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "missedClassNumbers": [4, 5],
    "reason": "Teacher was on conference leave"
  }'
```

### Feature 2: Placement-to-Preparation Engine
- **Generate practice quiz from job opportunity:**
```bash
curl -X POST http://localhost:5000/api/prep/quiz \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "<OPPORTUNITY_ID>",
    "numberOfQuestions": 5
  }'
```
- **Generate mock interview questions:**
```bash
curl -X POST http://localhost:5000/api/prep/mock-interview \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "<OPPORTUNITY_ID>",
    "level": "entry"
  }'
```
- **Generate skill-gap analysis:**
```bash
curl -X POST http://localhost:5000/api/prep/skill-gap \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunityId": "<OPPORTUNITY_ID>",
    "studentSkills": ["Node.js", "Express", "HTML/CSS"],
    "studentExperience": "Completed backend course with one simple REST project"
  }'
```

### Feature 3: AI Assignment Improvement Loop
- **Create assignment with rubric (Teacher):**
```bash
curl -X POST http://localhost:5000/api/assignments \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Database Schema Design & Normalization",
    "description": "Design an e-commerce database schema up to 3NF with indexing strategy.",
    "rubric": "1. 3NF compliance (40pts). 2. Proper foreign keys and constraints (30pts). 3. Query performance & indexing plan (30pts).",
    "deadline": "2026-11-10T23:59:59.000Z",
    "maxScore": 100
  }'
```
- **Request AI feedback loop before submission (Student):**
```bash
curl -X POST http://localhost:5000/api/assignments/<ASSIGNMENT_ID>/ai-feedback \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "draftContent": "Here is my ER schema with Users, Products, and Orders tables. Normalized to 2NF."
  }'
```
- **Submit final assignment (Student):**
```bash
curl -X POST http://localhost:5000/api/assignments/<ASSIGNMENT_ID>/submit \
  -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Final normalized schema: Refactored into 3NF by extracting OrderItems and addresses. Added compound index on (user_id, created_at)."
  }'
```
- **Assign official grade & feedback (Teacher):**
```bash
curl -X PATCH http://localhost:5000/api/assignments/<ASSIGNMENT_ID>/submissions/<SUBMISSION_ID>/grade \
  -H "Authorization: Bearer <TEACHER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "teacherGrade": 98,
    "teacherFeedback": "Excellent 3NF decomposition and thorough indexing plan."
  }'
```
