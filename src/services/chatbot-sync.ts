import { prisma } from '../lib/prisma.js';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATIC_QA: { question: string; answer: string; source: 'static' | 'service' | 'portfolio' | 'job' | 'initiative' | 'consulting' | 'settings' }[] = [
  { question: 'hi', answer: 'Hey there! How can I assist you today? 😊', source: 'static' },
  { question: 'hello', answer: 'Hi! Welcome to DevOrbit. How can I help you today?', source: 'static' },
  { question: 'hey there', answer: 'Hey there! How can I assist you today? 😊', source: 'static' },
  { question: 'how are you', answer: "I'm doing great, thanks for asking! How can I help you today?", source: 'static' },
  { question: 'what is your name', answer: "I'm the DevOrbit AI Assistant! I'm here to answer your questions about our services, pricing, technologies, and more.", source: 'static' },
  { question: 'who are you', answer: "I'm the DevOrbit AI Assistant! I can help you with information about our services, pricing, portfolio, and tech stack.", source: 'static' },
  { question: 'can you help me', answer: "Of course! I can help you with information about DevOrbit's services, pricing, technologies, portfolio, and more. What would you like to know?", source: 'static' },
  { question: 'thank you', answer: "You're welcome! 😊 Feel free to ask if you have any other questions.", source: 'static' },
  { question: 'thanks', answer: "You're welcome! Happy to help. Let me know if there's anything else.", source: 'static' },
  { question: 'bye', answer: "Goodbye! Feel free to come back anytime. Have a great day! 😊", source: 'static' },
  { question: 'goodbye', answer: "Goodbye! Feel free to come back anytime. Have a great day! 😊", source: 'static' },
  { question: 'what services does devorbit offer', answer: 'DevOrbit offers a comprehensive range of digital services including web development, mobile app development, AI and machine learning solutions, cloud infrastructure, UI/UX design, DevOps consulting, and custom enterprise software development.', source: 'static' },
  { question: 'what technologies does devorbit use', answer: 'We specialize in modern technologies including React, Next.js, Vue.js, Node.js, Python, TypeScript, Go, AWS, Azure, Google Cloud, Docker, Kubernetes, PostgreSQL, MongoDB, TensorFlow, and PyTorch.', source: 'static' },
  { question: 'how much does devorbit charge for a website', answer: 'Our pricing is project-based and varies depending on complexity and scope. A simple landing page starts around $2,000, while a full-featured web application can range from $10,000 to $50,000+. Contact us for a free consultation and custom quote.', source: 'static' },
  { question: 'what is the typical project timeline', answer: 'Project timelines depend on scope. A basic website takes 2-4 weeks, a complex web application 6-12 weeks, and enterprise solutions 3-6 months.', source: 'static' },
  { question: 'does devorbit build mobile apps', answer: 'Yes! We build native iOS and Android apps using Swift, Kotlin, and cross-platform solutions with React Native and Flutter.', source: 'static' },
  { question: 'what ai solutions does devorbit provide', answer: 'We deliver AI solutions including custom machine learning models, natural language processing, computer vision systems, predictive analytics, recommendation engines, and AI-powered automation.', source: 'static' },
  { question: 'can i see devorbit portfolio', answer: 'Absolutely! Our portfolio showcases projects across e-commerce, healthcare, fintech, education, and SaaS platforms. Visit our Portfolio page or contact us for case studies relevant to your industry.', source: 'static' },
  { question: 'how does the development process work', answer: 'Our process follows five phases: 1) Discovery & Strategy, 2) Design, 3) Development using agile sprints, 4) Testing & QA, 5) Launch & Support.', source: 'static' },
  { question: 'does devorbit provide post-launch support', answer: 'Yes, we offer comprehensive post-launch support including bug fixes, feature updates, performance monitoring, security patches, and 24/7 emergency support.', source: 'static' },
  { question: 'how can i contact devorbit', answer: 'You can reach us through our website contact form, email us at devorbitsoftsolutions@gmail.com, or reach out on WhatsApp. We typically respond within 24 hours.', source: 'static' },
  { question: 'what industries does devorbit serve', answer: 'We serve a wide range of industries including healthcare, fintech, e-commerce, education, real estate, logistics, entertainment, and SaaS.', source: 'static' },
  { question: 'does devorbit offer ui ux design services', answer: 'Yes, our design team specializes in user research, information architecture, wireframing, high-fidelity prototyping, usability testing, and design systems.', source: 'static' },
  { question: 'what are your prices', answer: 'DevOrbit offers competitive, project-based pricing. A basic website starts at $2,000, mobile apps from $8,000, AI solutions from $5,000, and cloud setup from $2,000. Hourly rates range from $100-$175. Contact us for a free custom quote.', source: 'static' },
  { question: 'how much does it cost', answer: 'Our pricing depends on the project scope. A standard business website is $2,000-$5,000, mobile apps $8,000+, AI proof of concepts from $5,000. We offer free 30-minute consultations to provide an accurate estimate.', source: 'static' },
  { question: 'tell me about pricing', answer: 'DevOrbit uses project-based pricing: websites start at $2,000, apps at $8,000, AI solutions at $5,000, and cloud/DevOps from $2,000. Hourly consulting is $100-$175/hour. Every project starts with a free discovery call.', source: 'static' },
  { question: 'what are your rates', answer: 'DevOrbit rates: Fixed project pricing for well-defined scopes, or hourly at $100-$175/hour depending on technology and complexity. Monthly retainers for ongoing support start at $500/month.', source: 'static' },
  { question: 'do you have pricing for small businesses', answer: 'Yes! We work with businesses of all sizes. Basic websites start at $2,000, and we offer flexible payment plans (50% upfront, 25% mid-point, 25% on completion). Contact us for options that fit your budget.', source: 'static' },
  { question: 'tell me about prices', answer: 'DevOrbit uses project-based pricing: websites start at $2,000, mobile apps at $8,000, AI solutions from $5,000, and cloud/DevOps from $2,000. Hourly consulting is $100-$175/hour. Contact us for a free quote tailored to your needs.', source: 'static' },
  { question: 'i want to know about prices', answer: 'Here is an overview of DevOrbit pricing: Basic website $2,000-$5,000, E-commerce $5,000+, Mobile app $8,000-$30,000+, AI/ML solution $5,000-$100,000+, Cloud setup from $2,000. Hourly rate $100-$175. Free 30-min consultation available.', source: 'static' },
  { question: 'can you tell me about prices', answer: 'Of course! DevOrbit pricing varies by project: Websites from $2,000, Mobile apps from $8,000, AI solutions from $5,000. We offer free consultations to provide accurate quotes. What type of project are you interested in?', source: 'static' },
  { question: 'what are the costs for services', answer: 'Here is a quick pricing guide: Website development $2,000-$50,000+, Mobile apps $8,000-$30,000+, AI/ML $5,000-$100,000+, DevOps $2,000-$10,000. Hourly consulting $100-$175. Monthly maintenance $500-$2,000. Contact us for a custom quote!', source: 'static' },
  { question: 'what is devorbit tech stack for web development', answer: 'For web development, we use React, Next.js, Vue.js, and Angular on the frontend, with Node.js, Python (Django/FastAPI), and Go on the backend.', source: 'static' },
  { question: 'does devorbit do devops and cloud', answer: 'Absolutely. We offer full DevOps services including CI/CD pipeline setup, infrastructure as code, containerization, cloud migration, monitoring, and AWS/Azure/GCP architecture consulting.', source: 'static' },
  { question: 'what is devorbit project discovery process', answer: 'During discovery, we conduct stakeholder interviews, analyze your target audience, review competitors, define technical requirements, and create a project roadmap with timeline, milestones, and cost estimate.', source: 'static' },
];

function slugify(text: string | undefined | null): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function generateServiceQA(items: { title: string; description: string; icon: string }[]) {
  const pairs: typeof STATIC_QA = [];
  for (const s of items) {
    pairs.push({
      question: `tell me about ${slugify(s.title)} service`,
      answer: `${s.title}: ${s.description}`,
      source: 'service',
    });
    pairs.push({
      question: `what is ${slugify(s.title)}`,
      answer: `${s.title}: ${s.description}`,
      source: 'service',
    });
    pairs.push({
      question: `does devorbit offer ${slugify(s.title)}`,
      answer: `Yes! ${s.title}: ${s.description}`,
      source: 'service',
    });
  }
  pairs.push({
    question: 'what services does devorbit offer',
    answer: `DevOrbit offers the following services: ${items.map(s => s.title).join(', ')}. Each service is tailored to your specific needs. Contact us for a free consultation.`,
    source: 'service',
  });
  return pairs;
}

function generatePortfolioQA(items: { title: string; category: string; description: string }[]) {
  const pairs: typeof STATIC_QA = [];
  for (const p of items) {
    pairs.push({
      question: `tell me about ${slugify(p.title)} project`,
      answer: `${p.title} (${p.category}): ${p.description}`,
      source: 'portfolio',
    });
    pairs.push({
      question: `show me ${slugify(p.title)} portfolio`,
      answer: `${p.title} (${p.category}): ${p.description}`,
      source: 'portfolio',
    });
  }
  const byCategory = new Map<string, typeof items>();
  for (const p of items) {
    const cat = byCategory.get(p.category) || [];
    cat.push(p);
    byCategory.set(p.category, cat);
  }
  for (const [cat, projects] of byCategory) {
    pairs.push({
      question: `show me ${slugify(cat)} portfolio projects`,
      answer: `Our ${cat} portfolio includes: ${projects.map(p => p.title).join(', ')}.`,
      source: 'portfolio',
    });
  }
  if (items.length > 0) {
    pairs.push({
      question: 'can i see devorbit portfolio',
      answer: `We have ${items.length} projects in our portfolio across categories including ${[...byCategory.keys()].join(', ')}. Notable projects: ${items.slice(0, 5).map(p => p.title).join(', ')}.`,
      source: 'portfolio',
    });
    pairs.push({
      question: 'show me all portfolio projects',
      answer: `Our portfolio includes ${items.length} projects: ${items.map(p => `${p.title} (${p.category})`).join(', ')}.`,
      source: 'portfolio',
    });
  }
  return pairs;
}

function generateJobQA(items: { title: string; department: string; location: string; type: string; description: string; requirements: string[]; benefits: string[] }[]) {
  const pairs: typeof STATIC_QA = [];
  for (const j of items) {
    pairs.push({
      question: `tell me about ${slugify(j.title)} job`,
      answer: `${j.title} - ${j.department} - ${j.location} (${j.type.replace('_', ' ')}): ${j.description}`,
      source: 'job',
    });
  }
  const byDept = new Map<string, typeof items>();
  for (const j of items) {
    const dept = byDept.get(j.department) || [];
    dept.push(j);
    byDept.set(j.department, dept);
  }
  for (const [dept, jobs] of byDept) {
    pairs.push({
      question: `what jobs are available in ${slugify(dept)}`,
      answer: `Current ${dept} openings: ${jobs.map(j => `${j.title} (${j.location}, ${j.type.replace('_', ' ')})`).join(', ')}.`,
      source: 'job',
    });
  }
  if (items.length > 0) {
    pairs.push({
      question: 'what jobs are available at devorbit',
      answer: `We currently have ${items.length} open positions: ${items.map(j => `${j.title} - ${j.department} (${j.location})`).join(', ')}. Visit our Careers page to apply!`,
      source: 'job',
    });
    pairs.push({
      question: 'is devorbit hiring',
      answer: `Yes! We have ${items.length} open positions: ${items.map(j => j.title).join(', ')}. Check our Careers page for details and requirements.`,
      source: 'job',
    });
  }
  return pairs;
}

function generateInitiativeQA(items: { title: string; description: string }[]) {
  const pairs: typeof STATIC_QA = [];
  for (const ini of items) {
    pairs.push({
      question: `tell me about ${slugify(ini.title)} initiative`,
      answer: `${ini.title}: ${ini.description}`,
      source: 'initiative',
    });
  }
  if (items.length > 0) {
    pairs.push({
      question: 'what initiatives does devorbit have',
      answer: `DevOrbit runs ${items.length} key initiatives: ${items.map(i => i.title).join(', ')}. ${items.map(i => `${i.title}: ${i.description}`).join(' ')}`,
      source: 'initiative',
    });
    pairs.push({
      question: 'what social impact does devorbit make',
      answer: `Through our initiatives (${items.map(i => i.title).join(', ')}), we make a positive impact on the community and environment.`,
      source: 'initiative',
    });
    pairs.push({
      question: 'does devorbit give back to community',
      answer: `Yes! Our initiatives include: ${items.map(i => `${i.title} - ${i.description}`).join(' ')}`,
      source: 'initiative',
    });
  }
  return pairs;
}

function generateConsultingQA(items: { title: string; description: string }[]) {
  const pairs: typeof STATIC_QA = [];
  for (const c of items) {
    pairs.push({
      question: `tell me about ${slugify(c.title)} consulting`,
      answer: `${c.title}: ${c.description}`,
      source: 'consulting',
    });
    pairs.push({
      question: `does devorbit offer ${slugify(c.title)} consulting`,
      answer: `Yes! ${c.title}: ${c.description}`,
      source: 'consulting',
    });
  }
  if (items.length > 0) {
    pairs.push({
      question: 'what consulting services does devorbit offer',
      answer: `We offer ${items.length} consulting services: ${items.map(c => c.title).join(', ')}. ${items.map(c => `${c.title}: ${c.description}`).join(' ')}`,
      source: 'consulting',
    });
  }
  return pairs;
}

function generateSiteInfoQA(settings: { siteName?: string; tagline?: string; heroTitle?: string; heroSubtitle?: string }) {
  const pairs: typeof STATIC_QA = [];
  if (settings.siteName) {
    pairs.push({ question: 'what is the company name', answer: `Our company is called ${settings.siteName}.`, source: 'settings' });
  }
  if (settings.tagline) {
    pairs.push({ question: 'what is the company tagline', answer: `Our tagline is: ${settings.tagline}`, source: 'settings' });
    pairs.push({ question: `what is ${slugify(settings.siteName || '')} tagline`, answer: `${settings.tagline}`, source: 'settings' });
  }
  return pairs;
}

export async function generateDynamicQA() {
  const [services, portfolio, jobs, initiatives, consulting, settings] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.portfolio.findMany({ orderBy: { order: 'asc' } }),
    prisma.job.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.initiative.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.consulting.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
  ]);

  const qa = [
    ...STATIC_QA,
    ...generateServiceQA(services),
    ...generatePortfolioQA(portfolio),
    ...generateJobQA(jobs),
    ...generateInitiativeQA(initiatives),
    ...generateConsultingQA(consulting),
    ...generateSiteInfoQA(settings || {}),
  ];

  return qa;
}

export async function generatePDFText() {
  const [services, portfolio, jobs, initiatives, consulting, settings] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.portfolio.findMany({ orderBy: { order: 'asc' } }),
    prisma.job.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.initiative.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.consulting.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.siteSettings.findUnique({ where: { id: 'main' } }),
  ]);

  const lines: string[] = [];
  const s = settings || { siteName: 'DevOrbit', tagline: 'Launching Digital Futures', heroTitle: '', heroSubtitle: '' };
  const sn = s.siteName || 'DevOrbit';

  lines.push('='.repeat(60));
  lines.push(`${sn} - Company Information Database`);
  lines.push('='.repeat(60));
  lines.push(`Company Name: ${sn}`);
  lines.push(`Tagline: ${s.tagline || ''}`);
  lines.push(`Hero: ${s.heroTitle || ''} - ${s.heroSubtitle || ''}`);
  lines.push('');

  if (services.length > 0) {
    lines.push('='.repeat(60));
    lines.push('SERVICES');
    lines.push('='.repeat(60));
    for (const svc of services) {
      lines.push(`Service: ${svc.title}`);
      lines.push(`Description: ${svc.description}`);
      lines.push('');
    }
  }

  if (portfolio.length > 0) {
    lines.push('='.repeat(60));
    lines.push('PORTFOLIO PROJECTS');
    lines.push('='.repeat(60));
    for (const p of portfolio) {
      lines.push(`Project: ${p.title}`);
      lines.push(`Category: ${p.category}`);
      lines.push(`Description: ${p.description}`);
      lines.push('');
    }
  }

  if (jobs.length > 0) {
    lines.push('='.repeat(60));
    lines.push('JOB OPENINGS');
    lines.push('='.repeat(60));
    for (const j of jobs) {
      lines.push(`Title: ${j.title}`);
      lines.push(`Department: ${j.department === 'JOBS' ? 'Job' : 'Internship'}`);
      lines.push(`Location: ${j.location}`);
      lines.push(`Type: ${j.type.replace('_', ' ')}`);
      lines.push(`Description: ${j.description}`);
      if (j.requirements.length > 0) lines.push(`Requirements: ${j.requirements.join(', ')}`);
      if (j.benefits.length > 0) lines.push(`Benefits: ${j.benefits.join(', ')}`);
      lines.push('');
    }
  }

  if (initiatives.length > 0) {
    lines.push('='.repeat(60));
    lines.push('INITIATIVES');
    lines.push('='.repeat(60));
    for (const ini of initiatives) {
      lines.push(`Initiative: ${ini.title}`);
      lines.push(`Description: ${ini.description}`);
      lines.push('');
    }
  }

  if (consulting.length > 0) {
    lines.push('='.repeat(60));
    lines.push('CONSULTING SERVICES');
    lines.push('='.repeat(60));
    for (const c of consulting) {
      lines.push(`Consulting: ${c.title}`);
      lines.push(`Description: ${c.description}`);
      lines.push('');
    }
  }

  lines.push('='.repeat(60));
  lines.push('CONTACT INFORMATION');
  lines.push('='.repeat(60));
  lines.push('Email: devorbitsoftsolutions@gmail.com');
  lines.push('WhatsApp: Available on the website');
  lines.push('LinkedIn: DevOrbit company page');
  lines.push('Response Time: Within 24 hours');
  lines.push('');

  return lines.join('\n');
}

export async function writeDatabaseJson() {
  const qa = await generateDynamicQA();

  const publicDir = join(__dirname, '..', '..', 'public');
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

  const dbPath = join(publicDir, 'database.json');
  writeFileSync(dbPath, JSON.stringify(qa, null, 2), 'utf-8');

  return qa;
}
