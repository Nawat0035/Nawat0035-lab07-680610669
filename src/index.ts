
import express, { type Request, type Response } from "express";
import morgan from "morgan";

import { students } from "@db/db.js";
import { type Student } from "@libs/types.js";
import {
  zStudentDeleteBody,
  zStudentPostBody,
  zStudentPutBody,
} from "@libs/studentValidator.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(morgan("dev"));
app.use(express.json());

// GET /
app.get("/", (_req: Request, res: Response) => {
  return res.send("API services for Student Data");
});

// GET /api/students
// Get all students or filter by studentId and/or program
app.get("/api/students", (req: Request, res: Response) => {
  const studentId = req.query.studentId;
  const program = req.query.program;

  // Validate studentId query parameter if provided
  if (studentId !== undefined) {
    if (
      typeof studentId !== "string" ||
      !/^\d{9}$/.test(studentId)
    ) {
      return res.status(400).json({
        ok: false,
        message: "Student Id must contain 9 characters",
      });
    }
  }

  // Filter using both conditions when both are provided
  let filteredStudents = [...students];

  if (typeof studentId === "string") {
    filteredStudents = filteredStudents.filter(
      (student) => student.studentId === studentId
    );
  }

  if (typeof program === "string") {
    filteredStudents = filteredStudents.filter(
      (student) => student.program === program
    );
  }

  return res.status(200).json({
    ok: true,
    students: filteredStudents,
  });
});

// POST /api/students
// Add a new student
app.post("/api/students", (req: Request, res: Response) => {
  const result = zStudentPostBody.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      errors: result.error.issues[0]?.message,
    });
  }

  const body = result.data;

  const found = students.find(
    (student) => student.studentId === body.studentId
  );

  if (found) {
    return res.status(409).json({
      ok: false,
      message: "Student already exists",
    });
  }

  const newStudent = body as Student;
  students.push(newStudent);

  res.set("Link", `/api/students?studentId=${newStudent.studentId}`);

  return res.status(201).json({
    ok: true,
    student: newStudent,
  });
});

// PUT /api/students
// Update an existing student
app.put("/api/students", (req: Request, res: Response) => {
  const result = zStudentPutBody.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      ok: false,
      message: "Validation failed",
      errors: result.error.issues[0]?.message,
    });
  }

  const body = result.data;

  const foundIndex = students.findIndex(
    (student) => student.studentId === body.studentId
  );

  if (foundIndex === -1) {
    return res.status(404).json({
      ok: false,
      message: "Student ID does not exist",
    });
  }

  const currentStudent = students[foundIndex];

  if (!currentStudent) {
    return res.status(404).json({
      ok: false,
      message: "Student ID does not exist",
    });
  }

  const updatedStudent: Student = {
    ...currentStudent,
    ...(body.firstName != null && {
      firstName: body.firstName,
    }),
    ...(body.lastName != null && {
      lastName: body.lastName,
    }),
    ...(body.program != null && {
      program: body.program,
    }),
    ...(body.programId != null && {
      programId: body.programId,
    }),
  };

  students[foundIndex] = updatedStudent;

  res.set("Link", `/api/students?studentId=${body.studentId}`);

  return res.status(200).json({
    ok: true,
    message: `Student ${body.studentId} has been updated successfully`,
    student: updatedStudent,
  });
});

// DELETE /api/students
// Delete a student using studentId in the request body
app.delete("/api/students", (req: Request, res: Response) => {
  const result = zStudentDeleteBody.safeParse(req.body);

  // Invalid request body or studentId
  if (!result.success) {
    return res.status(400).json({
      ok: false,
      message:
        result.error.issues[0]?.message ??
        "Invalid student ID",
    });
  }

  const { studentId } = result.data;

  const foundIndex = students.findIndex(
    (student) => student.studentId === studentId
  );

  // Student not found
  if (foundIndex === -1) {
    return res.status(404).json({
      ok: false,
      message: "Student ID does not exist",
    });
  }

  // Delete the student from the array
  students.splice(foundIndex, 1);

  return res.status(200).json({
    ok: true,
    message: `Student Id ${studentId} has been deleted`,
  });
});

// GET /api/me
// Return information about the API author
app.get("/api/me", (_req: Request, res: Response) => {
  return res.status(200).json({
    ok: true,
    fullName: "ณวัฒน์ เรืองเดชาวิวัฒน์",
    studentId: "680610669",
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
