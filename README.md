# PresenceHub — Student Attendance & Academics

A web-based attendance and academic-records platform for educational institutions. Administrators manage people and courses, faculty take attendance and record marks/grades/results, and students view their attendance, marks, fees, and discipline records — all through one role-aware interface.

Built as a TypeScript monorepo: a React single-page app, an Express REST API, and a shared package of types and validation schemas backed by PostgreSQL (Prisma).

> The application lives in the [`PresenceHub-attendance/`](PresenceHub-attendance/) directory. Unless noted otherwise, **run all commands from inside that folder.**

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [npm scripts](#npm-scripts)
- [How it works (workflows)](#how-it-works-workflows)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Environment variables](#environment-variables)
- [Design system](#design-system)
- [Building & deployment](#building--deployment)
- [Security notes & known limitations](#security-notes--known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Features

The app has three roles, each with its own portal and navigation. The sidebar, dashboard, and routes are driven by the signed-in user's role; links to pages a role can't access are never shown, and the routes are also guarded on the server.

### Administrator
- **Dashboard** — totals for students, faculty, courses, sections; a 7-day attendance rate; outstanding fees; newest accounts.
- **Users** — create students, faculty, and admins; search and filter by role; activate/deactivate accounts (a deactivated user can't sign in).
- **Departments** — create departments; see student/faculty/course counts.
- **Courses** — course catalogue with search and department/semester filters.
- **Enrollments** — pick a section, then bulk-enroll a whole department or remove individual students.
- **Settings** — theme preference and live API/system status.

### Faculty
- **Dashboard** — assigned sections, student/exam counts, quick actions.
- **Attendance** — mark a section's attendance for a date (Present / Absent / Late / Excused, with remarks), review and correct earlier days, and view history by date or by student. The sheet loads what's already saved, warns before discarding unsaved edits, and re-reads server state after saving.
- **Marks** — create exams and record scores against them.
- **Grades** — assign final letter grades (grade points come from the grading scale).
- **Results** — record semester SGPA, CGPA, and credits.
- **Discipline** — file disciplinary records for students in your sections.
- **Fines** — assign fines (they appear in the student's fee details).

### Student
- **Dashboard** — overall attendance, per-course attendance, latest SGPA, outstanding dues, recent marks, and announcements.
- **Attendance** — per-course summaries and a filterable, sortable record of every class.
- **Marks** — every exam score, filterable by course.
- **Results** — semester SGPA/CGPA with a GPA-over-time chart.
- **Fees** — fees and fines, amounts paid, and remaining balance.
- **Discipline** — records filed about them and whether they're resolved.
- **Profile** — account and academic details.
- **Notifications** — unread announcements and alerts.

### Cross-cutting
- Email / employee-ID / roll-number sign-in, JWT auth with silent token refresh, and password reset.
- Light / dark / system theme, responsive layout (mobile drawer navigation), and accessible components (keyboard navigation, focus management, ARIA, status conveyed by text + icon, not colour alone).
- Consistent loading, empty, error, and success states; confirmation dialogs for destructive or sensitive actions; URL-preserved filters and selections.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Client** | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, Zustand (auth state), React Hook Form, Recharts, Axios, lucide-react, react-hot-toast |
| **Server** | Node.js, Express 4, TypeScript, Prisma 6, JWT (`jsonwebtoken`), bcryptjs, Zod, Helmet, CORS, cookie-parser, express-rate-limit |
| **Shared** | Zod schemas, enums, and TypeScript types consumed by both client and server |
| **Database** | PostgreSQL (via Prisma ORM) |
| **Tooling** | npm workspaces, `tsx` (dev/watch), `concurrently` |

---

## Repository layout

```
Student-Attendence-App/                 ← git root
└── PresenceHub-attendance/             ← the application (run commands here)
    ├── package.json                     ← workspace root; dev/build/db scripts
    ├── client/                          ← React SPA (@college-erp/client)
    │   ├── src/
    │   │   ├── api/                      ← Axios instance + typed API clients
    │   │   ├── components/
    │   │   │   ├── ui/                   ← design-system primitives (Button, Dialog, Table, …)
    │   │   │   ├── layout/               ← Sidebar, Topbar, DashboardLayout
    │   │   │   ├── faculty/ · student/   ← role-specific building blocks
    │   │   │   └── shared/               ← ProtectedRoute, RoleGate
    │   │   ├── pages/                    ← admin/ · faculty/ · student/ · auth/ · shared/
    │   │   ├── hooks/                    ← useApiQuery, usePagination, useSort, …
    │   │   ├── contexts/                 ← UIContext (sidebar + theme)
    │   │   ├── constants/                ← routes, navigation, status vocabularies
    │   │   ├── utils/                    ← formatting, errors, theme, attendance math
    │   │   ├── types/                    ← API response shapes
    │   │   └── index.css                 ← design tokens (light/dark)
    │   └── vite.config.ts                ← dev server + /api proxy to :5000
    ├── server/                          ← Express API (@college-erp/server)
    │   ├── src/
    │   │   ├── app.ts · index.ts         ← app wiring + entry point
    │   │   ├── config/                   ← env (Zod-validated) + Prisma client
    │   │   ├── middleware/               ← auth, role, validate, error, rate-limit
    │   │   ├── modules/                  ← auth · admin · faculty · student (routes/controller/service)
    │   │   ├── prisma/                   ← schema.prisma + seed.ts
    │   │   └── utils/                    ← JWT, hashing, AppError
    │   └── .env.example
    └── shared/                          ← @college-erp/shared (types, enums, Zod schemas)
```

> A small legacy prototype exists at the git-root level (`src/`, `server.ts`). It predates the current app, is **not** wired to any script, and can be ignored.

---

## Prerequisites

- **Node.js ≥ 18** and npm
- A **PostgreSQL** database (local install, Docker, or a hosted provider such as Supabase/Neon)

---

## Getting started

```bash
# 1. Enter the app directory
cd PresenceHub-attendance

# 2. Install all workspace dependencies
npm install

# 3. Configure the server environment
cp server/.env.example server/.env
#   then edit server/.env — set DATABASE_URL and the two JWT secrets (16+ chars each)

# 4. Create the database schema and generate the Prisma client
npm run db:push        # pushes schema.prisma to your database
npm run db:generate    # (also runs automatically on install)

# 5. Seed demo data (5 departments, 10 faculty, 50 students, courses, attendance, …)
npm run db:seed

# 6. Run both the API and the client
npm run dev
```

- Client: **http://localhost:5173**
- API: **http://localhost:5000** (health check at `/api/health`)

The client proxies `/api/*` to the API, so there is no CORS setup needed in development.

---

## Demo accounts

After seeding, every account uses the password **`college123`**.

| Role | Example login |
|------|---------------|
| Admin | `admin@college.edu` |
| Faculty | `rajesh.sharma@college.edu` (employee ID `FAC001`) |
| Student | `aarav.sharma@student.college.edu` (roll number `CSE2024001`) |

You can sign in with an **email, employee ID, or roll number**. The login page also has one-click buttons that fill a demo account for each role. The full credential list is printed by `npm run db:seed`.

---

## npm scripts

Run from `PresenceHub-attendance/`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Run the API and client together (via `concurrently`) |
| `npm run dev:server` | Run only the API (`tsx watch`) |
| `npm run dev:client` | Run only the client (Vite) |
| `npm run build` | Build the server (`tsc`) and the client (`vite build`) |
| `npm run start` | Start the compiled server (`node dist/index.js`) |
| `npm run lint` | Type-check every workspace (`tsc --noEmit`) |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply a Prisma migration (dev) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (database browser) |

> There is no automated test suite; `npm run lint` is the type-level check. On Windows, stop the API dev server before `npm run build` — a running server keeps a Prisma engine file open and `prisma generate` fails with `EPERM`.

---

## How it works (workflows)

### Authentication & sessions
1. The user signs in with an identifier (email / employee ID / roll number) + password. The server verifies the account is active, checks the bcrypt hash, and issues:
   - an **access token** (JWT, ~15 min) returned in the response body and held in memory (Zustand), and
   - a **refresh token** (JWT, ~7 days) set as an **httpOnly cookie**.
2. The Axios client attaches the access token to each request. On a `401`, it calls `/auth/refresh` once (concurrent requests share a single refresh), stores the new access token, and retries. If refresh fails, the session ends and the user is returned to the sign-in page with a notice.
3. On app start, the SPA attempts a silent refresh to restore the session.
4. Every API route under `/admin`, `/faculty`, and `/students` requires a valid access token **and** the matching role (`authMiddleware` + `requireRole`).

### Attendance (the core workflow)
1. Faculty select a **section** and **date** (both stored in the URL).
2. The sheet loads any attendance **already persisted** for that date. If that load fails, editing is blocked — so the UI never shows an empty sheet that could overwrite real data.
3. Faculty mark each student (defaulting to Present), optionally add remarks, and use "All present / All absent" shortcuts.
4. Unsaved edits are counted; navigating away, switching section/date, or closing the tab prompts for confirmation.
5. On save, records are **upserted** per student (`[studentId, sectionId, date]` is unique), then the sheet re-reads server state so it reflects exactly what was stored.
6. **History** aggregates saved records by date or by student. "Attended" counts Present + Late, consistent with the admin dashboard's rate.

### Request flow (general)
`React page → typed API client (Axios) → /api/v1/... → route (auth + role + Zod validation) → controller → service (Prisma) → PostgreSQL`, with the response unwrapped from a standard `{ success, data, message }` envelope. Each page owns its own loading/error state (`useApiQuery`) and offers a retry.

---

## API reference

Base URL: **`/api/v1`**. All responses use the envelope `{ success: boolean, data?: T, message?: string, errors?: Record<string,string[]> }`. All routes except the public auth endpoints require `Authorization: Bearer <accessToken>`; the role in brackets is enforced.

### Auth — `/auth`
| Method | Path | Notes |
|--------|------|-------|
| POST | `/login` | `{ email, password }` (email may be an ID or roll number) → access token + user; sets refresh cookie |
| POST | `/refresh` | Exchanges the refresh cookie for a new access token |
| POST | `/logout` | Clears the refresh cookie |
| POST | `/reset-password` | `{ identifier, newPassword }` |
| GET | `/me` | Current user profile *(auth)* |
| POST | `/register` | Create a user *(admin)* |

### Admin — `/admin` *(admin)*
| Method | Path |
|--------|------|
| GET | `/dashboard` |
| GET / POST | `/users` · PATCH `/users/:userId/toggle-status` |
| GET / POST | `/departments` |
| GET / POST | `/courses` |
| GET / POST | `/sections` · POST `/sections/enroll` |
| GET | `/enrollments` · POST `/enrollments/bulk` · DELETE `/enrollments/:studentId/:sectionId` |

### Faculty — `/faculty` *(faculty)*
| Method | Path |
|--------|------|
| GET | `/dashboard` |
| GET | `/sections` · `/sections/:sectionId/students` · `/sections/:sectionId/exams` |
| POST | `/exams` |
| POST | `/attendance` · GET `/attendance/:sectionId` |
| POST | `/marks` |
| POST | `/grades` · GET `/grades/:sectionId` |
| POST | `/results` |
| POST | `/discipline` · GET `/discipline` |
| POST | `/fines` · GET `/fines` |

### Student — `/students` *(student)*
| Method | Path |
|--------|------|
| GET | `/dashboard` · `/attendance` · `/marks` · `/fees` · `/results` · `/discipline` |

### Health
| Method | Path |
|--------|------|
| GET | `/api/health` |

Request bodies are validated with Zod schemas from `@college-erp/shared`; validation failures return `400` with field-level `errors`.

---

## Data model

Prisma models (see [`server/src/prisma/schema.prisma`](PresenceHub-attendance/server/src/prisma/schema.prisma)):

- **User** — identity + role (`ADMIN` / `FACULTY` / `STUDENT`); has one `Student` or `Faculty` profile.
- **Department** → has many Students, Faculty, Courses.
- **Student** / **Faculty** — role profiles (roll number / employee ID, department, etc.).
- **Course** → **Section** (a course offering taught by one faculty member in a term).
- **Enrollment** — joins a Student to a Section.
- **Attendance** — one record per student/section/date (`PRESENT` / `ABSENT` / `LATE` / `EXCUSED`).
- **Exam** → **Mark** — scores per student per exam.
- **Grade** — final letter grade per student per section.
- **Result** — semester SGPA/CGPA and credits.
- **Fee** → **FeePayment** — fees and fines (type `FINE`) with status and payments.
- **DisciplineRecord** — incidents filed against a student.
- **Notification** — per-user announcements.

---

## Environment variables

Set in `PresenceHub-attendance/server/.env` (copy from `server/.env.example`). Validated on startup — the server exits if any required value is missing or malformed.

| Variable | Required | Default | Description |
|----------|:---:|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | — | Access-token secret (≥ 16 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh-token secret (≥ 16 chars) |
| `JWT_ACCESS_EXPIRY` | | `15m` | Access-token lifetime |
| `JWT_REFRESH_EXPIRY` | | `7d` | Refresh-token lifetime |
| `PORT` | | `5000` | API port |
| `NODE_ENV` | | `development` | `development` \| `production` \| `test` |
| `CLIENT_URL` | | `http://localhost:5173` | Allowed CORS origin |

The client needs no environment variables for local development (it proxies `/api` to the server).

---

## Design system

The UI is built on design tokens defined in [`client/src/index.css`](PresenceHub-attendance/client/src/index.css) — semantic colour, surface, text, radius, shadow, and spacing variables that switch between light and dark themes in one place. Components (`client/src/components/ui/`) reference these tokens rather than raw colours, so the whole app can be restyled consistently. Status colours ship with text + icon so meaning never depends on colour alone, and chart colours are a colour-blind-safe palette.

---

## Building & deployment

```bash
npm run build     # server → server/dist, client → client/dist
```

The project is set up for **Vercel**:
- The client is a static build; `client/vercel.json` rewrites `/api/v1/*` to the deployed backend and serves the SPA for all other routes.
- The server runs as a serverless function via `server/api/index.js` (which imports the built Express app); `server/vercel.json` routes requests to it.

For a non-Vercel deployment: build both workspaces, serve `client/dist` as static files, run the server with `npm run start`, and set the server's environment variables (including `CLIENT_URL` for CORS and a production `DATABASE_URL`).

---

## Security notes & known limitations

- **Password reset is unauthenticated.** `POST /auth/reset-password` changes an account's password given only its email/employee-ID/roll-number and a new password — no verification step. **Add email-based verification (or restrict it) before any real-world use.**
- **No "create section" UI for admins.** The endpoint exists but needs an internal faculty ID that no current list endpoint returns; sections for the demo come from the seed.
- **Marks/results have no read-back endpoint,** so those faculty pages note that saving overwrites earlier entries for the same students.
- **No automated tests.** `npm run lint` (type-checking) is the available check.
- The seed and fee amounts use **₹ (INR)**; currency is formatted accordingly throughout.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Client shows **"Database is currently unavailable"** or Vite logs `http proxy error … ECONNREFUSED` for `/api/...` | The API isn't running (or crashed). Ensure `server/.env` exists with a valid `DATABASE_URL` and JWT secrets, that your database is up, then start the API (`npm run dev`). |
| API exits immediately on start | Missing/invalid env vars (it validates on boot) or an unreachable database. Check the server console for the reported field. |
| `npm run build` fails on Windows with `EPERM … query_engine-windows.dll.node` | The API dev server is running and holding the Prisma engine open. Stop it, then build. |
| Login fails for a seeded account | Confirm the database was seeded (`npm run db:seed`) and you're using the password `college123`. |
| Styling looks unstyled / tokens missing | Ensure Tailwind processed `index.css`; restart the Vite dev server after dependency changes. |
