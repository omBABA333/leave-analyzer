
               LEAVE & PRODUCTIVITY ANALYZER


--------------------------------------------------------------------------------
1. PROJECT OVERVIEW 
--------------------------------------------------------------------------------
"I built a Full-Stack Leave & Productivity Analyzer. It automates the process of 
tracking employee attendance by parsing raw Excel sheets, applying complex business 
rules to calculate productivity, and visualizing the data on an interactive dashboard."

- Problem Solved: Eliminates manual error-prone calculation of hours from Excel logs.
- Key Feature: Transforms raw, messy logs into instant insights (Leaves, Productivity %).

--------------------------------------------------------------------------------
2. TECH STACK & ARCHITECTURE
--------------------------------------------------------------------------------
A. Frontend: React.js + Tailwind CSS
   - Why? Component-based UI for a fast, responsive Single Page Application (SPA).
   - Tailwind allows for rapid styling without writing custom CSS files.

B. Backend: Node.js (Vercel Serverless Functions)
   - Why? Cost-effective and scalable. No need for an always-running server. 
   - Functions spin up on-demand to process files and then shut down.

C. Database: MongoDB (Atlas) + Mongoose
   - Why? Flexible JSON-like document storage perfect for log data.
   - Mongoose provides schema validation to keep data consistent.

--------------------------------------------------------------------------------
3. CORE BUSINESS LOGIC & RULES
--------------------------------------------------------------------------------
My code doesn't just "read" data; it interprets it based on HR policies:

1. Working Hours:
   - Mon-Fri: 8.5 Hours Expected.
   - Saturday: 4.0 Hours Expected (Half-day).
   - Sunday: 0 Hours (Strictly Off).
   - Holidays: 0 Hours (Ignored).

2. Leave Policy:
   - Missing time on a PAST working day = Absent (Count as Leave).
   - Missing time on a FUTURE date = Upcoming (Ignored).
   - Missing time on a SUNDAY = Weekend (Ignored).

3. Productivity Formula:
   (Total Actual Hours / Total Expected Hours) * 100
   
--------------------------------------------------------------------------------
4. COMPLETE WORKFLOW (STEP-BY-STEP)
--------------------------------------------------------------------------------
1. User uploads Excel file on Frontend (`UploadExcel.jsx`).
2. Frontend sends `FormData` to `POST /api/upload`.
3. Backend (`upload.js`) parses the file using `xlsx` library.
4. Logic calculates hours, identifies Sundays/Holidays, and marks Leaves.
5. Backend deletes old records for these dates (Duplicate Protection).
6. Backend saves new clean data to MongoDB (`Attendance.insertMany`).
7. Backend returns a JSON summary.
8. Frontend React State updates, showing the Dashboard and Charts.

--------------------------------------------------------------------------------
5. CODEBASE WALKTHROUGH
--------------------------------------------------------------------------------

A. Frontend: `UploadExcel.jsx`
   - Manages State: `file`, `data`, `activeTab`.
   - Handles Logic: Switches between "Upload" and "Monthly History".
   - Displays Data: Renders the Table using `.map()` and conditionally styles rows 
     (Red for Absent, Green for Present).

B. Backend: `api/upload.js` (The Brain)
   - Parses Excel files.
   - Contains the `HOLIDAYS` array.
   - Runs the `parseExcelDate` and `parseTime` helpers.
   - Executes the core business logic loop.

C. Backend: `api/stats.js`
   - Handles Monthly Reports.
   - Uses MongoDB Regex Search: `find({ date: { $regex: '^2025-01' } })`.
   - Aggregates totals on-the-fly to return a summary.

D. Backend: `api/db.js`
   - Manages the database connection.
   - Prevents "Connection Exhaustion" using the caching pattern.

--------------------------------------------------------------------------------
6. FUTURE SCOPE
--------------------------------------------------------------------------------
- Authentication: Add Login/Signup for multiple managers.
- PDF Export: Allow downloading the report.
- Manual Edits: Allow fixing a wrong time entry directly on the dashboard.
