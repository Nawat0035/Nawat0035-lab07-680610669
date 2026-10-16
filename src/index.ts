
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
// Get all students, filter by studentId and/or program
app.get("/api/students", (req: Request, res: Response) => {
  try {
    const studentId = req.query.studentId;
    const program = req.query.program;

    let filteredStudents = [...students];

    if (typeof studentId === "string" && studentId !== "") {
      filteredStudents = filteredStudents.filter(
        (student) => student.studentId === studentId
      );
    }

    if (typeof program === "string" && program !== "") {
      filteredStudents = filteredStudents.filter(
        (student) => student.program === program
      );
    }

    return res.status(200).json({
      ok: true,
      students: filteredStudents,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Something went wrong, please try again",
    });
  }
});

// POST /api/students
// Add a new student
app.post("/api/students", (req: Request, res: Response) => {
  try {
    const result = zStudentPostBody.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    const body = result.data as Student;

    const found = students.find(
      (student) => student.studentId === body.studentId
    );

    if (found) {
      return res.status(409).json({
        ok: false,
        message: "Student already exists",
      });
    }

    students.push(body);

    res.set("Link", `/api/students?studentId=${body.studentId}`);

    return res.status(201).json({
      ok: true,
      student: body,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Something went wrong, please try again",
    });
  }
});

// PUT /api/students
// Update an existing student
app.put("/api/students", (req: Request, res: Response) => {
  try {
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
        message: "Student does not exist",
      });
    }

    students[foundIndex] = {
      ...students[foundIndex],
      ...body,
    } as Student;

    res.set("Link", `/api/students?studentId=${body.studentId}`);

    return res.status(200).json({
      ok: true,
      message: `Student ${body.studentId} has been updated successfully`,
      student: students[foundIndex],
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Something went wrong, please try again",
    });
  }
});

// DELETE /api/students
// Delete a student by studentId from the request body
app.delete("/api/students", (req: Request, res: Response) => {
  try {
    const result = zStudentDeleteBody.safeParse(req.body);

    // Invalid studentId: HTTP 400 Bad Request
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        message:
          result.error.issues[0]?.message ??
          "Student Id must contain 9 characters",
      });
    }

    const { studentId } = result.data;

    const foundIndex = students.findIndex(
      (student) => student.studentId === studentId
    );

    // Student not found: HTTP 404 Not Found
    if (foundIndex === -1) {
      return res.status(404).json({
        ok: false,
        message: "Student ID does not exist",
      });
    }

    // Remove the student from the array
    students.splice(foundIndex, 1);

    // Successful deletion: HTTP 200 OK
    return res.status(200).json({
      ok: true,
      message: `Student Id ${studentId} has been deleted`,
    });
  } catch {
    return res.status(500).json({
      ok: false,
      message: "Something went wrong, please try again",
    });
  }
});

// GET /api/me
// Return the developer's information
app.get("/api/me", (_req: Request, res: Response) => {
  return res.status(200).json({
    ok: true,
    fullName: "ณวัฒน์ เรืองเดชาวิวัฒน์",
    studentId: "650610669",
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

export default app;
