Perfect! Based on your **Role-Based Secure Examination System** requirements, I can draft a clear **MVP-level full-stack design** for your project structured as you requested: **Backend**, **Frontend**, and **Database**. I’ll focus on clarity and practicality so your team can directly implement it.

---

## **Project Design: Role-Based Secure Examination System**

---

## **1. Backend**

**Tech Stack Suggestion:** Node.js + Express (or NestJS if you want structure) + TypeScript, JWT for authentication, Nodemailer for email.

### **Models**

| Model                  | Attributes                                                                                                           | Notes                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **User**               | id, name, email, passwordHash, role (Admin / Instructor / Student), createdAt, updatedAt                             | role-based access control               |
| **Exam**               | id, title, instructorId (FK), durationMinutes, availabilityStart, availabilityEnd, createdAt, updatedAt              | linked to instructor                    |
| **Question**           | id, examId (FK), type (MCQ / TrueFalse), questionText, options (array), correctAnswer                                | options stored as array                 |
| **ExamAttempt**        | id, examId (FK), studentId (FK), answers (JSON), startTime, endTime, score, status (Pending/Submitted/AutoSubmitted) | tracks each student's attempt           |
| **Role**               | id, name                                                                                                             | optional separate table for flexibility |
| **PasswordResetToken** | id, userId (FK), token, expiresAt                                                                                    | optional for password reset feature     |

---

### **Services**

| Service                | Responsibility                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **AuthService**        | Handle login, logout, JWT generation, password hashing, password reset via email                   |
| **UserService**        | CRUD users, assign roles, retrieve user info                                                       |
| **ExamService**        | Create/update/delete exams, fetch exams for instructors & students, validate availability          |
| **QuestionService**    | CRUD questions, associate with exams                                                               |
| **ExamAttemptService** | Start exam, record answers, auto-submit after duration, prevent multiple attempts, calculate score |
| **EmailService**       | Send password reset emails, notifications                                                          |

---

### **APIs (Endpoints)**

**Auth**

* POST `/auth/login` → returns JWT
* POST `/auth/logout` → invalidate JWT
* POST `/auth/reset-password-request` → send email token
* POST `/auth/reset-password` → update password

**Users**

* GET `/users/` → Admin only, list users
* POST `/users/` → Admin only, create user
* PATCH `/users/:id` → Admin only, update user role
* GET `/users/:id` → get user details

**Exams**

* GET `/exams/` → list exams (filtered by role)
* POST `/exams/` → Instructor only, create exam
* PATCH `/exams/:id` → Instructor only, update exam
* DELETE `/exams/:id` → Instructor only, delete exam

**Questions**

* GET `/exams/:examId/questions/` → fetch questions
* POST `/exams/:examId/questions/` → Instructor only
* PATCH `/questions/:id` → Instructor only
* DELETE `/questions/:id` → Instructor only

**Exam Attempts**

* POST `/exams/:examId/start` → student starts exam
* POST `/exams/:examId/submit` → submit answers
* GET `/exams/:examId/results` → instructor views grades
* GET `/exams/:examId/attempts/:studentId` → student views own result

---

## **2. Frontend**

**Tech Stack Suggestion:** React + TypeScript + TailwindCSS, optional Redux/Context for state.

### **Fetch Functions (API Calls)**

```ts
async function login(email: string, password: string) { ... }
async function fetchExams() { ... }
async function fetchExamQuestions(examId: string) { ... }
async function startExam(examId: string) { ... }
async function submitExam(examId: string, answers: any) { ... }
async function fetchResults(examId: string) { ... }
async function createExam(examData: any) { ... }
```

---

### **Pages / Views**

| Page                   | Role                     | Description                                                             |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------- |
| **LoginPage**          | All                      | User authentication                                                     |
| **Dashboard**          | Admin/Instructor/Student | Shows role-specific data: exams created, exams assigned, upcoming exams |
| **ExamCreationPage**   | Instructor               | Form to create exam, add questions                                      |
| **ExamPage**           | Student                  | Exam interface: countdown timer, question navigation, answer submission |
| **ResultsPage**        | Student                  | Show score & review answers                                             |
| **GradebookPage**      | Instructor               | View all students' attempts & scores                                    |
| **UserManagementPage** | Admin                    | Create/update users and roles                                           |

---

### **Overall Look (UI Ideas)**

* Clean, minimalistic design using TailwindCSS
* Left sidebar with role-specific navigation
* Card-based exam lists
* Countdown timer fixed at top-right during exam
* Modal popups for submitting / auto-submitting exams
* Color-coded grading results (green-pass, red-fail)
* Mobile-friendly layout for accessibility

---

## **3. Database (Schema)**

**ER Diagram / Table Relationships (simplified)**

```
User (1) ---< Exam (Instructor) >--- Question
User (Student) ---< ExamAttempt ---< QuestionAnswers (embedded in ExamAttempt)
Role (1) ---< User
PasswordResetToken (1) --- User (1)
```

**Table Schemas (SQL-like)**

```sql
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    passwordHash VARCHAR(255),
    role VARCHAR(20) CHECK(role IN ('Admin','Instructor','Student')),
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Exams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    instructorId INT REFERENCES Users(id),
    durationMinutes INT,
    availabilityStart TIMESTAMP,
    availabilityEnd TIMESTAMP,
    createdAt TIMESTAMP DEFAULT NOW(),
    updatedAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE Questions (
    id SERIAL PRIMARY KEY,
    examId INT REFERENCES Exams(id),
    type VARCHAR(20) CHECK(type IN ('MCQ','TrueFalse')),
    questionText TEXT,
    options JSONB,
    correctAnswer JSONB
);

CREATE TABLE ExamAttempts (
    id SERIAL PRIMARY KEY,
    examId INT REFERENCES Exams(id),
    studentId INT REFERENCES Users(id),
    answers JSONB,
    startTime TIMESTAMP,
    endTime TIMESTAMP,
    score FLOAT,
    status VARCHAR(20) CHECK(status IN ('Pending','Submitted','AutoSubmitted'))
);

CREATE TABLE PasswordResetTokens (
    id SERIAL PRIMARY KEY,
    userId INT REFERENCES Users(id),
    token VARCHAR(255),
    expiresAt TIMESTAMP
);
```

---

✅ **This design covers:**

* Role-based access control (Admin, Instructor, Student)
* Exam creation and attempt management
* Automatic grading & secure result storage
* Minimal, clean frontend design
* Fully structured backend and database for MVP implementation

---

If you want, I can **also draft a full EPIC-level backlog and sprint plan for 2-week sprints** tailored to this design. This will match your course deliverables and make project management much easier.

Do you want me to do that next?
