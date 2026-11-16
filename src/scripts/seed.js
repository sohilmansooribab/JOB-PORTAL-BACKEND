require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/job_portal';
    console.log(`[Seed] Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      SavedJob.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users...');

    // 1. Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@jobportal.com',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+1 555-0100',
      location: 'San Francisco, CA',
    });

    // 2. Recruiters
    const recruiter1 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah.recruiter@techcorp.io',
      password: 'RecruiterPassword123!',
      role: 'recruiter',
      phone: '+1 555-0123',
      location: 'New York, NY',
      recruiterProfile: {
        companyName: 'TechCorp Solutions',
        companyWebsite: 'https://techcorp.io',
        companyDescription: 'Building high-scale distributed cloud systems and AI tools.',
        industry: 'Software & Technology',
        companySize: '51-200',
        location: 'New York, NY',
      },
    });

    const recruiter2 = await User.create({
      name: 'David Miller',
      email: 'david.recruiter@cloudscale.net',
      password: 'RecruiterPassword123!',
      role: 'recruiter',
      phone: '+1 555-0145',
      location: 'Austin, TX',
      recruiterProfile: {
        companyName: 'CloudScale Networks',
        companyWebsite: 'https://cloudscale.net',
        companyDescription: 'Pioneering next-generation edge networking and cloud security.',
        industry: 'Telecommunications & Cloud',
        companySize: '201-500',
        location: 'Austin, TX',
      },
    });

    // 3. Candidates
    const candidate1 = await User.create({
      name: 'Alex Johnson',
      email: 'alex.candidate@example.com',
      password: 'CandidatePassword123!',
      role: 'candidate',
      phone: '+1 555-0199',
      location: 'Seattle, WA',
      candidateProfile: {
        headline: 'Senior Full Stack Engineer (React, Node.js, TypeScript, AWS)',
        bio: 'Passionate software engineer with 6+ years of building performant web applications and microservices.',
        skills: ['JavaScript', 'TypeScript', 'Node.js', 'Express', 'React', 'MongoDB', 'Redis', 'Docker'],
        experienceYears: 6,
        education: [
          {
            degree: 'B.S. Computer Science',
            institution: 'University of Washington',
            fieldOfStudy: 'Computer Science',
            startYear: 2015,
            endYear: 2019,
          },
        ],
        experience: [
          {
            title: 'Senior Software Engineer',
            company: 'NextGen Apps',
            location: 'Seattle, WA',
            startDate: new Date('2021-06-01'),
            current: true,
            description: 'Architected microservices handling 2M daily requests using Node.js and MongoDB.',
          },
        ],
        resumeUrl: '/uploads/resumes/sample-alex-resume.pdf',
        resumeOriginalName: 'Alex_Johnson_Resume_2026.pdf',
        githubUrl: 'https://github.com/alexjohnson',
        linkedinUrl: 'https://linkedin.com/in/alexjohnson',
      },
    });

    const candidate2 = await User.create({
      name: 'Emily Davis',
      email: 'emily.candidate@example.com',
      password: 'CandidatePassword123!',
      role: 'candidate',
      phone: '+1 555-0188',
      location: 'Chicago, IL',
      candidateProfile: {
        headline: 'Frontend Engineer & UI Specialist (React, Next.js, TailwindCSS)',
        bio: 'Frontend specialist crafting fluid user experiences and accessible web interfaces.',
        skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'GraphQL', 'Redux', 'Jest'],
        experienceYears: 4,
        education: [
          {
            degree: 'B.S. Software Engineering',
            institution: 'University of Illinois',
            fieldOfStudy: 'Software Engineering',
            startYear: 2017,
            endYear: 2021,
          },
        ],
        resumeUrl: '/uploads/resumes/sample-emily-resume.pdf',
        resumeOriginalName: 'Emily_Davis_CV.pdf',
        portfolioUrl: 'https://emilydavis.dev',
      },
    });

    console.log('[Seed] Seeding Jobs...');

    const job1 = await Job.create({
      title: 'Senior Full Stack Developer',
      description:
        'We are seeking an experienced Senior Full Stack Developer to lead development of our core cloud analytics platform. You will design, build, and deploy robust APIs and interactive web experiences.',
      recruiter: recruiter1._id,
      company: {
        name: recruiter1.recruiterProfile.companyName,
        logo: recruiter1.recruiterProfile.companyLogo || '',
        website: recruiter1.recruiterProfile.companyWebsite || '',
        location: recruiter1.recruiterProfile.location || '',
      },
      location: 'San Francisco, CA (Remote)',
      workplaceType: 'Remote',
      jobType: 'Full-time',
      experienceLevel: 'Senior Level',
      category: 'Engineering',
      salary: {
        min: 130000,
        max: 175000,
        currency: 'USD',
        isNegotiable: true,
      },
      skillsRequired: ['Node.js', 'React', 'MongoDB', 'Docker', 'AWS', 'TypeScript'],
      responsibilities: [
        'Architect scalable REST and GraphQL APIs',
        'Collaborate with product and design teams to ship intuitive features',
        'Mentor junior developers and lead code reviews',
      ],
      requirements: [
        '5+ years of software development experience',
        'Proficiency in Node.js, Express, and React',
        'Solid understanding of database design and performance optimization',
      ],
      benefits: ['Health, Dental, Vision insurance', 'Unlimited PTO', '$3,000 annual learning stipend', 'Home office setup bonus'],
      status: 'Active',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const job2 = await Job.create({
      title: 'Backend Node.js & Distributed Systems Engineer',
      description:
        'Join CloudScale Networks to engineer ultra-low latency microservices, data caching layers with Redis, and message queues handling massive global throughput.',
      recruiter: recruiter2._id,
      company: {
        name: recruiter2.recruiterProfile.companyName,
        logo: recruiter2.recruiterProfile.companyLogo || '',
        website: recruiter2.recruiterProfile.companyWebsite || '',
        location: recruiter2.recruiterProfile.location || '',
      },
      location: 'Austin, TX (Hybrid)',
      workplaceType: 'Hybrid',
      jobType: 'Full-time',
      experienceLevel: 'Senior Level',
      category: 'Engineering',
      salary: {
        min: 140000,
        max: 185000,
        currency: 'USD',
        isNegotiable: false,
      },
      skillsRequired: ['Node.js', 'Redis', 'Kafka', 'PostgreSQL', 'Kubernetes'],
      responsibilities: [
        'Design fault-tolerant distributed services',
        'Optimize Redis caching pipelines for sub-10ms response times',
        'Implement real-time WebSocket channels for telemetry updates',
      ],
      requirements: [
        '4+ years backend engineering experience with high-load systems',
        'Deep understanding of event-driven architectures',
      ],
      benefits: ['Equity package', '401(k) matching up to 5%', 'Flexible work hours'],
      status: 'Active',
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    });

    const job3 = await Job.create({
      title: 'Frontend React / Next.js Engineer',
      description:
        'Create delightful, pixel-perfect user interfaces and dashboards for our enterprise cloud portal. You will build design system components and maintain high frontend code quality.',
      recruiter: recruiter1._id,
      company: {
        name: recruiter1.recruiterProfile.companyName,
        logo: recruiter1.recruiterProfile.companyLogo || '',
        website: recruiter1.recruiterProfile.companyWebsite || '',
        location: recruiter1.recruiterProfile.location || '',
      },
      location: 'New York, NY (Remote)',
      workplaceType: 'Remote',
      jobType: 'Full-time',
      experienceLevel: 'Mid Level',
      category: 'Design & Engineering',
      salary: {
        min: 95000,
        max: 130000,
        currency: 'USD',
        isNegotiable: true,
      },
      skillsRequired: ['React', 'Next.js', 'TailwindCSS', 'TypeScript', 'Jest'],
      responsibilities: [
        'Build reusable UI component libraries',
        'Enhance web accessibility (WCAG 2.1 AA compliance)',
        'Optimize client-side performance and Core Web Vitals',
      ],
      requirements: [
        '3+ years professional frontend engineering experience',
        'Solid mastery of modern CSS, React hooks, and TypeScript',
      ],
      benefits: ['Remote first culture', 'Competitive health coverage', 'Company retreats'],
      status: 'Active',
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    });

    console.log('[Seed] Seeding Applications...');

    const app1 = await Application.create({
      job: job1._id,
      candidate: candidate1._id,
      recruiter: recruiter1._id,
      resumeUrl: candidate1.candidateProfile.resumeUrl,
      resumeOriginalName: candidate1.candidateProfile.resumeOriginalName,
      coverLetter:
        'I am excited about TechCorp’s mission. With over 6 years building distributed Node.js services and React frontends, I would love to contribute to your core analytics platform.',
      status: 'Shortlisted',
      recruiterNotes: 'Impressive GitHub profile and solid architectural experience.',
      feedback: 'We were very impressed with your background and would like to schedule a technical round.',
    });

    const app2 = await Application.create({
      job: job3._id,
      candidate: candidate2._id,
      recruiter: recruiter1._id,
      resumeUrl: candidate2.candidateProfile.resumeUrl,
      resumeOriginalName: candidate2.candidateProfile.resumeOriginalName,
      coverLetter:
        'My expertise in Next.js, design systems, and frontend performance aligns perfectly with the requirements of this role.',
      status: 'Pending',
    });

    // Update job application counts
    await Job.findByIdAndUpdate(job1._id, { $inc: { applicationsCount: 1 } });
    await Job.findByIdAndUpdate(job3._id, { $inc: { applicationsCount: 1 } });

    console.log('[Seed] Seeding Bookmarked / Saved Jobs...');
    await SavedJob.create({
      candidate: candidate1._id,
      job: job2._id,
    });

    console.log('[Seed] Seeding Notifications...');
    await Notification.create({
      recipient: candidate1._id,
      sender: recruiter1._id,
      type: 'APPLICATION_STATUS_UPDATED',
      title: 'Application Shortlisted',
      message: `Your application for "${job1.title}" has been shortlisted!`,
      data: { jobId: job1._id, applicationId: app1._id },
    });

    console.log('==================================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('Demo Credentials:');
    console.log('--------------------------------------------------');
    console.log('1. Admin:');
    console.log('   Email:    admin@jobportal.com');
    console.log('   Password: AdminPassword123!');
    console.log('2. Recruiter 1 (TechCorp):');
    console.log('   Email:    sarah.recruiter@techcorp.io');
    console.log('   Password: RecruiterPassword123!');
    console.log('3. Recruiter 2 (CloudScale):');
    console.log('   Email:    david.recruiter@cloudscale.net');
    console.log('   Password: RecruiterPassword123!');
    console.log('4. Candidate 1:');
    console.log('   Email:    alex.candidate@example.com');
    console.log('   Password: CandidatePassword123!');
    console.log('5. Candidate 2:');
    console.log('   Email:    emily.candidate@example.com');
    console.log('   Password: CandidatePassword123!');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
