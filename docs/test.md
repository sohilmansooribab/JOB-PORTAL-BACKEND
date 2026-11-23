# 🧪 Testing Guide & Verification Results

## Running Tests

Run the automated test runner:
```bash
npm test
```

The test runner starts a dedicated local test instance on port `5099` (so it never collides with your active dev server on port `5001`), executes all test cases sequentially, verifies responses and status codes, and outputs a summary.

---

## Verified Test Cases (27 Total)

| # | Test Scenario | Expected Status | Verified Behavior |
|---|---|:---:|---|
| 1 | Candidate Registration | `201 Created` | Creates candidate account, hashes password, returns JWT |
| 2 | Candidate Login | `200 OK` | Verifies bcrypt password, returns JWT token & user profile |
| 3 | Invalid Login | `401 Unauthorized` | Rejects incorrect password with unauthorized error |
| 4 | Candidate Profile Update | `200 OK` | Updates basic name and phone contact details |
| 5 | Secure Resume Access | `401 Unauthorized` | Blocks unauthenticated users from accessing resume files |
| 6 | Job Creation (Recruiter) | `201 Created` | Recruiter creates active job posting with company metadata |
| 7 | Unauthorized Job Creation | `403 Forbidden` | Blocks candidates from posting jobs |
| 8 | Safe Search & Regex Escaping | `200 OK` | Queries title and company without ReDoS vulnerabilities |
| 9 | Multi-criteria Job Filtering | `200 OK` | Filters by category, workplace type, and location |
| 10 | Job Pagination | `200 OK` | Returns paginated subset with `currentPage` and `limit` |
| 11 | Job Details by ID | `200 OK` | Fetches complete job record and increments view count |
| 12 | Candidate Applies to Job | `201 Created` | Submits application with resume URL and cover letter |
| 13 | Duplicate Application Block | `409 Conflict` | Compound index prevents candidate applying twice to same job |
| 14 | Recruiter Views Applications | `200 OK` | Returns applicants for recruiter's jobs with candidate profiles |
| 15 | ATS Status Update | `200 OK` | Updates status: `Applied` ➔ `Shortlisted` with feedback |
| 16 | Real-time In-App Notifications | `200 OK` | Candidate receives notification on status update |
| 17 | Candidate Withdraws App | `200 OK` | Withdraws application in `Applied` state and decrements count |
| 18 | Save / Bookmark Job | `201 Created` | Bookmarks job for candidate |
| 19 | Unsave / Remove Bookmark | `200 OK` | Removes bookmarked job |
| 20 | Admin Lists Users | `200 OK` | Administrator queries system user directory |
| 21 | Admin Moderates Jobs | `200 OK` | Administrator views all jobs across the platform |
| 22 | Admin Resolves Reports | `200 OK` | Updates abuse report status to `Resolved` with admin notes |
| 23 | Invalid JWT Rejection | `401 Unauthorized` | Rejects malformed or forged tokens |
| 24 | Cross-User Profile IDOR Block | `403 Forbidden` | Candidates cannot access other candidates' private profiles |
| 25 | Zod Schema Validation | `400 Bad Request` | Rejects malformed payloads with field-level error messages |
| 26 | Malformed Regex Input | `200 OK` | Handles unbalanced regex symbols safely without 500 error |
| 27 | In-Memory Cache Subsystem | `Internal` | Reads and writes cache entries with TTL fallback |
