import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@devorbit.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@devorbit.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.email);

  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      siteName: 'DevOrbit',
      tagline: 'Launching Digital Futures',
      heroTitle: 'Innovate at Light Speed',
      heroSubtitle: 'DevOrbit is the software house for visionaries. We engineer scalable web platforms, mobile apps, and AI-driven ecosystems that defy gravity.',
    },
  });
  console.log('Settings created');

  const portfolios = [
    {
      title: 'Nebula Market', category: 'E-Commerce',
      description: 'A high-performance marketplace for digital assets handling 10k+ transactions daily.',
      detailedDescription: 'Nebula Market is a comprehensive digital asset marketplace built for speed, security, and scale. The platform supports buying, selling, and trading digital assets with real-time price tracking and portfolio management.\n\nBuilt with a microservices architecture for horizontal scaling.\nReal-time bidding engine powered by WebSocket connections.\nMulti-factor authentication and cold wallet storage for security.',
      imageUrl: 'https://picsum.photos/seed/port1/600/400',
      bannerImage: 'https://picsum.photos/seed/banner1/1200/600',
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      features: ['Real-time bidding engine', 'Multi-factor authentication', 'Portfolio analytics dashboard', 'Automated tax reporting', 'Mobile biometric login', 'Cold wallet integration'],
      galleryImages: ['https://picsum.photos/seed/gal11/800/500', 'https://picsum.photos/seed/gal12/800/500', 'https://picsum.photos/seed/gal13/800/500'],
      statistics: [{ label: 'Users Served', value: '50K+', icon: 'people' }, { label: 'Transactions', value: '1.2M+', icon: 'payments' }, { label: 'Countries', value: '35+', icon: 'public' }],
      projectUrl: 'https://example.com/nebula', clientName: 'Nebula Inc.', industry: 'FinTech',
      projectDuration: '8 months', projectType: 'Greenfield', completionDate: new Date('2025-01-15'),
      featured: true, active: true, order: 1,
    },
    {
      title: 'Orbit Wallet', category: 'FinTech',
      description: 'Secure mobile wallet with biometric authentication and real-time crypto tracking.',
      detailedDescription: 'Orbit Wallet is a feature-rich cryptocurrency wallet that combines bank-grade security with a seamless user experience. Users can manage multiple currencies, track market movements, and execute trades all from one intuitive interface.',
      imageUrl: 'https://picsum.photos/seed/port2/600/400',
      bannerImage: 'https://picsum.photos/seed/banner2/1200/600',
      technologies: ['React Native', 'TypeScript', 'Web3.js', 'Solidity', 'Firebase'],
      features: ['Biometric authentication', 'Multi-currency support', 'Real-time price alerts', 'DeFi integration', 'Hardware wallet support', 'Transaction history'],
      galleryImages: ['https://picsum.photos/seed/gal21/800/500', 'https://picsum.photos/seed/gal22/800/500'],
      statistics: [{ label: 'Downloads', value: '100K+', icon: 'download' }, { label: 'Active Users', value: '25K+', icon: 'group' }, { label: 'Avg. Rating', value: '4.8★', icon: 'star' }],
      projectUrl: 'https://example.com/orbit-wallet', clientName: 'Orbit Technologies', industry: 'FinTech',
      projectDuration: '12 months', projectType: 'Greenfield', completionDate: new Date('2024-08-20'),
      featured: true, active: true, order: 2,
    },
    {
      title: 'LogiChain', category: 'Enterprise',
      description: 'Supply chain management system using blockchain for transparency and tracking.',
      detailedDescription: 'LogiChain revolutionizes supply chain management by leveraging blockchain technology to provide immutable tracking, smart contract automation, and real-time visibility across the entire logistics network.',
      imageUrl: 'https://picsum.photos/seed/port3/600/400',
      bannerImage: 'https://picsum.photos/seed/banner3/1200/600',
      technologies: ['Go', 'React', 'Hyperledger', 'MongoDB', 'Kubernetes', 'gRPC'],
      features: ['Immutable audit trail', 'Smart contract automation', 'Real-time GPS tracking', 'Supplier scorecards', 'Inventory forecasting', 'Compliance reporting'],
      galleryImages: ['https://picsum.photos/seed/gal31/800/500', 'https://picsum.photos/seed/gal32/800/500', 'https://picsum.photos/seed/gal33/800/500'],
      statistics: [{ label: 'Suppliers', value: '500+', icon: 'business' }, { label: 'Shipments/Month', value: '10K+', icon: 'local_shipping' }, { label: 'Cost Reduction', value: '32%', icon: 'trending_down' }],
      projectUrl: '', clientName: 'Global Logistics Co.', industry: 'Logistics',
      projectDuration: '14 months', projectType: 'Enterprise', completionDate: new Date('2024-11-01'),
      featured: false, active: true, order: 3,
    },
  ];
  await prisma.portfolio.deleteMany();
  for (const p of portfolios) { await prisma.portfolio.create({ data: p }); }
  console.log('Portfolio items created:', portfolios.length);

  const services = [
    { title: 'Web Development', description: 'High-performance React, Vue, and Angular applications tailored for scale.', icon: 'web', color: 'blue', order: 1, active: true },
    { title: 'Mobile Apps', description: 'Native and cross-platform mobile solutions for iOS and Android ecosystems.', icon: 'phone_iphone', color: 'indigo', order: 2, active: true },
    { title: 'AI & Machine Learning', description: 'Intelligent algorithms to automate processes and predict user behavior.', icon: 'smart_toy', color: 'pink', order: 3, active: true },
    { title: 'Cloud Solutions', description: 'Secure, scalable cloud architecture on AWS, Azure, and Google Cloud.', icon: 'cloud_queue', color: 'green', order: 4, active: true },
  ];
  try { for (const s of services) { await prisma.service.create({ data: s }); } console.log('Services created:', services.length); } catch (e: any) { console.log('Skipping services seed:', e.message); }

  const jobs = [
    { title: 'Senior Frontend Engineer', department: 'JOBS' as any, location: 'Remote / Hybrid', type: 'FULL_TIME' as const, description: 'Build cutting-edge web applications using React and TypeScript.', requirements: ['5+ years React', 'TypeScript expertise', 'Performance optimization'], benefits: ['Remote work', 'Health insurance', 'Stock options'], imageUrl: '', compensationType: 'paid', whoCanApply: 'Experienced professionals with 5+ years in frontend development', order: 1, active: true },
    { title: 'Product Designer (UI/UX)', department: 'JOBS' as any, location: 'London (On-site)', type: 'FULL_TIME' as const, description: 'Design beautiful, intuitive user experiences for our clients.', requirements: ['Portfolio required', 'Figma expertise', 'User research skills'], benefits: ['Creative environment', 'Learning budget', 'Flexible hours'], imageUrl: '', compensationType: 'paid', whoCanApply: 'Designers with a strong portfolio and user-centric mindset', order: 2, active: true },
    { title: 'Backend Developer (Go/Rust)', department: 'JOBS' as any, location: 'Remote', type: 'CONTRACT' as const, description: 'Build high-performance backend services and APIs.', requirements: ['Go or Rust experience', 'Distributed systems', 'API design'], benefits: ['Top-tier pay', 'Open source contributions', 'Flexible schedule'], imageUrl: '', compensationType: 'paid', whoCanApply: 'Experienced backend engineers with systems programming background', order: 3, active: true },
  ];
  try { for (const j of jobs) { await prisma.job.create({ data: j }); } console.log('Jobs created:', jobs.length); } catch (e: any) { console.log('Skipping jobs seed:', e.message); }

  const initiatives = [
    { title: 'Green Coding', description: 'Optimizing algorithms to reduce energy consumption in data centers. We believe in carbon-neutral code.', icon: 'eco', color: 'green', order: 1, active: true },
    { title: 'Open Source', description: 'We contribute to major frameworks and maintain our own libraries for the community to use freely.', icon: 'code_blocks', color: 'blue', order: 2, active: true },
    { title: 'Code Education', description: 'Partnering with universities to provide free workshops and internships for underrepresented students.', icon: 'school', color: 'purple', order: 3, active: true },
  ];
  try { for (const i of initiatives) { await prisma.initiative.create({ data: i }); } console.log('Initiatives created:', initiatives.length); } catch (e: any) { console.log('Skipping initiatives seed:', e.message); }

  const consultingItems = [
    { title: 'Digital Strategy', description: 'Aligning your technology roadmap with business goals for maximum ROI.', icon: 'lightbulb', color: 'orange', order: 1, active: true },
    { title: 'Tech Audit', description: 'Comprehensive analysis of your codebase, infrastructure, and security posture.', icon: 'verified_user', color: 'red', order: 2, active: true },
    { title: 'Cloud Migration', description: 'Seamless transition of legacy systems to modern, scalable cloud environments.', icon: 'cloud_sync', color: 'sky', order: 3, active: true },
  ];
  for (const c of consultingItems) { await prisma.consulting.create({ data: c }); }
  console.log('Consulting items created:', consultingItems.length);


  // ========================
  // Application Form Sections & Questions
  // ========================
  console.log('Seeding application form sections...');

  await prisma.formQuestion.deleteMany();
  await prisma.formSection.deleteMany();

  const sections = [
    {
      title: 'Personal Information',
      description: 'Basic personal details about the applicant',
      displayOrder: 1,
      questions: [
        { questionText: 'Full Name', fieldName: 'fullName', fieldType: 'text', required: true, placeholder: 'Enter your full name', displayOrder: 1 },
        { questionText: 'Email Address', fieldName: 'email', fieldType: 'email', required: true, placeholder: 'your@email.com', displayOrder: 2 },
        { questionText: 'Phone Number', fieldName: 'phone', fieldType: 'tel', required: true, placeholder: '+1 (555) 000-0000', displayOrder: 3 },
        { questionText: 'Current Location', fieldName: 'location', fieldType: 'text', required: true, placeholder: 'City, Country', displayOrder: 4 },
        { questionText: 'LinkedIn Profile', fieldName: 'linkedin', fieldType: 'url', placeholder: 'https://linkedin.com/in/your-profile', displayOrder: 5 },
        { questionText: 'Portfolio / Personal Website', fieldName: 'portfolio', fieldType: 'url', placeholder: 'https://your-portfolio.com', displayOrder: 6 },
        { questionText: 'How did you hear about DevOrbit?', fieldName: 'referral', fieldType: 'select', options: ['LinkedIn', 'GitHub', 'Twitter / X', 'Job Board', 'Friend / Referral', 'University / Campus', 'Other'], displayOrder: 7 },
      ],
    },
    {
      title: 'Education',
      description: 'Your academic background',
      displayOrder: 2,
      questions: [
        { questionText: 'Highest Level of Education', fieldName: 'educationLevel', fieldType: 'select', required: true, options: ['High School', 'Associate Degree', "Bachelor's Degree", "Master's Degree", 'PhD / Doctorate', 'Bootcamp Certificate', 'Self-Taught'], displayOrder: 1 },
        { questionText: 'Field of Study / Major', fieldName: 'fieldOfStudy', fieldType: 'text', placeholder: 'e.g. Computer Science', displayOrder: 2 },
        { questionText: 'Institution Name', fieldName: 'institution', fieldType: 'text', placeholder: 'University or school name', displayOrder: 3 },
        { questionText: 'Graduation Year', fieldName: 'graduationYear', fieldType: 'text', placeholder: 'YYYY', displayOrder: 4 },
        { questionText: 'Are you currently enrolled in a degree program?', fieldName: 'currentlyEnrolled', fieldType: 'select', options: ['Yes, full-time', 'Yes, part-time', 'No, graduated', 'No, not enrolled'], displayOrder: 5 },
      ],
    },
    {
      title: 'Work Experience',
      description: 'Your professional work history',
      displayOrder: 3,
      questions: [
        { questionText: 'Total Years of Professional Experience', fieldName: 'yearsExperience', fieldType: 'select', options: ['0 - Less than 1 year', '1 - 2 years', '3 - 5 years', '6 - 10 years', '10+ years'], displayOrder: 1 },
        { questionText: 'Current / Most Recent Job Title', fieldName: 'currentJobTitle', fieldType: 'text', placeholder: 'e.g. Software Engineer', displayOrder: 2 },
        { questionText: 'Current / Most Recent Employer', fieldName: 'currentEmployer', fieldType: 'text', placeholder: 'Company name', displayOrder: 3 },
        { questionText: 'Briefly describe your key responsibilities and achievements', fieldName: 'jobDescription', fieldType: 'textarea', placeholder: 'Describe your role, key projects, and impact...', displayOrder: 4 },
        { questionText: 'Have you previously worked at a tech company or startup?', fieldName: 'techBackground', fieldType: 'select', options: ['Yes, tech company', 'Yes, startup', 'Yes, both', 'No, but I have relevant skills', 'No'], displayOrder: 5 },
        { questionText: 'Have you led a team or managed projects before?', fieldName: 'leadershipExperience', fieldType: 'select', options: ['Yes, led teams', 'Yes, managed projects', 'Yes, both', 'No, individual contributor', 'No'], displayOrder: 6 },
      ],
    },
    {
      title: 'Skills & Technologies',
      description: 'Your technical skills and areas of expertise',
      displayOrder: 4,
      questions: [
        { questionText: 'Programming Languages', fieldName: 'programmingLanguages', fieldType: 'multiselect', options: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'SQL'], displayOrder: 1 },
        { questionText: 'Frontend Frameworks', fieldName: 'frontendFrameworks', fieldType: 'multiselect', options: ['React', 'Next.js', 'Vue / Nuxt', 'Angular', 'Svelte', 'Solid.js', 'Remix', 'Astro'], displayOrder: 2 },
        { questionText: 'Backend Frameworks', fieldName: 'backendFrameworks', fieldType: 'multiselect', options: ['Node.js / Express', 'NestJS', 'FastAPI', 'Django', 'Ruby on Rails', 'Spring Boot', 'ASP.NET', 'Gin / Echo'], displayOrder: 3 },
        { questionText: 'Databases', fieldName: 'databases', fieldType: 'multiselect', options: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB'], displayOrder: 4 },
        { questionText: 'Cloud Platforms', fieldName: 'cloudPlatforms', fieldType: 'multiselect', options: ['AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Vercel', 'Netlify', 'Cloudflare'], displayOrder: 5 },
        { questionText: 'DevOps & Infrastructure', fieldName: 'devopsTools', fieldType: 'multiselect', options: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD (GitHub Actions)', 'CI/CD (GitLab CI)', 'Ansible', 'Nginx'], displayOrder: 6 },
        { questionText: 'Design & Collaboration Tools', fieldName: 'designTools', fieldType: 'multiselect', options: ['Figma', 'Adobe XD', 'Sketch', 'Jira', 'Notion', 'Slack', 'Linear', 'Miro'], displayOrder: 7 },
        { questionText: 'Rate your overall technical proficiency', fieldName: 'skillLevel', fieldType: 'select', options: ['Beginner (learning)', 'Junior (building with guidance)', 'Mid-level (build independently)', 'Senior (lead and mentor)', 'Expert (architect and innovate)'], displayOrder: 8 },
      ],
    },
    {
      title: 'Role Preferences',
      description: 'What type of role are you looking for?',
      displayOrder: 5,
      questions: [
        { questionText: 'What role(s) are you applying for?', fieldName: 'desiredRole', fieldType: 'select', options: ['Frontend Engineer', 'Backend Engineer', 'Full-Stack Engineer', 'DevOps / Infrastructure Engineer', 'Mobile Engineer', 'UI / UX Designer', 'Product Manager', 'Data Scientist / ML Engineer', 'QA / Test Engineer'], displayOrder: 1 },
        { questionText: 'What work arrangement do you prefer?', fieldName: 'workPreference', fieldType: 'select', options: ['Remote (fully)', 'Hybrid (office + remote)', 'On-site (office)', 'Flexible'], displayOrder: 2 },
        { questionText: 'Are you willing to relocate?', fieldName: 'relocate', fieldType: 'select', options: ['Yes, anywhere', 'Yes, within my country', 'No, I prefer to stay remote', 'Not sure'], displayOrder: 3 },
        { questionText: 'What is your preferred employment type?', fieldName: 'employmentType', fieldType: 'select', options: ['Full-time', 'Part-time', 'Contract / Freelance', 'Internship', 'Co-founder / Equity-based'], displayOrder: 4 },
        { questionText: 'What is your expected salary range (annual)?', fieldName: 'salaryExpectation', fieldType: 'select', options: ['Under $30k', '$30k - $50k', '$50k - $80k', '$80k - $120k', '$120k - $150k', '$150k - $200k', '$200k+', 'Prefer not to say'], displayOrder: 5 },
        { questionText: 'How soon can you start?', fieldName: 'availability', fieldType: 'select', options: ['Immediately', '2 weeks notice', '1 month notice', '3+ months'], displayOrder: 6 },
      ],
    },
    {
      title: 'Open Source & Community',
      description: 'Your contributions to the developer community',
      displayOrder: 6,
      questions: [
        { questionText: 'Do you contribute to open source projects?', fieldName: 'ossContributor', fieldType: 'select', options: ['Yes, actively', 'Yes, occasionally', 'No, but I want to start', 'No'], displayOrder: 1 },
        { questionText: 'GitHub Profile URL', fieldName: 'githubUrl', fieldType: 'url', placeholder: 'https://github.com/your-username', displayOrder: 2 },
        { questionText: 'Do you write technical blog posts or create dev content?', fieldName: 'contentCreator', fieldType: 'select', options: ['Yes, I blog regularly', 'Yes, I create video content', 'Yes, both', 'No, but interested', 'No'], displayOrder: 3 },
        { questionText: 'Have you spoken at conferences, meetups, or workshops?', fieldName: 'speaker', fieldType: 'select', options: ['Yes, international conferences', 'Yes, local meetups', 'Yes, internal / company events', 'No, but interested', 'No'], displayOrder: 4 },
        { questionText: 'Are you part of any developer communities?', fieldName: 'communities', fieldType: 'textarea', placeholder: 'List any communities you are active in (e.g. Discord servers, Slack groups, forums)', displayOrder: 5 },
      ],
    },
    {
      title: 'Motivation & Culture Fit',
      description: 'Help us understand what drives you',
      displayOrder: 7,
      questions: [
        { questionText: 'Why do you want to work at DevOrbit?', fieldName: 'motivation', fieldType: 'textarea', required: true, placeholder: 'Share what excites you about DevOrbit and how you align with our mission...', displayOrder: 1 },
        { questionText: 'What type of projects or technologies excite you the most?', fieldName: 'excitedBy', fieldType: 'textarea', placeholder: 'Describe the kind of work that energizes you...', displayOrder: 2 },
        { questionText: 'How do you prefer to receive feedback?', fieldName: 'feedbackStyle', fieldType: 'select', options: ['Direct and candid', 'Constructive with examples', 'Written (async)', 'One-on-one meetings'], displayOrder: 3 },
        { questionText: 'Describe your ideal work environment', fieldName: 'idealEnvironment', fieldType: 'textarea', placeholder: 'What does your perfect work setup look like?', displayOrder: 4 },
        { questionText: 'How do you handle tight deadlines or high-pressure situations?', fieldName: 'pressureHandling', fieldType: 'textarea', placeholder: 'Give an example of how you managed a stressful situation...', displayOrder: 5 },
      ],
    },
    {
      title: 'Diversity & Inclusion',
      description: 'We are committed to building a diverse and inclusive team (all responses are confidential)',
      displayOrder: 8,
      questions: [
        { questionText: 'Do you identify with any underrepresented group in tech?', fieldName: 'underrepresented', fieldType: 'select', options: ['Yes', 'No', 'Prefer not to say'], displayOrder: 1 },
        { questionText: 'What can DevOrbit do to create a more inclusive workplace?', fieldName: 'inclusionSuggestions', fieldType: 'textarea', placeholder: 'Share your thoughts on fostering inclusivity...', displayOrder: 2 },
        { questionText: 'Do you require any accommodations during the interview process?', fieldName: 'accommodations', fieldType: 'textarea', placeholder: 'Let us know how we can support you...', displayOrder: 3 },
      ],
    },
    {
      title: 'Additional Information',
      description: 'Anything else you would like us to know',
      displayOrder: 9,
      questions: [
        { questionText: 'Upload your resume / CV', fieldName: 'resume', fieldType: 'file', helpText: 'Accepted formats: PDF, DOCX. Max 5MB.', displayOrder: 1 },
        { questionText: 'Cover Letter or Message to the Team', fieldName: 'coverLetter', fieldType: 'textarea', placeholder: 'Tell us anything else you want us to know...', displayOrder: 2 },
        { questionText: 'Do you have any references we can contact?', fieldName: 'references', fieldType: 'textarea', placeholder: 'Names and contact info of professional references', displayOrder: 3 },
        { questionText: 'Is there anything else we should know about your application?', fieldName: 'additionalNotes', fieldType: 'textarea', placeholder: 'Any additional context or information...', displayOrder: 4 },
        { questionText: 'I confirm that all information provided is accurate', fieldName: 'confirmation', fieldType: 'checkbox', required: true, options: ['I confirm'], displayOrder: 5 },
      ],
    },
  ];

  for (const section of sections) {
    const { questions, ...sectionData } = section;
    const created = await prisma.formSection.create({
      data: {
        ...sectionData,
        questions: {
          create: questions.map((q) => ({
            ...q,
            options: q.options || undefined,
          })),
        },
      },
      include: { questions: true },
    });
    console.log(`  Section "${created.title}" created with ${created.questions.length} questions`);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });