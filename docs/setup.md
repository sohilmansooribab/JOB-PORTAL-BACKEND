# 🚀 Local Setup Guide

Follow this guide to get the Job Portal Backend running locally on your development machine.

---

## 1. Prerequisites

Make sure the following software is installed on your machine:

- **Node.js**: `v18.0.0` or higher ([Download](https://nodejs.org/))
- **npm**: `v9.0.0` or higher
- **MongoDB**: Community Server `v6.0+` ([Download](https://www.mongodb.com/try/download/community))
- **Redis** *(Optional)*: If offline, the application automatically uses in-memory caching.

---

## 2. Installation Steps

### Step 1: Clone or Navigate to the Repository
```bash
cd "JOB PORTAL BACKEND"
```

### Step 2: Install NPM Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to create your `.env` file:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/job_portal
JWT_SECRET=job_portal_super_secret_jwt_key_2026_secure
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
REDIS_ENABLED=false
```

---

## 3. Database Initialization & Seeding

Start your local MongoDB service:
```bash
# Windows
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "C:\data\db"
```

In your project terminal, populate the database with demo accounts, jobs, and applications:
```bash
npm run seed
```

---

## 4. Starting the Server

### Development Mode (with hot-reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once running:
- **Base API URL:** `http://localhost:5001/api/v1`
- **Health Check:** `http://localhost:5001/api/v1/health`
- **WebSocket URL:** `ws://localhost:5001`

---

## 5. Running Automated Tests

Run the full automated test suite verifying all 27 critical business flows:
```bash
npm test
```
