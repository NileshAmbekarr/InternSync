# InternSync

A multi-tenant SaaS platform for managing internship programs. Organizations sign up,
invite their team, and run the full intern workflow — report submissions, reviews,
grading, threaded feedback, analytics, and notifications — with strict per-organization
data isolation.

---

## Highlights

- **Multi-tenant** — every organization's data is isolated by `organizationId` across all queries.
- **Role-based access** — Owner → Admin → Intern hierarchy with route- and action-level guards.
- **Report workflow** — a state machine: `draft → submitted → under_review → graded`.
- **Threaded feedback** — a comment thread on each report between interns and reviewers.
- **Ratings & grading** — star ratings, marks out of 100, and written feedback.
- **Analytics** — submission trends, status breakdowns, and top performers (Recharts).
- **Notifications** — in-app bell + email alerts, with an optional daily digest job.
- **Cloud file storage** — uploads to Cloudflare R2 (S3-compatible) with presigned downloads.
- **Auth** — email/password (JWT) and Google OAuth 2.0, with email verification and invites.
- **Premium UI** — refined dark theme, sidebar app shell, and an animated marketing landing page.

---

## Tech Stack

**Frontend** (`client/`)
- React 19 + Vite 7
- React Router 7
- Framer Motion (landing animations / scroll effects)
- Recharts (analytics charts)
- lucide-react (icons), react-hot-toast (toasts), react-dropzone (uploads)
- Axios; custom CSS design system (no UI kit)

**Backend** (`server/`)
- Node.js + Express 4
- MongoDB + Mongoose 8
- JWT (jsonwebtoken) + Passport (Google OAuth)
- bcryptjs (password hashing)
- Multer (uploads) + AWS SDK v3 → Cloudflare R2
- Nodemailer (Gmail SMTP) for verification, invites, notifications & digests

---

## Project Structure

```
InternSync/
├── client/                      # React + Vite frontend
│   └── src/
│       ├── components/          # AppLayout, Sidebar, Topbar, NotificationBell,
│       │                        # CommentThread, FeaturesShowcase, StatCard, ...
│       ├── pages/               # Landing, auth flows, dashboards, ReviewReport,
│       │                        # Analytics, Profile, Settings, Onboarding
│       ├── context/             # AuthContext (global auth state)
│       ├── utils/               # api.js (Axios client)
│       └── index.css            # design system / tokens
└── server/                      # Express API
    ├── config/                  # db, passport
    ├── middleware/              # auth (JWT), organization (tenant context), upload
    ├── models/                  # User, Organization, Report, Comment, Notification
    ├── routes/                  # auth, reports, users, notifications
    ├── utils/                   # email, notify, fileService, storage
    └── scripts/                 # sendDigest.js, createAdmin.js
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) Cloudflare R2 bucket for file uploads
- (Optional) Google OAuth credentials and a Gmail App Password for email

### 1. Backend

```bash
cd server
npm install
cp .env.example .env       # then fill in the values below
npm run dev                # starts on http://localhost:5000
```

`server/.env`:

| Variable | Description |
| --- | --- |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRE` | Token lifetime (e.g. `7d`) |
| `CLIENT_URL` | Frontend origin, used for CORS and email links |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Gmail address + App Password (SMTP) |
| `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Cloudflare R2 (required for file uploads) |

### 2. Frontend

```bash
cd client
npm install
npm run dev                # starts on http://localhost:5173
```

Optional `client/.env`: `VITE_API_URL=http://localhost:5000/api` (defaults to this).

### Health check
```bash
curl http://localhost:5000/api/health
```

---

## Scripts

**Server**
- `npm run dev` — start with nodemon
- `npm start` — start in production
- `npm run digest` — send pending email digests (cron-ready; see below)

**Client**
- `npm run dev` — Vite dev server
- `npm run build` — production build
- `npm run preview` — preview the build
- `npm run lint` — ESLint

### Email digest (cron)

`server/scripts/sendDigest.js` emails each user a summary of their not-yet-digested
notifications and marks them digested so they aren't resent. Schedule it, e.g. daily at 8am:

```cron
0 8 * * *  cd /path/to/server && npm run digest
```

---

## API Overview

Base URL: `/api`

**Auth** (`/auth`)
- `POST /register` — create organization + owner
- `POST /login` — email/password login → JWT
- `GET /me` — current user + organization
- `POST /invite` — invite a user (admin/owner)
- `POST /accept-invite/:token` — accept an invite and set a password
- `GET /verify-email/:token` — verify email
- `GET /google`, `GET /google/callback` — Google OAuth

**Reports** (`/reports`)
- `POST /` · `GET /my` · `PUT /:id` · `PUT /:id/submit` · `PUT /:id/undo` · `DELETE /:id` — intern actions
- `GET /` · `GET /stats` · `GET /analytics` · `GET /:id` · `PUT /:id/review` · `PUT /:id/grade` — admin/owner
- `GET /download/:id` — presigned file download
- `GET /:id/comments` · `POST /:id/comments` · `DELETE /:id/comments/:commentId` — comment thread

**Users** (`/users`)
- `GET /interns` · `GET /team` · `GET /:id`
- `PUT /profile` — update name, department, and `emailNotifications` preference
- `PUT /:id/deactivate` · `PUT /:id/reactivate` — owner only

**Notifications** (`/notifications`)
- `GET /` — list + unread count
- `PUT /:id/read` · `PUT /read-all`

---

## Roles & Permissions

| Role | Capabilities |
| --- | --- |
| **Owner** | Full control: manage admins & interns, all admin abilities, organization settings |
| **Admin** | Invite interns, review & grade reports, manage team, view analytics |
| **Intern** | Submit/edit/undo reports, view grades & feedback, comment on own reports |

---

## Deployment

- **Frontend** — static build (`client/`), deployable to Vercel or any static host.
- **Backend** — Node server (`server/`), deployable to Railway / Render / Fly, etc.
- Set the environment variables above in your host, point `CLIENT_URL` at the deployed
  frontend, and schedule `npm run digest` if you want email digests.

---

© InternSync — built for better internships.
