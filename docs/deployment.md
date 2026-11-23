# 🌐 Deployment Guide & Production Checklist

## Production Deployment Checklist

### 1. Environment Configuration
- [ ] Set `NODE_ENV=production`.
- [ ] Generate a secure, cryptographically random `JWT_SECRET` (at least 32 characters long).
- [ ] Configure `CLIENT_URL` to your production frontend domain (e.g., `https://jobportal.example.com`).
- [ ] Configure `MONGODB_URI` to a managed MongoDB Atlas cluster with replicas and SSL.
- [ ] If using Redis, configure `REDIS_URL` and set `REDIS_ENABLED=true`.

---

## 2. Deploying to Cloud Platforms

### Platform A: Render / Railway
1. **Repository:** Connect your GitHub / GitLab repository.
2. **Environment:** Node.js.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables:**
   ```env
   NODE_ENV=production
   PORT=5001
   CLIENT_URL=https://your-frontend-domain.com
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/job_portal?retryWrites=true&w=majority
   JWT_SECRET=production_super_strong_secret_key_at_least_32_characters
   JWT_EXPIRES_IN=7d
   JWT_COOKIE_EXPIRES_IN=7
   REDIS_ENABLED=false
   ```
6. **Health Check Path:** `/api/v1/health`

### Platform B: Heroku / Docker / VPS
A `Procfile` is provided for container / PaaS environments:
```procfile
web: npm start
```

---

## 3. Production Hardening Verifications

- **Zero Hardcoded Secrets:** Application will automatically terminate if `JWT_SECRET` is unset.
- **Strict CORS:** Requests from origins outside `CLIENT_URL` are rejected with CORS policy errors.
- **Secure Cookies:** Cookies are set with `secure: true` (HTTPS required) and `sameSite: 'none'`.
- **Protected Resumes:** Resume files in `/uploads/resumes` cannot be browsed publicly.
- **Graceful Shutdown:** SIGTERM and SIGINT signals close active HTTP and WebSocket connections before exiting.
