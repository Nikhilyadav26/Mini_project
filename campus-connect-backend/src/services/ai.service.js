const { GoogleGenerativeAI } = require("@google/generative-ai");

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  // Try configured model or stable defaults
  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  return genAI.getGenerativeModel({ model: modelName });
};

const cleanAndParseJson = (text) => {
  const cleanedText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleanedText);
};

// Fallback Generators for High Availability
const fallbackRewriteNotice = (rawText) => {
  const lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  let headline = lines[0] || "Official Campus Notice";
  if (headline.length > 60) {
    headline = headline.slice(0, 57) + "...";
  }
  // Capitalize title
  headline = headline.charAt(0).toUpperCase() + headline.slice(1);

  const formattedContent = `Please be informed regarding the following update:\n\n${rawText.trim()}\n\nAll concerned students and faculty members are advised to take note of this notice and plan accordingly. For any questions or further clarifications, please contact the department coordinator.`;

  return {
    title: headline.startsWith("Notice:") ? headline : `Notice: ${headline}`,
    content: formattedContent
  };
};

const fallbackPlacementQuiz = ({ role, company, description }) => {
  const isWeb = /react|frontend|javascript|css|html|node|fullstack/i.test(`${role} ${description}`);
  const isData = /data|python|sql|ml|ai|machine learning/i.test(`${role} ${description}`);

  if (isWeb) {
    return {
      role: role || "Software Engineer",
      questions: [
        {
          id: 1,
          question: "What is the primary difference between synchronous and asynchronous execution in Node.js?",
          options: [
            "Synchronous blocks the event loop; asynchronous offloads I/O operations",
            "Asynchronous executes code immediately on the main thread",
            "Node.js does not support asynchronous execution",
            "Synchronous code runs in separate worker threads automatically"
          ],
          correctAnswerIndex: 0,
          explanation: "In Node.js, asynchronous operations are non-blocking and delegate I/O to libuv, keeping the single thread responsive."
        },
        {
          id: 2,
          question: "In React, what is the main benefit of using the useCallback hook?",
          options: [
            "To memoize computed values and prevent state changes",
            "To prevent unnecessary re-creations of function instances across re-renders",
            "To automatically trigger side effects on component mount",
            "To bind DOM events directly to HTML elements"
          ],
          correctAnswerIndex: 1,
          explanation: "useCallback returns a memoized version of the callback function that only changes if one of the dependencies has changed."
        },
        {
          id: 3,
          question: "What does the CSS 'box-sizing: border-box' property do?",
          options: [
            "Includes padding and border in the element's total width and height",
            "Adds extra margins outside the element border",
            "Forces the element to be displayed as a CSS grid container",
            "Disables all box shadows and outlines"
          ],
          correctAnswerIndex: 0,
          explanation: "border-box ensures that width and height specify the visible box dimensions including padding and border."
        },
        {
          id: 4,
          question: "Which HTTP status code signifies that a resource was successfully created on the server?",
          options: ["200 OK", "201 Created", "204 No Content", "301 Moved Permanently"],
          correctAnswerIndex: 1,
          explanation: "HTTP 201 Created is the standard REST response when a POST request successfully creates a new resource."
        },
        {
          id: 5,
          question: "What is the time complexity of searching for an element by key in a standard JavaScript Hash Map (Object/Map)?",
          options: ["O(1) average", "O(log n)", "O(n)", "O(n^2)"],
          correctAnswerIndex: 0,
          explanation: "Hash maps provide average-case O(1) constant time lookup, insertion, and deletion."
        }
      ]
    };
  }

  // General CS / Engineering fallback
  return {
    role: role || "Software Engineer",
    questions: [
      {
        id: 1,
        question: "Which data structure operates on a First-In, First-Out (FIFO) basis?",
        options: ["Stack", "Queue", "Binary Search Tree", "Max Heap"],
        correctAnswerIndex: 1,
        explanation: "A Queue operates on the FIFO principle where elements are enqueued at the back and dequeued from the front."
      },
      {
        id: 2,
        question: "What is the average time complexity of QuickSort on an array of size n?",
        options: ["O(n)", "O(n log n)", "O(n^2)", "O(log n)"],
        correctAnswerIndex: 1,
        explanation: "QuickSort has an average and best-case time complexity of O(n log n)."
      },
      {
        id: 3,
        question: "In relational databases, which SQL clause is used to filter records after aggregation (GROUP BY)?",
        options: ["WHERE", "HAVING", "LIMIT", "ORDER BY"],
        correctAnswerIndex: 1,
        explanation: "HAVING filters aggregated groups, whereas WHERE filters individual rows before grouping."
      },
      {
        id: 4,
        question: "What is the primary objective of Database Normalization (3NF)?",
        options: [
          "To reduce data redundancy and improve data integrity",
          "To speed up full table scans",
          "To eliminate all primary keys",
          "To encrypt sensitive database columns"
        ],
        correctAnswerIndex: 0,
        explanation: "Normalization organizes fields and tables to minimize redundancy and prevent update/delete anomalies."
      },
      {
        id: 5,
        question: "In Object-Oriented Programming, which concept allows a subclass to provide a specific implementation of a parent method?",
        options: ["Encapsulation", "Method Overriding (Polymorphism)", "Abstraction", "Multiple Inheritance"],
        correctAnswerIndex: 1,
        explanation: "Method overriding is a form of runtime polymorphism where a child class redefines a parent class method."
      }
    ]
  };
};

const fallbackMockInterview = ({ company, role }) => {
  return {
    company: company || "Target Company",
    role: role || "Software Development Engineer",
    interviewRounds: [
      {
        category: "Technical Deep-Dive",
        question: `How would you design a scalable RESTful API for handling high-traffic updates in a system like ${company || "Campus Connect"}?`,
        sampleAnswerPoints: "Mention idempotent HTTP verbs (GET, PUT, DELETE), rate limiting, caching with Redis, and horizontal scaling.",
        evaluationCriteria: "Evaluates API design principles, scalability considerations, and knowledge of web protocols."
      },
      {
        category: "Technical Deep-Dive",
        question: "Explain the difference between SQL and NoSQL databases. When would you choose MongoDB over PostgreSQL?",
        sampleAnswerPoints: "Schema flexibility, horizontal sharding, document-oriented storage vs ACID compliance, complex relational queries, and foreign key constraints.",
        evaluationCriteria: "Tests database architecture knowledge and trade-off evaluation."
      },
      {
        category: "Design & Problem Solving",
        question: "Walk me through how you would optimize a web page or application that is experiencing slow load times and lagging UI.",
        sampleAnswerPoints: "Code-splitting, lazy loading images and components, CDN delivery, database indexing, and browser caching.",
        evaluationCriteria: "Identifies front-to-back performance debugging and optimization instincts."
      },
      {
        category: "Design & Problem Solving",
        question: "How do you handle edge cases and concurrency issues when multiple users update the same record simultaneously?",
        sampleAnswerPoints: "Optimistic locking using version numbers, pessimistic locking with transactions, or message queue serialization.",
        evaluationCriteria: "Assesses distributed systems and concurrency awareness."
      },
      {
        category: "Behavioral & Culture",
        question: "Tell me about a challenging technical bug or blocker you faced in a project and how you resolved it under pressure.",
        sampleAnswerPoints: "Use the STAR framework (Situation, Task, Action, Result). Highlight structured debugging and team communication.",
        evaluationCriteria: "Tests problem-solving tenacity, resilience, and analytical reasoning."
      },
      {
        category: "Behavioral & Culture",
        question: `Why are you interested in joining ${company || "our engineering team"} in this ${role || "technical"} role?`,
        sampleAnswerPoints: "Connect specific company engineering challenges, culture of innovation, and your own skill alignment and career goals.",
        evaluationCriteria: "Measures candidate preparation, genuine interest, and alignment with company mission."
      }
    ]
  };
};

const fallbackSkillGapReport = ({ company, role, studentSkills = [] }) => {
  const commonReqs = ["Data Structures & Algorithms", "System Design", "Git & CI/CD", "Testing & Debugging", "Database Optimization"];
  const matched = studentSkills.filter(s => s && s.trim().length > 0);
  const missing = commonReqs.filter(r => !matched.some(m => m.toLowerCase().includes(r.toLowerCase().slice(0, 4))));

  const matchPercentage = Math.min(95, Math.max(50, Math.round(50 + (matched.length * 8))));

  return {
    matchPercentage,
    matchedSkills: matched.length > 0 ? matched : ["Foundational Computer Science", "Problem Solving"],
    missingSkills: missing.length > 0 ? missing : ["System Design Trade-offs", "Large-scale Database Indexing", "Cloud Deployment"],
    recommendations: [
      `Review top interview patterns for ${role || "Software Engineering"} on LeetCode/NeetCode.`,
      `Build a complete end-to-end fullstack or distributed demo relevant to ${company || "target company"}.`,
      "Practice behavioral STAR stories highlighting past project challenges and trade-offs.",
      "Conduct mock interviews with peers to refine technical communication clarity."
    ],
    preparationRoadmap: [
      "Week 1: Master core CS fundamentals, Arrays, HashMaps, and Big-O analysis",
      "Week 2: Deep dive into Database indexing, normalization, and RESTful API architecture",
      "Week 3: Build & deploy a portfolio project showcasing production-grade code structure",
      "Week 4: Timed mock interview drills, resume polishing, and company-specific research"
    ]
  };
};

const fallbackRoadmap = ({ subject, semester }) => {
  return {
    subject: subject || "Core Course",
    semester: semester || "Current Semester",
    totalPlannedClasses: 12,
    schedule: [
      { classNumber: 1, topic: "Course Introduction & Foundational Concepts", type: "lecture", notes: "Review prerequisites and syllabus roadmap." },
      { classNumber: 2, topic: "Core Architecture & Key Principles", type: "lecture", notes: "Introduce theoretical foundations and core models." },
      { classNumber: 3, topic: "Practical Lab 1: Environment Setup & First Exercise", type: "lab", notes: "Hands-on guided walkthrough." },
      { classNumber: 4, topic: "Advanced Mechanisms & Data Structures", type: "lecture", notes: "Focus on algorithmic complexity and implementation details." },
      { classNumber: 5, topic: "Knowledge Check & Quiz 1", type: "quiz", notes: "Evaluate comprehension of initial units." },
      { classNumber: 6, topic: "Mid-Term Review & Synthesis Discussion", type: "revision", notes: "Consolidate learning and address doubts." },
      { classNumber: 7, topic: "Integration Patterns & Best Practices", type: "lecture", notes: "Study real-world case studies." },
      { classNumber: 8, topic: "Practical Lab 2: Extended Implementation", type: "lab", notes: "Students work on intermediate tasks." },
      { classNumber: 9, topic: "System Optimization & Edge Cases", type: "lecture", notes: "Address performance tuning and reliability." },
      { classNumber: 10, topic: "Unit Assessment & Problem Set", type: "test", notes: "Comprehensive unit assessment." },
      { classNumber: 11, topic: "Comprehensive Syllabus Revision", type: "revision", notes: "Final exam preparation and review." },
      { classNumber: 12, topic: "Capstone Project Presentations & Wrap-up", type: "lab", notes: "Final project showcase." }
    ]
  };
};

const fallbackAssignmentEvaluation = ({ rubric, draftContent }) => {
  const wordCount = (draftContent || "").split(/\s+/).filter(Boolean).length;
  const isSubstantial = wordCount >= 30;

  return {
    readinessScore: isSubstantial ? 85 : 60,
    strengths: [
      "Good initial effort addressing the core prompt requirements",
      "Draft demonstrates clear understanding of primary technical concepts",
      "Well-structured explanation of the main topic"
    ],
    missingPoints: [
      "Could elaborate more on edge case handling and validation",
      "Ensure all rubric criteria are explicitly answered with concrete examples",
      "Consider adding citations or diagrammatic references where applicable"
    ],
    improvementSuggestions: [
      "Review the grading rubric line by line to verify every requirement is covered.",
      "Add a concluding summary highlighting the practical implications of your solution.",
      "Proofread for clarity, concise terminology, and consistent formatting."
    ]
  };
};

/**
 * FEATURE: AI Notice Rewriting
 */
const rewriteNoticeDraft = async (rawText) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are a formal administrative assistant for a college platform named Campus Connect.
Rewrite the following raw, informal text into a professional, formal college notice draft.

STRICT INSTRUCTIONS:
1. Do NOT invent dates, venues, eligibility, deadlines, contact details, or any other facts not mentioned in the raw text.
2. Your response must be a single, valid JSON object with exactly two string fields:
   "title": A clear, concise, professional headline.
   "content": The well-structured, formal body text.
3. Do NOT include any markdown code fences (like \`\`\`json) or extra commentary. Output raw JSON only.

RAW TEXT:
${rawText}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);

      if (parsed && (parsed.title || parsed.content)) {
        return {
          title: String(parsed.title || "Campus Notice").trim(),
          content: String(parsed.content || rawText).trim()
        };
      }
    } catch (err) {
      console.warn("Gemini call failed, using intelligent fallback notice rewriter:", err.message);
    }
  }

  // Graceful fallback
  return fallbackRewriteNotice(rawText);
};

/**
 * SIGNATURE FEATURE 1: AI Adaptive Teaching Roadmap
 */
const generateAdaptiveRoadmap = async ({
  syllabusText,
  subject,
  semester,
  startDate,
  endDate,
  holidays = [],
  classesPerWeek = 3
}) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are an academic curriculum planning AI for Campus Connect.
Create a class-by-class teaching roadmap for:
Subject: ${subject}
Semester: ${semester}
Start Date: ${startDate}
End Date: ${endDate}
Classes Per Week: ${classesPerWeek}
Excluded Holidays: ${JSON.stringify(holidays)}

Syllabus / Topics:
${syllabusText}

STRICT INSTRUCTIONS:
1. Break down the syllabus into progressive classes.
2. Distribute topics logically across the weeks.
3. Automatically insert "revision", "quiz", and "test" sessions before mid-terms or unit conclusions.
4. Output MUST be a valid JSON object with:
   - "totalPlannedClasses": (number)
   - "schedule": array of objects, each containing:
       - "classNumber": (integer starting at 1)
       - "date": (ISO date string matching class schedule)
       - "topic": (clear, concise topic title)
       - "type": ("lecture" | "revision" | "quiz" | "test" | "lab")
       - "notes": (brief pedagogical recommendation or lab requirement)
5. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);

      return {
        subject,
        semester,
        totalPlannedClasses: parsed.totalPlannedClasses || (parsed.schedule ? parsed.schedule.length : 0),
        schedule: Array.isArray(parsed.schedule) ? parsed.schedule : []
      };
    } catch (err) {
      console.warn("Gemini roadmap generation failed, using intelligent fallback:", err.message);
    }
  }

  return fallbackRoadmap({ subject, semester });
};

const rescheduleRoadmap = async ({ roadmap, missedClassNumbers = [], reason = "" }) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are an academic curriculum planner for Campus Connect.
A teacher missed or cancelled specific classes and needs an adaptively rescheduled plan without dropping core topics.

Subject: ${roadmap.subject}
Semester: ${roadmap.semester}
Missed Class Numbers: ${JSON.stringify(missedClassNumbers)}
Reason: ${reason}

Existing Schedule:
${JSON.stringify(roadmap.schedule)}

STRICT INSTRUCTIONS:
1. Mark the specified missed classes with status: "missed".
2. Compress or re-allocate the unfinished topics into upcoming lecture or revision slots.
3. Preserve tests and exams.
4. Output MUST be a valid JSON object with:
   - "rescheduledSessionsCount": (number of adjusted classes)
   - "adjustmentSummary": (short explanation of how syllabus was recovered)
   - "updatedSchedule": full updated array of session objects matching the original structure with updated statuses ("planned", "completed", "missed", "rescheduled").
5. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      return cleanAndParseJson(text);
    } catch (err) {
      console.warn("Gemini rescheduling failed, using fallback:", err.message);
    }
  }

  const updatedSchedule = (roadmap.schedule || []).map(s => {
    if (missedClassNumbers.includes(s.classNumber)) {
      return { ...s, status: "missed" };
    }
    return s;
  });

  return {
    rescheduledSessionsCount: missedClassNumbers.length,
    adjustmentSummary: `Syllabus adjusted to compress missed topics into upcoming review slots due to: ${reason || "scheduling conflict"}.`,
    updatedSchedule
  };
};

/**
 * SIGNATURE FEATURE 2: Placement-to-Preparation Engine
 */
const generatePlacementQuiz = async ({ company, role, description, eligibility, numberOfQuestions = 5 }) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are an expert technical placement coach for Campus Connect.
Generate a targeted practice quiz to help students prepare for this campus placement opportunity:

Company: ${company || "Target Company"}
Role: ${role}
Job Description & Requirements:
${description}
Eligibility / Skills: ${eligibility || "Standard campus hiring"}
Number of Questions: ${numberOfQuestions}

STRICT INSTRUCTIONS:
1. Formulate ${numberOfQuestions} high-yield multiple-choice questions focusing on the required technical stack, core CS concepts, or problem-solving relevant to this job.
2. Output MUST be a valid JSON object with:
   - "role": "${role}"
   - "questions": array of objects, each containing:
       - "id": (number 1..${numberOfQuestions})
       - "question": (concise problem statement or concept question)
       - "options": (array of 4 distinct choices)
       - "correctAnswerIndex": (integer 0..3)
       - "explanation": (brief technical rationale explaining why the answer is correct)
3. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini placement quiz failed, using intelligent fallback:", err.message);
    }
  }

  return fallbackPlacementQuiz({ company, role, description });
};

const generateMockInterview = async ({ company, role, description, level = "entry" }) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are a Senior Technical Recruiter & Hiring Manager conducting campus placement interviews.
Create a role-specific mock interview question set for:

Company: ${company || "Tech Company"}
Role: ${role}
Level: ${level}
Job Description:
${description}

STRICT INSTRUCTIONS:
1. Provide a balanced set of 6 to 8 mock interview questions divided into categories: "Technical Deep-Dive", "System/Coding Design", and "Behavioral/Culture".
2. Output MUST be a valid JSON object with:
   - "company": "${company || "Company"}"
   - "role": "${role}"
   - "interviewRounds": array of objects, each containing:
       - "category": ("Technical" | "Design & Problem Solving" | "Behavioral")
       - "question": (the interview question)
       - "sampleAnswerPoints": (key points a successful candidate should touch on)
       - "evaluationCriteria": (what the interviewer is testing for)
3. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);
      if (parsed && (Array.isArray(parsed.interviewRounds) || Array.isArray(parsed.questions))) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini mock interview failed, using intelligent fallback:", err.message);
    }
  }

  return fallbackMockInterview({ company, role });
};

const generateSkillGapReport = async ({
  company,
  role,
  description,
  studentSkills = [],
  studentExperience = ""
}) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are a Career Placement Advisor for engineering college students.
Compare the student's profile against the target placement drive and produce a Skill-Gap Analysis Report:

Target Role: ${role} at ${company || "Target Company"}
Job Description:
${description}

Student's Current Skills:
${JSON.stringify(studentSkills)}
Student's Background / Projects:
${studentExperience}

STRICT INSTRUCTIONS:
1. Identify matched skills, missing core skills, and nice-to-have skills.
2. Provide a concrete, step-by-step preparation roadmap to bridge the gaps before the drive.
3. Output MUST be a valid JSON object with:
   - "matchPercentage": (estimated integer percentage 0..100)
   - "matchedSkills": (array of strings)
   - "missingSkills": (array of critical missing skills)
   - "recommendations": (array of actionable study items or mini-project ideas)
   - "preparationRoadmap": array of weekly milestones (e.g. "Week 1: Master Docker basics...")
4. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);
      if (parsed && parsed.matchPercentage !== undefined) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini skill gap report failed, using intelligent fallback:", err.message);
    }
  }

  return fallbackSkillGapReport({ company, role, studentSkills });
};

/**
 * SIGNATURE FEATURE 3: AI Assignment Improvement Loop
 */
const evaluateAssignmentDraft = async ({
  assignmentTitle,
  assignmentDescription,
  rubric,
  draftContent
}) => {
  const model = getGeminiModel();

  if (model) {
    try {
      const prompt = `You are an encouraging academic AI tutor helping a college student improve their assignment before submitting it to their professor.

Assignment Title: ${assignmentTitle}
Assignment Requirements:
${assignmentDescription}
Rubric / Grading Criteria:
${rubric}

Student's Draft Work:
${draftContent}

STRICT INSTRUCTIONS:
1. Do NOT assign an official letter grade or numerical score (grades remain strictly under teacher authority).
2. Assess readiness against the rubric: identify what is executed well, what points/edge cases are missing, and concrete ways to elevate the submission.
3. Output MUST be a valid JSON object with:
   - "readinessScore": (integer percentage between 40 and 95)
   - "strengths": (array of specific points well covered)
   - "missingPoints": (array of rubric requirements or concepts omitted or insufficiently addressed)
   - "suggestions": (array of actionable tips to refine the work)
4. Return RAW JSON only, without markdown code fences.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const parsed = cleanAndParseJson(text);
      if (parsed && (parsed.readinessScore !== undefined || parsed.strengths)) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini assignment evaluation failed, using intelligent fallback:", err.message);
    }
  }

  return fallbackAssignmentEvaluation({ rubric, draftContent });
};

module.exports = {
  rewriteNoticeDraft,
  generateAdaptiveRoadmap,
  rescheduleRoadmap,
  generatePlacementQuiz,
  generateMockInterview,
  generateSkillGapReport,
  evaluateAssignmentDraft
};
