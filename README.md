# 💼 Job Portal Backend API

A high-performance, secure, and production-ready RESTful backend API and real-time WebSocket service for a multi-role Job Portal platform, built with **Node.js**, **Express 5**, **MongoDB (Mongoose 9)**, **Redis (ioredis)**, and **Socket.io**.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture & Folder Structure](#-system-architecture--folder-structure)
- [Database ER Design](#-database-er-design)
- [Roles & Permissions (RBAC)](#-roles--permissions-rbac)
- [Application Status Pipeline (ATS)](#-application-status-pipeline-ats)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Seeding & Test Credentials](#-database-seeding--test-credentials)
- [Running the Server](#-running-the-server)
- [WebSocket & Real-Time Events](#-websocket--real-time-events)
- [Comprehensive API Reference](#-comprehensive-api-reference)
  - [Health & Base](#1-health--base)
  - [Authentication (`/auth`)](#2-authentication-apiv1auth)
  - [User & Profile Management (`/users`)](#3-user--profile-management-apiv1users)
  - [Job Postings (`/jobs`)](#4-job-postings-apiv1jobs)
  - [Job Applications & ATS (`/applications`)](#5-job-applications--ats-apiv1applications)
  - [Saved Jobs (`/saved-jobs`)](#6-saved-jobs-apiv1saved-jobs)
  - [Notifications (`/notifications`)](#7-notifications-apiv1notifications)
  - [Reports & Moderation (`/reports`)](#8-reports--moderation-apiv1reports)
  - [Admin Panel & Analytics (`/admin`)](#9-admin-panel--analytics-apiv1admin)
- [Standard API Response Format](#-standard-api-response-format)
- [Security Features & Hardening](#-security-features--hardening)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment Instructions](#-deployment-instructions)
- [License](#-license)

---

## 🌟 Overview

The Job Portal Backend provides a full-featured infrastructure connecting **Candidates**, **Recruiters**, and **Administrators**:

- **Candidates** can browse and filter verified job openings, bookmark jobs for later, submit applications with custom cover letters and resume uploads (PDF/DOCX), track application review statuses in real-time, withdraw unreviewed applications, and manage extensive professional profiles.
- **Recruiters** can post detailed job openings, manage candidates through an Applicant Tracking System (ATS), shortlist/interview/select/reject applications with feedback notes, securely view applicant resumes, and track job engagement statistics.
- **Administrators** have complete system oversight: analytics dashboards (users, jobs, applications breakdown), user management (blocking/unblocking, deletion), job moderation, and abuse report resolution.

---

## ⚡ Key Features

- **🔐 Multi-Role Authentication & RBAC**: Strict Role-Based Access Control (`candidate`, `recruiter`, `admin`) with JWT (in Authorization Header or HTTP-only cookie) and `bcryptjs` password hashing.
- **🛡️ Hardened Security Posture**:
  - Zero hardcoded fallback secrets: startup environment validation strictly requires `JWT_SECRET`.
  - IDOR protection: candidate profiles and resumes can only be accessed by the owner, authorized reviewing recruiters, or admins.
  - Mass assignment protection: job update fields are strictly whitelisted to protect recruiter ownership and internal metrics.
  - ReDoS defense: regex search inputs are sanitized against metacharacters with string length limits.
  - Secure cookie clearing on logout with matching `secure`, `httpOnly`, and `sameSite` attributes.
- **📑 Job Lifecycle & Search Engine**: Rich job queries with keyword search, category, workplace type (`Remote`, `Hybrid`, `On-site`), employment type, experience level, salary range filtering, pagination, and sorting.
- **📈 Applicant Tracking System (ATS)**: Multi-stage application status pipeline (`Applied → Shortlisted → Interview → Selected / Rejected`) with internal recruiter notes and candidate feedback.
- **⚡ Real-Time Push Alerts (Socket.io)**: Authenticated WebSocket server delivering instant notifications to candidate/recruiter private rooms and broadcast channels on new applications, status updates, and new job postings.
- **🚀 Redis Caching with Graceful Fallback**: High-speed caching for public job feeds and categories using `ioredis`. If Redis is offline, the application seamlessly falls back to an in-memory cache with an automated 5-minute eviction sweeper.
- **📁 Secure File Uploads (Multer)**: Resume uploads (PDF/DOC/DOCX up to 5MB) and profile avatars (JPG/PNG/WEBP up to 3MB) with authenticated access control on resumes.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | v18+ | JavaScript runtime engine |
| **Framework** | Express.js | `^5.3.0` | Next-generation web framework |
| **Database** | MongoDB | v6.0+ | Primary NoSQL document database |
| **ODM** | Mongoose | `^9.11.4` | Schema definitions, indexing, validation |
| **Caching** | Redis / ioredis | `^6.0.0` | In-memory query caching & session speedup |
| **WebSockets** | Socket.io | `^4.8.4` | Bi-directional real-time event streaming |
| **Auth / Crypto** | jsonwebtoken, bcryptjs | `^9.0.3`, `^3.0.3` | JWT generation/verification & secure hashing |
| **Validation** | Zod | `^4.6.7` | Type-safe declarative schema validation |
| **File Uploads** | Multer | `^2.5.0` | Multipart form-data handling with MIME checks |
| **Security** | Helmet, CORS, Express Rate Limit | `^8.3.0`, `^2.8.6`, `^8.7.2` | HTTP security headers, CORS & DDoS protection |
| **Logging** | Morgan | `^1.12.1` | HTTP request logging |

---

## 📁 System Architecture & Folder Structure

```
JOB PORTAL BACKEND/
├── uploads/                        # Static and private uploads directory
│   ├── avatars/                    # Public user profile pictures & company logos
│   └── resumes/                    # Secure candidate resume documents
├── src/
│   ├── config/                     # Infrastructure configuration
│   │   ├── cloudinary.js           # Optional Cloudinary SDK client setup
│   │   ├── db.js                   # Mongoose MongoDB connection & error listeners
│   │   └── redis.js                # ioredis client initialization & fallback handling
│   ├── controllers/                # Request processing and business logic
│   │   ├── admin.controller.js       # Admin analytics, moderation, and user management
│   │   ├── application.controller.js # Job application submissions and ATS workflows
│   │   ├── auth.controller.js        # Register, login, logout, password updates
│   │   ├── job.controller.js         # Job CRUD, search, filter, and view increments
│   │   ├── notification.controller.js# In-app notifications & read receipts
│   │   ├── report.controller.js      # Abuse and fraud reporting
│   │   ├── savedJob.controller.js    # Candidate bookmarked / saved jobs
│   │   └── user.controller.js        # Profile management and secure resume access
│   ├── middlewares/                # Express middleware chain
│   │   ├── auth.middleware.js        # JWT token verification (protect & optionalAuth)
│   │   ├── error.middleware.js       # 404 handler and centralized JSON error responder
│   │   ├── rateLimiter.middleware.js # express-rate-limit configurations (api, auth, upload)
│   │   ├── role.middleware.js        # Role-Based Access Control gate (candidate, recruiter, admin)
│   │   ├── upload.middleware.js      # Multer file size & MIME filter storage engine
│   │   └── validate.middleware.js    # Zod schema validation interceptor
│   ├── models/                     # Mongoose Schemas & Models
│   │   ├── Application.js            # Job applications and status tracking
│   │   ├── Job.js                    # Job postings with company & salary metadata
│   │   ├── Notification.js           # Persistent in-app notifications
│   │   ├── Report.js                 # Content flags (jobs / users)
│   │   ├── SavedJob.js               # User bookmarked jobs
│   │   └── User.js                   # Candidate, recruiter, and admin user records
│   ├── routes/                     # Modular API route definitions
│   │   ├── admin.routes.js           # /api/v1/admin
│   │   ├── application.routes.js     # /api/v1/applications
│   │   ├── auth.routes.js            # /api/v1/auth
│   │   ├── index.js                  # Master router aggregator & health check
│   │   ├── job.routes.js             # /api/v1/jobs
│   │   ├── notification.routes.js    # /api/v1/notifications
│   │   ├── report.routes.js          # /api/v1/reports
│   │   ├── savedJob.routes.js        # /api/v1/saved-jobs
│   │   └── user.routes.js            # /api/v1/users
│   ├── scripts/                    # Utilities and automated tests
│   │   ├── seed.js                   # Database seeder with mock users, jobs & applications
│   │   └── testEndpoints.js          # Automated 27-flow test suite runner
│   ├── sockets/                    # WebSocket real-time communication
│   │   ├── notificationSocket.js     # Helper methods to dispatch real-time events
│   │   └── socketManager.js          # Socket.io connection handshake & room management
│   ├── utils/                      # Reusable utility helpers
│   │   ├── apiError.js               # Standardized ApiError class
│   │   ├── apiResponse.js            # Standardized ApiResponse formatter
│   │   ├── asyncHandler.js           # Async controller wrapper catching rejections
│   │   └── cache.js                  # Redis wrapper with in-memory TTL eviction sweeper
│   ├── validations/                # Zod validation schema contracts
│   │   ├── application.validation.js
│   │   ├── auth.validation.js
│   │   ├── job.validation.js
│   │   ├── report.validation.js
│   │   └── user.validation.js
│   ├── app.js                      # Express app assembly, middleware, and routes
│   └── server.js                   # Server bootstrap, startup validation & graceful shutdown
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🗃️ Database ER Design

```
+-------------------------------------------------------------+
|                            USER                             |
+-------------------------------------------------------------+
| _id (ObjectId, PK)                                          |
| name (String)                                               |
| email (String, Unique)                                      |
| password (String, Hashed, Hidden)                           |
| role (Enum: 'candidate' | 'recruiter' | 'admin')            |
| phone, location, avatar (String)                            |
| isBlocked (Boolean)                                         |
| candidateProfile: { headline, bio, skills, exp, edu, ... }  |
| recruiterProfile: { companyName, website, desc, logo, ... } |
+-------------------------------------------------------------+
       | 1                                              | 1
       | creates                                        | submits
       v *                                              v *
+-------------------------------+             +-------------------------------+
|              JOB              |             |          APPLICATION          |
+-------------------------------+             +-------------------------------+
| _id (ObjectId, PK)            |             | _id (ObjectId, PK)            |
| recruiter (Ref: User, FK)     | 1         * | job (Ref: Job, FK)            |
| title, description, category  |<------------| candidate (Ref: User, FK)     |
| location, workplaceType       |             | recruiter (Ref: User, FK)     |
| jobType, experienceLevel      |             | resumeUrl, coverLetter        |
| salary: { min, max, currency }|             | status: Applied|Shortlisted|  |
| skillsRequired: [String]      |             |         Interview|Selected|   |
| applicationsCount, viewsCount |             |         Rejected              |
| status: Active|Closed|Draft   |             | recruiterNotes (Hidden)       |
+-------------------------------+             | feedback (String)             |
       | 1                                    +-------------------------------+
       | bookmarked                                 [Compound Unique Index]
       v *                                          candidate + job
+-------------------------------+
|           SAVEDJOB            |
+-------------------------------+
| _id (ObjectId, PK)            |
| candidate (Ref: User, FK)     |
| job (Ref: Job, FK)            |
+-------------------------------+
[Compound Unique Index]
candidate + job
```

---

## 🔒 Roles & Permissions (RBAC)

| Resource / Action | Public / Guest | Candidate | Recruiter | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| Browse & Search Active Jobs | ✅ | ✅ | ✅ | ✅ |
| View Public Recruiter Profile | ✅ | ✅ | ✅ | ✅ |
| Register / Login | ✅ | ✅ | ✅ | — |
| Update Candidate Profile | ❌ | ✅ | ❌ | ❌ |
| Update Recruiter Profile | ❌ | ❌ | ✅ | ❌ |
| Upload / Download Resume | ❌ | ✅ (Own) | ✅ (Applicants) | ✅ (All) |
| Post New Job | ❌ | ❌ | ✅ | ❌ |
| Update / Delete Job | ❌ | ❌ | ✅ (Own jobs) | ✅ (All jobs) |
| Apply to Job | ❌ | ✅ | ❌ | ❌ |
| View Application Status | ❌ | ✅ (Own apps) | ✅ (Own jobs) | ✅ (All) |
| Advance ATS Status Pipeline | ❌ | ❌ | ✅ (Own jobs) | ✅ (All) |
| Withdraw Application | ❌ | ✅ (Applied/Pending) | ❌ | ❌ |
| Bookmark / Save Jobs | ❌ | ✅ | ❌ | ❌ |
| View System Analytics | ❌ | ❌ | ❌ | ✅ |
| Block / Unblock Users | ❌ | ❌ | ❌ | ✅ |
| Moderate Abusive Reports | ❌ | ❌ | ❌ | ✅ |

---

## 📊 Application Status Pipeline (ATS)

```
       [Candidate Applies]
                │
                ▼
            Applied  ─────── (Candidate can withdraw)
                │
                ▼
           Shortlisted
                │
                ▼
            Interview
             │     │
   ┌─────────┘     └─────────┐
   ▼                         ▼
Selected                  Rejected
```

---

## 📦 Prerequisites

Ensure you have the following installed:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Running locally on port `27017` or a MongoDB Atlas URI
- **Redis** *(Optional)*: Server running on port `6379` (application automatically falls back to an in-memory cache if offline)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Yes | `5001` | Port on which the Express server listens |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`) |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS and WebSockets |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/job_portal` | MongoDB connection URI |
| `JWT_SECRET` | Yes | *Required (No fallback)* | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Lifetime of the issued JWT token |
| `JWT_COOKIE_EXPIRES_IN` | No | `7` | Lifetime of authentication cookie (in days) |
| `REDIS_URL` | No | `redis://127.0.0.1:6379` | Redis host connection string |
| `REDIS_ENABLED` | No | `false` | Set to `false` for in-memory cache fallback |

---

## 👥 Database Seeding & Test Credentials

Populate the database with verified sample data (Admin, Recruiters, Candidates, Jobs, Applications, Saved Jobs, Notifications):

```bash
npm run seed
```

### Pre-Configured Test Credentials

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Super Admin | `admin@jobportal.com` | `AdminPassword123!` | System administrator access |
| **Recruiter** | Sarah Connor | `sarah.recruiter@techcorp.io` | `RecruiterPassword123!` | TechCorp Solutions |
| **Recruiter** | David Miller | `david.recruiter@cloudscale.net` | `RecruiterPassword123!` | CloudScale Networks |
| **Candidate** | Alex Johnson | `alex.candidate@example.com` | `CandidatePassword123!` | Senior Full-Stack Engineer |
| **Candidate** | Emily Davis | `emily.candidate@example.com` | `CandidatePassword123!` | Frontend Engineer |

---

## 🏃 Running the Server

### Development Mode (with hot-reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

- **API Base URL**: `http://localhost:5001/api/v1`
- **Health Check**: `http://localhost:5001/api/v1/health`
- **WebSocket Endpoint**: `ws://localhost:5001`

---

## ⚡ WebSocket & Real-Time Events

Real-time notifications are powered by **Socket.io** on port `5001`.

### Connection & Authentication
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5001", {
  auth: {
    token: "<YOUR_JWT_TOKEN>"
  },
  withCredentials: true
});
```

### Automatic Rooms
- `user_<userId>`: Private notifications for individual users.
- `recruiter_<userId>`: Application alerts for recruiters.
- `admin_channel`: Moderation alerts for administrators.

### Real-Time Event Catalog

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `notification:new` | Server ➔ Client | Notification object | Dispatched to `user_<recipientId>` upon status change or application |
| `job:new` | Server ➔ Broadcast | Job object | Broadcast to all clients when a new job is posted |
| `report:new` | Server ➔ Admin Channel | Report object | Alert sent to `admin_channel` when an abuse report is filed |

---

## 📚 Comprehensive API Reference

All routes are prefixed with `/api/v1`.

### 1. Health & Base

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Public | Welcome message and API status |
| `GET` | `/api/v1/health` | Public | Service health, uptime, and system time |

---

### 2. Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new user (`candidate` or `recruiter`) |
| `POST` | `/auth/login` | Public | Login with email and password |
| `POST` | `/auth/logout` | Public | Clear authentication cookie and log out |
| `GET` | `/auth/me` | Authenticated | Get current authenticated user profile |
| `PUT` | `/auth/update-password` | Authenticated | Change account password |

---

### 3. User & Profile Management (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/recruiter/:id` | Public | View public profile of a recruiter/company |
| `GET` | `/users/resume/:filename` | Authenticated | Secure download/viewing of candidate resume |
| `GET` | `/users/:id` | Authenticated | Get user profile (Protected: own profile, applicant, or admin) |
| `PUT` | `/users/profile/basic` | Authenticated | Update basic user details (name, phone, location) |
| `PUT` | `/users/profile/candidate` | Candidate | Update candidate profile (bio, skills, experience, education) |
| `PUT` | `/users/profile/recruiter` | Recruiter | Update company profile (companyName, website, bio, size) |
| `POST` | `/users/upload-resume` | Candidate | Upload resume document (`multipart/form-data`, field: `resume`) |
| `POST` | `/users/upload-avatar` | Authenticated | Upload profile avatar (`multipart/form-data`, field: `avatar`) |

---

### 4. Job Postings (`/api/v1/jobs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/jobs` | Public | Query and filter active jobs (with pagination & search) |
| `GET` | `/jobs/categories` | Public | Retrieve list of available job categories |
| `GET` | `/jobs/recruiter/my-jobs` | Recruiter | List all jobs created by the authenticated recruiter |
| `GET` | `/jobs/:id` | Public | Get detailed job view by ID (increments view count) |
| `POST` | `/jobs` | Recruiter | Create a new job posting |
| `PUT` | `/jobs/:id` | Recruiter (Owner) / Admin | Update existing job (whitelisted editable fields) |
| `DELETE`| `/jobs/:id` | Recruiter (Owner) / Admin | Delete job |
| `POST` | `/jobs/:jobId/apply` | Candidate | Submit job application (`resumeUrl` & `coverLetter`) |

---

### 5. Job Applications & ATS (`/api/v1/applications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/applications/my-applications` | Candidate | List all applications submitted by candidate |
| `GET` | `/applications/recruiter` | Recruiter | List all applications submitted to recruiter's jobs |
| `GET` | `/applications/:id` | Authenticated | View application details (Applicant, Recruiter, or Admin) |
| `PATCH`| `/applications/:id/status` | Recruiter (Owner) / Admin | Advance status: `Applied` ➔ `Shortlisted` ➔ `Interview` ➔ `Selected`/`Rejected` |
| `DELETE`| `/applications/:id` | Candidate | Withdraw application (allowed if status is `Applied` or `Pending`) |

---

### 6. Saved Jobs (`/api/v1/saved-jobs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/saved-jobs` | Candidate | Retrieve all bookmarked jobs for current candidate |
| `POST` | `/saved-jobs/:jobId` | Candidate | Save / bookmark a job |
| `DELETE`| `/saved-jobs/:jobId` | Candidate | Remove a job from saved jobs |

---

### 7. Notifications (`/api/v1/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Authenticated | List paginated in-app notifications |
| `GET` | `/notifications/unread-count`| Authenticated | Get count of unread notifications |
| `PATCH`| `/notifications/:id/read` | Authenticated | Mark specific notification as read |
| `PATCH`| `/notifications/read-all` | Authenticated | Mark all notifications as read |

---

### 8. Reports & Moderation (`/api/v1/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/reports` | Authenticated | Report an abusive job posting or user |
| `GET` | `/reports/my-reports` | Authenticated | List reports submitted by current user |

---

### 9. Admin Panel & Analytics (`/api/v1/admin`)

*All admin endpoints require `admin` role authorization.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/analytics` | High-level system KPIs (total users, active jobs, applications count, breakdown by category and status) |
| `GET` | `/admin/users` | List all system users with search, role filter, and pagination |
| `PATCH`| `/admin/users/:id/block`| Block or unblock a user account |
| `DELETE`| `/admin/users/:id` | Permanently remove a user account |
| `GET` | `/admin/jobs` | View all jobs across the platform including inactive |
| `DELETE`| `/admin/jobs/:id` | Admin delete job posting |
| `GET` | `/admin/reports` | View all reported items with status filter (`Pending`, `Reviewed`, `Resolved`, `Dismissed`) |
| `PATCH`| `/admin/reports/:id` | Update report resolution status and admin notes |

---

## 📐 Standard API Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 3 characters long"
    }
  ]
}
```

---

## 🔒 Security Features & Hardening

1. **Zero Secret Fallbacks:** Tokens are signed and verified strictly against `process.env.JWT_SECRET`. Missing secrets halt application startup.
2. **IDOR Mitigation:** Candidate profile inspection strictly verifies relationship authorization.
3. **Mass Assignment Prevention:** Job modifications only write whitelisted fields; ownership and counts are immutable.
4. **ReDoS Defense:** User regex inputs in job and user search are escaped with character length restrictions.
5. **Private Resume Access:** Static resume directory browsing is disabled. Resumes require authenticated authorization.
6. **Rate Limiting:** Protects `/api/` (300 req / 15 min), `/auth/` (20 req / 15 min), and file uploads (40 req / 15 min).
7. **Strict CORS Policy:** Unknown origins are rejected in production.

---

## 🧪 Testing & Quality Assurance

Run the automated test suite testing all 27 critical business flows:

```bash
npm test
```

### Coverage Highlights:
- Candidate registration, login, and bad password rejections
- Profile updates and IDOR prevention
- Recruiter job creation, mass assignment protection, and unauthorized role rejections
- Advanced search, safe regex parsing, filtering, pagination
- Candidate job application and duplicate submission prevention (409 Conflict)
- Recruiter ATS status pipeline (`Applied` ➔ `Shortlisted` ➔ `Interview` ➔ `Selected`/`Rejected`)
- In-app notification delivery
- Application withdrawal handling
- Job bookmarking (save/unsave)
- Admin analytics, user blocking, job moderation, and abuse report resolution
- In-memory cache fallback validation

---

## 🚀 Deployment Instructions

### Production Checklist
1. Ensure `NODE_ENV=production` in the production environment.
2. Provide a strong, cryptographically generated `JWT_SECRET` (minimum 32 characters).
3. Set `CLIENT_URL` to your production frontend domain (e.g. `https://myjobportal.com`).
4. Set `MONGODB_URI` to your production MongoDB cluster (e.g. MongoDB Atlas).
5. For hosting on **Render**, **Railway**, or **Heroku**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/v1/health`

---

## 📄 License

This project is licensed under the **ISC License**.
