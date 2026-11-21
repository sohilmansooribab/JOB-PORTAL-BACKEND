# 💼 Job Portal Backend API

A high-performance, secure, and production-ready RESTful backend API and real-time WebSocket service for a multi-role Job Portal platform, built with **Node.js**, **Express 5**, **MongoDB (Mongoose 9)**, **Redis (ioredis)**, and **Socket.io**.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture & Folder Structure](#-system-architecture--folder-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Database Seeding & Test Accounts](#-database-seeding--test-accounts)
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
- [Security & Rate Limiting](#-security--rate-limiting)
- [Testing](#-testing)
- [License](#-license)

---

## 🌟 Overview

The Job Portal Backend provides a full-featured infrastructure connecting **Candidates**, **Recruiters**, and **Administrators**:

- **Candidates** can browse and filter verified job openings, save jobs for later, submit applications with custom cover letters and resume uploads (PDF/DOCX), track application review statuses in real-time, and manage extensive professional profiles.
- **Recruiters** can post detailed job openings, manage candidates through an Applicant Tracking System (ATS), shortlist/accept/reject applications with feedback notes, view applicant resumes, and track job engagement statistics.
- **Administrators** have complete system oversight: analytics dashboards (users, jobs, applications breakdown), user management (blocking/unblocking, deletion), job moderation, and abuse report resolution.

---

## ⚡ Key Features

- **🔐 Multi-Role Authentication & RBAC**: Strict Role-Based Access Control (`candidate`, `recruiter`, `admin`) with JWT (in Authorization Header or HTTP-only cookie) and `bcryptjs` password hashing.
- **📑 Job Lifecycle & Search Engine**: Rich job queries with keyword search, category, workplace type (`Remote`, `Hybrid`, `On-site`), employment type, experience level, salary range filtering, pagination, and sorting.
- **📈 Applicant Tracking System (ATS)**: Multi-stage application status pipeline (`Pending` ➔ `Reviewing` ➔ `Shortlisted` ➔ `Accepted` / `Rejected`) with internal recruiter notes and candidate feedback.
- **⚡ Real-Time Push Alerts (Socket.io)**: Authenticated WebSocket server delivering instant notifications to candidate/recruiter private rooms and broadcast channels on new applications, status updates, and new job postings.
- **🚀 Redis Caching with Graceful Fallback**: High-speed caching for public job feeds and categories using `ioredis`. If Redis is unavailable, the application gracefully falls back to database queries without interruption.
- **📁 File Uploads (Multer & Cloudinary)**: Resume uploads (PDF/DOCX up to 5MB) and profile avatars (JPG/PNG/WEBP up to 2MB) with local disk storage and optional Cloudinary cloud storage integration.
- **🛡️ Defensive Security & Guardrails**:
  - Request payload validation using **Zod** schemas.
  - Granular API rate limiting (**express-rate-limit**) across auth, uploads, and general API routes.
  - HTTP header protection via **Helmet**.
  - Cross-Origin Resource Sharing (**CORS**) configuration with credential support.

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
| **File Uploads** | Multer, Cloudinary | `^2.5.0`, `^2.11.0` | Multipart form-data handling & cloud storage |
| **Security** | Helmet, CORS, Express Rate Limit | `^8.3.0`, `^2.8.6`, `^8.7.2`| HTTP security headers, CORS & DDoS protection |
| **Logging** | Morgan | `^1.12.1` | HTTP request logging |

---

## 📁 System Architecture & Folder Structure

```
JOB PORTAL BACKEND/
├── uploads/                        # Static uploads directory
│   ├── avatars/                    # User profile pictures
│   └── resumes/                    # Candidate resume files
├── src/
│   ├── config/                     # Infrastructure configuration
│   │   ├── cloudinary.js           # Cloudinary SDK client setup
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
│   │   └── user.controller.js        # Profile management and resume/avatar uploads
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
│   │   └── testEndpoints.js          # Comprehensive API test runner
│   ├── sockets/                    # WebSocket real-time communication
│   │   ├── notificationSocket.js     # Helper methods to dispatch real-time events
│   │   └── socketManager.js          # Socket.io connection handshake & room management
│   ├── utils/                      # Reusable utility helpers
│   │   ├── apiError.js               # Standardized ApiError class
│   │   ├── apiResponse.js            # Standardized ApiResponse formatter
│   │   ├── asyncHandler.js           # Async controller wrapper catching rejections
│   │   └── cache.js                  # Redis get/set/del wrapper with memory fallback
│   ├── validations/                # Zod validation schema contracts
│   │   ├── application.validation.js
│   │   ├── auth.validation.js
│   │   ├── job.validation.js
│   │   ├── report.validation.js
│   │   └── user.validation.js
│   ├── app.js                      # Express app assembly, middleware, and routes
│   └── server.js                   # HTTP + WebSocket server bootstrap and graceful shutdown
├── .env.example                    # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 📦 Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance running on port `27017` or a MongoDB Atlas connection URI
- **Redis** *(Optional but recommended)*: Redis server running on port `6379`

---

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd "JOB PORTAL BACKEND"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the project root by copying `.env.example`:
```bash
cp .env.example .env
```
Update `.env` with your local or cloud database credentials, JWT secrets, and client URLs.

---

## ⚙️ Environment Variables

| Variable | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `5000` | Port on which the Express server listens |
| `NODE_ENV` | No | `development` | Environment mode (`development` or `production`) |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS and WebSockets |
| `MONGODB_URI` | Yes | `mongodb://127.0.0.1:27017/job_portal` | MongoDB connection URI |
| `JWT_SECRET` | Yes | `job_portal_super_secret_jwt_key_...` | Secret key used to sign and verify JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Lifetime of the issued JWT token |
| `JWT_COOKIE_EXPIRES_IN`| No | `7` | Lifetime of authentication cookie (in days) |
| `REDIS_URL` | No | `redis://127.0.0.1:6379` | Redis host connection string |
| `REDIS_ENABLED` | No | `true` | Set to `false` to disable Redis caching |
| `CLOUDINARY_CLOUD_NAME`| No | *None* | Cloudinary account Cloud Name (optional) |
| `CLOUDINARY_API_KEY` | No | *None* | Cloudinary API Key (optional) |
| `CLOUDINARY_API_SECRET`| No | *None* | Cloudinary API Secret (optional) |

---

## 👥 Database Seeding & Test Accounts

The project includes an automated database seeder (`src/scripts/seed.js`) that populates the database with realistic sample data:
- 1 Super Admin
- 2 Recruiters with populated company profiles
- 3 Candidates with full career histories, skills, and resumes
- 6 Realistic job postings (Frontend, Backend, DevOps, Design, Product, AI)
- Multiple realistic applications, saved jobs, notifications, and reports.

To seed the database, run:
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
| **Candidate** | Michael Chang| `michael.candidate@example.com`| `CandidatePassword123!` | DevOps & Cloud Engineer |

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

Once started:
- **API Base URL**: `http://localhost:5000/api/v1`
- **Health Check**: `http://localhost:5000/api/v1/health`
- **WebSocket Endpoint**: `ws://localhost:5000`

---

## ⚡ WebSocket & Real-Time Events

Real-time capabilities are powered by **Socket.io** on the same HTTP port.

### Connection & Authentication
Clients must provide a valid JWT either via `auth.token` or the `token` query param during handshake:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "<YOUR_JWT_TOKEN>"
  },
  withCredentials: true
});
```

### Automatic Room Assignments
Upon authentication, the socket joins:
- `user_<userId>`: For private in-app notifications and alerts.
- `recruiter_<userId>`: For recruiter-specific application updates.
- `admin_channel`: For administrators to receive moderation alerts.

### Event Catalog

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `notification:new` | Server ➔ Client | Notification object | Dispatched to `user_<recipientId>` upon status change, new application, or system notice |
| `job:new` | Server ➔ Broadcast | Job object | Broadcast to all connected clients when a new job is published |

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

#### Register Request Example:
```json
POST /api/v1/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "role": "candidate",
  "phone": "+1 555-0199",
  "location": "San Francisco, CA"
}
```

---

### 3. User & Profile Management (`/api/v1/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/recruiter/:id` | Public | View public profile of a recruiter/company |
| `GET` | `/users/:id` | Authenticated | Get user profile by user ID |
| `PUT` | `/users/profile/basic` | Authenticated | Update basic user details (name, phone, location) |
| `PUT` | `/users/profile/candidate` | Candidate | Update candidate profile (bio, skills, experience, education, links) |
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
| `PUT` | `/jobs/:id` | Recruiter / Admin | Update existing job |
| `DELETE`| `/jobs/:id` | Recruiter / Admin | Delete job |
| `POST` | `/jobs/:jobId/apply` | Candidate | Submit job application (`multipart/form-data` with resume & cover letter) |

#### Job Query Parameters (`GET /api/v1/jobs`):
- `search`: Keyword search matching title, description, company name, or skills
- `category`: Filter by category (e.g. `Engineering`, `Design`, `DevOps`)
- `workplaceType`: `Remote` \| `Hybrid` \| `On-site`
- `jobType`: `Full-time` \| `Part-time` \| `Contract` \| `Internship`
- `experienceLevel`: `Entry Level` \| `Mid Level` \| `Senior Level` \| `Lead / Principal`
- `minSalary` & `maxSalary`: Filter by salary range
- `location`: Filter by location
- `page`: Page number (default: `1`)
- `limit`: Results per page (default: `10`, max: `50`)
- `sortBy`: Sorting field (`createdAt`, `salary.max`, `applicationsCount`, `viewsCount`)
- `sortOrder`: `asc` or `desc` (default: `desc`)

---

### 5. Job Applications & ATS (`/api/v1/applications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/applications/my-applications` | Candidate | List all applications submitted by candidate |
| `GET` | `/applications/recruiter` | Recruiter | List all applications submitted to recruiter's jobs |
| `GET` | `/applications/:id` | Authenticated | View application details (Applicant or Recruiter) |
| `PATCH`| `/applications/:id/status` | Recruiter / Admin | Update application status (`Pending`, `Reviewing`, `Shortlisted`, `Rejected`, `Accepted`) |
| `DELETE`| `/applications/:id` | Candidate | Withdraw submitted application |

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
| `GET` | `/admin/reports` | View all reported items with status filter (`Pending`, `Investigating`, `Resolved`, `Dismissed`) |
| `PATCH`| `/admin/reports/:id` | Update report resolution status and admin notes |

---

## 📐 Standard API Response Format

All responses adhere to a consistent JSON format:

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
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ],
  "stack": "..." // Only present in development mode
}
```

---

## 🔒 Security & Rate Limiting

- **HTTP Protection**: Headers set using `helmet` with customized `crossOriginResourcePolicy`.
- **CORS Protection**: Origin validation with credentials support.
- **Rate Limiters**:
  - **General API**: `100` requests per 15-minute window per IP.
  - **Auth Endpoints** (`/auth/login`, `/auth/register`): `10` requests per 15-minute window per IP to prevent brute-force attacks.
  - **Upload Endpoints**: `20` upload requests per 15-minute window per IP.
- **File Upload Safeguards**: MIME-type validation restricting resumes strictly to `.pdf`, `.doc`, `.docx` (max 5MB) and images to `.jpg`, `.jpeg`, `.png`, `.webp` (max 2MB).
- **Zod Request Validation**: Every write and query endpoint strictly rejects unauthorized and malformed data schemas.

---

## 🧪 Testing

The repository provides an automated endpoint testing suite validating authentication flows, job querying, application tracking, and role-based endpoints:

```bash
npm test
```

---

## 📄 License

This project is licensed under the **ISC License**.

