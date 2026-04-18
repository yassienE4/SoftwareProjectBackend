# API Documentation

This is the canonical HTTP API reference for the backend in this repository.

## Base URL

Local development defaults to:

```http
http://localhost:8080
```

All routes are mounted under `/api`.

## Authentication

Most routes require a JWT access token in the `Authorization` header:

```http
Authorization: Bearer <accessToken>
```

The auth endpoints return an access token and refresh token on signup and login. The refresh endpoint returns a new access token.

## Common Response Shapes

Successful responses usually follow:

```json
{
  "success": true,
  "data": {}
}
```

Error responses usually follow:

```json
{
  "error": "Message here"
}
```

## Roles

- `Admin` can manage users, courses, enrollments, exams, and questions.
- `Instructor` can manage exams and questions for exams they own.
- `Student` can view published exams for enrolled courses and manage their own attempt flow.

## Data Types

- `UserRole`: `Admin | Instructor | Student`
- `ExamStatus`: `Draft | Published | Closed`
- `QuestionType`: `MCQ | TrueFalse`
- `AttemptStatus`: `InProgress | Submitted`

Dates are returned as ISO strings.

## Auth

### Sign up

`POST /api/auth/signup`

Request body:

```json
{
  "email": "student@example.com",
  "name": "Student Name",
  "password": "secret123",
  "role": "Student"
}
```

Notes:

- `role` is optional and defaults to `Student`.
- The response includes user info plus `accessToken`, `refreshToken`, and `expiresIn`.

### Log in

`POST /api/auth/login`

Request body:

```json
{
  "email": "student@example.com",
  "password": "secret123"
}
```

Notes:

- The response includes user info plus `accessToken`, `refreshToken`, and `expiresIn`.

### Refresh access token

`POST /api/auth/refresh`

Request body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "<new-access-token>",
    "expiresIn": 3600
  }
}
```

## Utility

### Home

`GET /api/home`

Public route used as a simple health-style greeting.

### Profile

`GET /api/profile`

Requires authentication.

Returns the decoded JWT user payload.

### Admin dashboard

`GET /api/admin/dashboard`

Requires authentication and the `Admin` role.

## Users

All user-management routes require `Admin` unless otherwise noted.

### List users

`GET /api/users`

Optional query parameter:

- `role=Admin`
- `role=Instructor`
- `role=Student`

### Get user by id

`GET /api/users/:id`

Access rules:

- `Admin` can read any user.
- Non-admin users can only read their own profile.

### Create user

`POST /api/users`

Request body:

```json
{
  "email": "instructor@example.com",
  "name": "Instructor Name",
  "password": "secret123",
  "role": "Instructor"
}
```

Notes:

- If `role` is omitted, it defaults to `Student`.
- Passwords are hashed before saving.

### Update user

`PATCH /api/users/:id`

Request body can include:

```json
{
  "email": "new@example.com",
  "name": "New Name",
  "role": "Student",
  "password": "new-password"
}
```

Notes:

- `password` is an admin override and updates the stored password hash.

### Delete user

`DELETE /api/users/:id`

Deletes a user permanently.

## Courses

### List all courses

`GET /api/courses`

Requires `Admin`.

### List my courses

`GET /api/courses/me`

Requires authentication.

Returns the courses the current user is enrolled in.

### Create course

`POST /api/courses`

Requires `Admin`.

Request body:

```json
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "description": "Optional course description"
}
```

### Enroll users in a course

`POST /api/courses/:id/enrollments`

Requires `Admin`.

Request body can use a single id or multiple ids:

```json
{
  "userId": 12
}
```

or:

```json
{
  "userIds": [12, 15, 18]
}
```

### Unenroll a user from a course

`DELETE /api/courses/:id/enrollments/:userId`

Requires `Admin`.

## Exams

### List exams

`GET /api/exams`

Access rules:

- `Admin` sees all exams.
- `Instructor` sees only exams they own.
- `Student` sees only published exams for courses they are enrolled in.

### Create exam

`POST /api/exams`

Allowed roles:

- `Instructor`
- `Admin`

Request body:

```json
{
  "title": "Midterm Exam",
  "description": "Chapters 1 to 5",
  "courseId": 3,
  "durationMinutes": 60,
  "availabilityStart": "2026-03-25T08:00:00.000Z",
  "availabilityEnd": "2026-03-25T10:00:00.000Z",
  "status": "Draft",
  "instructorId": 7
}
```

Notes:

- `instructorId` is required when an admin creates the exam.
- Instructors must be enrolled in the course they are assigning the exam to.
- Availability dates are optional.

### Get exam by id

`GET /api/exams/:id`

Access rules:

- `Student` can only access published exams for enrolled courses.
- `Instructor` can only access exams they own.
- `Admin` can access any exam.

### Update exam

`PATCH /api/exams/:id`

Allowed roles:

- `Instructor`
- `Admin`

Request body can include:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "courseId": 4,
  "durationMinutes": 75,
  "availabilityStart": "2026-03-25T08:00:00.000Z",
  "availabilityEnd": "2026-03-25T10:00:00.000Z",
  "status": "Published"
}
```

### Delete exam

`DELETE /api/exams/:id`

Allowed roles:

- `Instructor`
- `Admin`

Instructors can only delete exams they own.

## Questions

Question routes are nested under an exam.

### List questions for an exam

`GET /api/exams/:id/questions`

Access rules:

- `Student` can only access published exams for enrolled courses.
- `Instructor` can only access exams they own.
- `Admin` can access any exam.

### Create question

`POST /api/exams/:id/questions`

Allowed roles:

- `Instructor`
- `Admin`

Request body:

```json
{
  "order": 1,
  "type": "MCQ",
  "questionText": "What is 2 + 2?",
  "options": ["1", "2", "3", "4"],
  "correctAnswer": "4",
  "points": 1
}
```

Notes:

- `order` is unique per exam.
- `options` should contain the answer choices.
- `points` defaults to `1` if omitted.

### Update question

`PATCH /api/exams/:id/questions/:questionId`

Allowed roles:

- `Instructor`
- `Admin`

Request body can include:

```json
{
  "order": 2,
  "type": "TrueFalse",
  "questionText": "The earth is round.",
  "options": ["True", "False"],
  "correctAnswer": "True",
  "points": 2
}
```

### Delete question

`DELETE /api/exams/:id/questions/:questionId`

Allowed roles:

- `Instructor`
- `Admin`

## Student Exam Flow

### Start exam attempt

`POST /api/exams/:id/start`

Allowed roles:

- `Student`

Rules enforced by the backend:

- The exam must be `Published`.
- The student must be enrolled in the exam's course.
- The current time must be inside the availability window if one exists.
- Only one attempt is allowed per student per exam.

Response example:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "examId": 5,
    "studentId": 12,
    "status": "InProgress",
    "answers": null,
    "score": null,
    "startedAt": "2026-04-18T12:00:00.000Z",
    "submittedAt": null
  }
}
```

### Submit exam attempt

`POST /api/exams/:id/submit`

Allowed roles:

- `Student`

Request body:

```json
{
  "answers": {
    "1": "4",
    "2": "True"
  }
}
```

Notes:

- Keys in `answers` must match question ids as strings.
- The backend scores answers by comparing string values.
- The attempt must already exist for that student and exam.

## Error Cases

Typical error responses include:

```json
{
  "error": "Invalid exam ID"
}
```

Common messages:

- `Access token required`
- `Invalid or expired token`
- `Access denied`
- `Not found`
- `Exam not found`
- `Question not found`
- `Attempt not found`
- `Attempt already submitted`

## Notes for Frontend Integration

Recommended flow:

1. Admin creates courses.
2. Admin enrolls instructors and students into courses.
3. Instructor creates an exam and adds questions.
4. Instructor publishes the exam.
5. Student lists available exams, starts an attempt, and submits answers.

If you want this converted into an OpenAPI/Swagger spec next, that can be generated from the same route set.