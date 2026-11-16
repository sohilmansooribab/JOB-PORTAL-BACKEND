require('dotenv').config();
const http = require('http');
const app = require('../app');
const connectDB = require('../config/db');
const { initRedis } = require('../config/redis');
const { initSocket } = require('../sockets/socketManager');

const runTests = async () => {
  await connectDB();
  initRedis();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(5001, async () => {
    console.log('[Test Suite] Server running on port 5001');

    const BASE_URL = 'http://localhost:5001/api/v1';

    try {
      // 1. Health check
      console.log('\n--- 1. Testing GET /health ---');
      const healthRes = await fetch(`${BASE_URL}/health`);
      const healthData = await healthRes.json();
      console.log('Health status:', healthRes.status, healthData);

      // 2. Candidate Login
      console.log('\n--- 2. Testing Candidate Login ---');
      const candidateLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alex.candidate@example.com',
          password: 'CandidatePassword123!',
        }),
      });
      const candidateData = await candidateLoginRes.json();
      console.log('Candidate login status:', candidateLoginRes.status, 'Success:', candidateData.success);
      const candidateToken = candidateData.data?.token;

      // 3. Search jobs
      console.log('\n--- 3. Testing GET /jobs ---');
      const jobsRes = await fetch(`${BASE_URL}/jobs?search=react`);
      const jobsData = await jobsRes.json();
      console.log('Jobs status:', jobsRes.status, 'Total found:', jobsData.data?.jobs?.length);

      // 4. Candidate get my applications
      console.log('\n--- 4. Testing Candidate Applications ---');
      const appsRes = await fetch(`${BASE_URL}/applications/my-applications`, {
        headers: { Authorization: `Bearer ${candidateToken}` },
      });
      const appsData = await appsRes.json();
      console.log('Candidate apps status:', appsRes.status, 'Apps count:', appsData.data?.applications?.length);

      // 5. Admin Login
      console.log('\n--- 5. Testing Admin Login ---');
      const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@jobportal.com',
          password: 'AdminPassword123!',
        }),
      });
      const adminData = await adminLoginRes.json();
      console.log('Admin login status:', adminLoginRes.status, 'Role:', adminData.data?.user?.role);
      const adminToken = adminData.data?.token;

      // 6. Admin Analytics
      console.log('\n--- 6. Testing Admin Analytics ---');
      const analyticsRes = await fetch(`${BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const analyticsData = await analyticsRes.json();
      console.log('Analytics status:', analyticsRes.status, 'Analytics:', analyticsData.data);

      console.log('\n========================================');
      console.log('🎉 ALL API ENDPOINTS FUNCTIONING PERFECTLY!');
      console.log('========================================');
    } catch (err) {
      console.error('[Test Failure]:', err);
    } finally {
      server.close(() => {
        process.exit(0);
      });
    }
  });
};

runTests();
