import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding team data...');

  // ── Clear existing data in reverse dependency order ──
  await prisma.mediaItem.deleteMany();
  await prisma.customSection.deleteMany();
  await prisma.officeLocation.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.award.deleteMany();
  await prisma.teamStatistic.deleteMany();
  await prisma.advisor.deleteMany();
  await prisma.orgNode.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.teamDepartment.deleteMany();
  await prisma.leadershipMember.deleteMany();
  await prisma.founder.deleteMany();

  // ── Settings ──
  await prisma.teamPageSetting.upsert({
    where: { id: 'main' },
    create: {
      id: 'main',
      pageTitle: 'Meet Our Team | DevOrbit',
      heroHeading: 'Meet The Team',
      heroSubheading: 'The people building the future of digital experiences.',
      heroBgImage: '',
      seoTitle: 'DevOrbit Team - Meet the People Behind the Innovation',
      seoDescription: 'Get to know the talented team at DevOrbit — founders, leaders, engineers, designers, and visionaries driving digital transformation.',
      metaKeywords: 'DevOrbit team, software company team, technology leaders, digital experts',
      ogImage: '',
      showLeadership: true,
      showDepartments: true,
      showTeamMembers: true,
      showHierarchy: true,
      showTestimonials: true,
      showAwards: true,
      showLocations: true,
      showStatistics: true,
      showCustomSections: true,
    },
    update: {},
  });
  console.log('  ✓ Settings');

  // ── Founders ──
  const foundersData = [
    {
      name: 'John Anderson',
      position: 'Co-Founder & CEO',
      story: 'With over 15 years of experience in software engineering and business strategy, John founded DevOrbit to bridge the gap between innovative technology and practical business solutions. Previously led engineering teams at多家 Fortune 500 companies.',
      photo: '',
      linkedIn: 'https://linkedin.com/in/john-anderson-dev',
      twitter: 'https://twitter.com/john_devorbit',
      github: 'https://github.com/johnanderson',
      displayOrder: 0,
    },
    {
      name: 'Sarah Chen',
      position: 'Co-Founder & CTO',
      story: 'A former Google engineer with a passion for distributed systems and AI, Sarah brings deep technical expertise to DevOrbit. She has authored 12+ research papers and holds 3 patents in cloud computing.',
      photo: '',
      linkedIn: 'https://linkedin.com/in/sarah-chen-dev',
      twitter: 'https://twitter.com/sarah_devorbit',
      github: 'https://github.com/sarachen',
      displayOrder: 1,
    },
  ];
  for (const f of foundersData) {
    await prisma.founder.create({ data: f });
  }
  console.log(`  ✓ ${foundersData.length} Founders`);

  // ── Leadership ──
  const leadershipData = [
    { name: 'John Anderson', position: 'Chief Executive Officer', department: 'Executive', photo: '', bio: 'Visionary leader driving DevOrbit strategic growth and innovation.', email: 'john@devorbit.com', linkedIn: 'https://linkedin.com/in/john-anderson-dev', twitter: 'https://twitter.com/john_devorbit', github: 'https://github.com/johnanderson', displayOrder: 0, isActive: true },
    { name: 'Sarah Chen', position: 'Chief Technology Officer', department: 'Engineering', photo: '', bio: 'Leading technical vision, architecture, and R&D initiatives.', email: 'sarah@devorbit.com', linkedIn: 'https://linkedin.com/in/sarah-chen-dev', twitter: 'https://twitter.com/sarah_devorbit', github: 'https://github.com/sarachen', displayOrder: 1, isActive: true },
    { name: 'Michael Torres', position: 'Chief Operating Officer', department: 'Operations', photo: '', bio: 'Ensuring operational excellence and scalable business processes.', email: 'michael@devorbit.com', linkedIn: 'https://linkedin.com/in/michael-torres-dev', twitter: '', github: '', displayOrder: 2, isActive: true },
    { name: 'Priya Patel', position: 'Chief Marketing Officer', department: 'Marketing', photo: '', bio: 'Crafting brand stories and driving market presence globally.', email: 'priya@devorbit.com', linkedIn: 'https://linkedin.com/in/priya-patel-dev', twitter: 'https://twitter.com/priya_devorbit', github: '', displayOrder: 3, isActive: true },
    { name: 'David Kim', position: 'Chief Financial Officer', department: 'Finance', photo: '', bio: 'Managing financial strategy, planning, and investor relations.', email: 'david@devorbit.com', linkedIn: 'https://linkedin.com/in/david-kim-dev', twitter: '', github: '', displayOrder: 4, isActive: true },
    { name: 'Emily Rodriguez', position: 'VP of Engineering', department: 'Engineering', photo: '', bio: 'Leading engineering teams across multiple product verticals.', email: 'emily@devorbit.com', linkedIn: 'https://linkedin.com/in/emily-rodriguez-dev', twitter: '', github: 'https://github.com/emilyrodriguez', displayOrder: 5, isActive: true },
  ];
  for (const l of leadershipData) {
    await prisma.leadershipMember.create({ data: l });
  }
  console.log(`  ✓ ${leadershipData.length} Leadership Members`);

  // ── Departments ──
  const deptData = [
    { name: 'Engineering', description: 'Building scalable, robust software solutions using cutting-edge technologies. Our engineers specialize in full-stack development, cloud architecture, AI/ML, and mobile development.', departmentHead: 'Emily Rodriguez', image: '', displayOrder: 0, isActive: true },
    { name: 'Design', description: 'Creating intuitive, beautiful user experiences that delight customers. From UX research to visual design and prototyping, our design team sets the standard.', departmentHead: 'Aisha Malik', image: '', displayOrder: 1, isActive: true },
    { name: 'Marketing', description: 'Telling the DevOrbit story across channels and driving growth through data-driven campaigns, content strategy, and brand building.', departmentHead: 'Priya Patel', image: '', displayOrder: 2, isActive: true },
    { name: 'Sales', description: 'Building relationships and driving revenue through enterprise partnerships, channel sales, and customer success programs.', departmentHead: 'James Okafor', image: '', displayOrder: 3, isActive: true },
    { name: 'Human Resources', description: 'Nurturing DevOrbit culture, talent acquisition, employee development, and creating an inclusive workplace where everyone thrives.', departmentHead: 'Lisa Thompson', image: '', displayOrder: 4, isActive: true },
  ];
  for (const d of deptData) {
    await prisma.teamDepartment.create({ data: d });
  }
  console.log(`  ✓ ${deptData.length} Departments`);

  // ── Team Members ──
  // Fetch departments for references
  const depts = await prisma.teamDepartment.findMany();

  const engDept = depts.find(d => d.name === 'Engineering')!.id;
  const desDept = depts.find(d => d.name === 'Design')!.id;
  const mktDept = depts.find(d => d.name === 'Marketing')!.id;
  const salDept = depts.find(d => d.name === 'Sales')!.id;
  const hrDept = depts.find(d => d.name === 'Human Resources')!.id;

  const membersData = [
    { fullName: 'Aisha Malik', jobTitle: 'Lead Product Designer', departmentId: desDept, reportsToId: null, email: 'aisha@devorbit.com', phone: '+92-300-111-2233', linkedIn: 'https://linkedin.com/in/aisha-malik-dev', github: 'https://github.com/aishamalik', bio: 'Award-winning designer with 8+ years in UX/UI. Previously at Careem and McKinsey Digital.', skills: JSON.stringify(['UI/UX Design', 'Figma', 'Design Systems', 'User Research']), experience: '8 years', joinDate: '2021-03-15', location: 'Karachi, Pakistan', isActive: true, displayOrder: 0 },
    { fullName: 'James Okafor', jobTitle: 'Director of Sales', departmentId: salDept, reportsToId: null, email: 'james@devorbit.com', phone: '+234-800-555-0199', linkedIn: 'https://linkedin.com/in/james-okafor-dev', github: '', bio: 'Enterprise sales leader with a track record of exceeding targets in SaaS and enterprise software.', skills: JSON.stringify(['Enterprise Sales', 'CRM', 'Negotiation', 'Account Management']), experience: '12 years', joinDate: '2020-06-01', location: 'Lagos, Nigeria', isActive: true, displayOrder: 1 },
    { fullName: 'Lisa Thompson', jobTitle: 'HR Director', departmentId: hrDept, reportsToId: null, email: 'lisa@devorbit.com', phone: '+1-415-555-0188', linkedIn: 'https://linkedin.com/in/lisa-thompson-dev', github: '', bio: 'People-first HR leader focused on building diverse, high-performing teams.', skills: JSON.stringify(['Talent Acquisition', 'Employee Relations', 'DEI', 'Performance Management']), experience: '10 years', joinDate: '2021-01-10', location: 'San Francisco, USA', isActive: true, displayOrder: 2 },
    { fullName: 'Ryan Mitchell', jobTitle: 'Senior Full-Stack Engineer', departmentId: engDept, reportsToId: null, email: 'ryan@devorbit.com', phone: '+1-512-555-0144', linkedIn: 'https://linkedin.com/in/ryan-mitchell-dev', github: 'https://github.com/ryanmitchell', bio: 'Full-stack developer specializing in React, Node.js, and cloud-native architectures.', skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL']), experience: '7 years', joinDate: '2022-02-20', location: 'Austin, USA', isActive: true, displayOrder: 3 },
    { fullName: 'Mei Lin', jobTitle: 'AI/ML Engineer', departmentId: engDept, reportsToId: null, email: 'mei@devorbit.com', phone: '+86-21-5556-7890', linkedIn: 'https://linkedin.com/in/mei-lin-dev', github: 'https://github.com/meilin', bio: 'Machine learning engineer with expertise in NLP, computer vision, and LLM fine-tuning.', skills: JSON.stringify(['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision']), experience: '5 years', joinDate: '2023-04-10', location: 'Shanghai, China', isActive: true, displayOrder: 4 },
    { fullName: 'Ahmed Hassan', jobTitle: 'DevOps Engineer', departmentId: engDept, reportsToId: null, email: 'ahmed@devorbit.com', phone: '+971-50-123-4567', linkedIn: 'https://linkedin.com/in/ahmed-hassan-dev', github: 'https://github.com/ahmedhassan', bio: 'Cloud infrastructure expert managing multi-cloud deployments and CI/CD pipelines.', skills: JSON.stringify(['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Azure', 'CI/CD']), experience: '6 years', joinDate: '2022-08-01', location: 'Dubai, UAE', isActive: true, displayOrder: 5 },
    { fullName: 'Olivia Wright', jobTitle: 'Frontend Developer', departmentId: engDept, reportsToId: null, email: 'olivia@devorbit.com', phone: '+44-20-7946-0123', linkedIn: 'https://linkedin.com/in/olivia-wright-dev', github: 'https://github.com/oliviawright', bio: 'Frontend specialist passionate about building accessible, performant web applications.', skills: JSON.stringify(['React', 'Vue.js', 'CSS/Sass', 'Accessibility', 'Web Performance']), experience: '4 years', joinDate: '2023-01-15', location: 'London, UK', isActive: true, displayOrder: 6 },
    { fullName: 'Carlos Mendez', jobTitle: 'Backend Engineer', departmentId: engDept, reportsToId: null, email: 'carlos@devorbit.com', phone: '+55-11-99999-8888', linkedIn: 'https://linkedin.com/in/carlos-mendez-dev', github: 'https://github.com/carlosmendez', bio: 'Backend developer building high-throughput microservices and APIs.', skills: JSON.stringify(['Go', 'Python', 'gRPC', 'Redis', 'Kafka']), experience: '5 years', joinDate: '2022-11-01', location: 'São Paulo, Brazil', isActive: true, displayOrder: 7 },
    { fullName: 'Fatima Al-Rashid', jobTitle: 'Marketing Manager', departmentId: mktDept, reportsToId: null, email: 'fatima@devorbit.com', phone: '+966-55-555-6789', linkedIn: 'https://linkedin.com/in/fatima-alrashid-dev', github: '', bio: 'Digital marketing strategist driving brand awareness and lead generation across EMEA.', skills: JSON.stringify(['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media']), experience: '7 years', joinDate: '2021-09-01', location: 'Riyadh, Saudi Arabia', isActive: true, displayOrder: 8 },
    { fullName: 'Kenji Nakamura', jobTitle: 'Mobile Developer', departmentId: engDept, reportsToId: null, email: 'kenji@devorbit.com', phone: '+81-3-5555-1234', linkedIn: 'https://linkedin.com/in/kenji-nakamura-dev', github: 'https://github.com/kenjinakamura', bio: 'Mobile expert building cross-platform apps with React Native and Flutter.', skills: JSON.stringify(['React Native', 'Flutter', 'Swift', 'Kotlin', 'Firebase']), experience: '6 years', joinDate: '2022-05-20', location: 'Tokyo, Japan', isActive: true, displayOrder: 9 },
    { fullName: 'Sofia Andersen', jobTitle: 'Product Manager', departmentId: engDept, reportsToId: null, email: 'sofia@devorbit.com', phone: '+45-31-234-5678', linkedIn: 'https://linkedin.com/in/sofia-andersen-dev', github: '', bio: 'Experienced product manager bridging business goals with technical execution.', skills: JSON.stringify(['Product Strategy', 'Agile', 'User Stories', 'Data Analysis', 'A/B Testing']), experience: '8 years', joinDate: '2021-06-15', location: 'Copenhagen, Denmark', isActive: true, displayOrder: 10 },
    { fullName: 'Rajesh Kumar', jobTitle: 'QA Engineer', departmentId: engDept, reportsToId: null, email: 'rajesh@devorbit.com', phone: '+91-80-5555-4321', linkedIn: 'https://linkedin.com/in/rajesh-kumar-dev', github: 'https://github.com/rajeshkumar', bio: 'Quality assurance specialist ensuring reliable, bug-free releases through automated and manual testing.', skills: JSON.stringify(['Selenium', 'Cypress', 'Jest', 'Load Testing', 'Test Planning']), experience: '5 years', joinDate: '2023-03-01', location: 'Bengaluru, India', isActive: true, displayOrder: 11 },
  ];
  for (const m of membersData) {
    await prisma.teamMember.create({ data: m });
  }
  console.log(`  ✓ ${membersData.length} Team Members`);

  // ── Org Nodes ──
  const orgNodesData = [
    { label: 'John Anderson (CEO)', parentId: null, level: 0, displayOrder: 0 },
    { label: 'Sarah Chen (CTO)', parentId: null, level: 0, displayOrder: 1 },
    { label: 'Michael Torres (COO)', parentId: null, level: 0, displayOrder: 2 },
    { label: 'Priya Patel (CMO)', parentId: null, level: 0, displayOrder: 3 },
    { label: 'David Kim (CFO)', parentId: null, level: 0, displayOrder: 4 },
    { label: 'Emily Rodriguez (VP Eng)', parentId: null, level: 0, displayOrder: 5 },
  ];
  for (const n of orgNodesData) {
    await prisma.orgNode.create({ data: n });
  }

  // Fetch created org nodes to set up parent-child relationships
  const orgNodes = await prisma.orgNode.findMany();
  const findNode = (name: string) => orgNodes.find(n => n.label.includes(name))!;

  await prisma.orgNode.create({ data: { label: 'Engineering Lead', parentId: findNode('Emily')?.id, level: 1, displayOrder: 0 } });
  await prisma.orgNode.create({ data: { label: 'Senior Developer', parentId: findNode('Emily')?.id, level: 1, displayOrder: 1 } });
  await prisma.orgNode.create({ data: { label: 'Marketing Lead', parentId: findNode('Priya')?.id, level: 1, displayOrder: 0 } });
  await prisma.orgNode.create({ data: { label: 'Sales Lead', parentId: findNode('Michael')?.id, level: 1, displayOrder: 0 } });
  console.log('  ✓ 11 Org Nodes');

  // ── Advisors ──
  const advisorsData = [
    { name: 'Dr. Robert Liu', designation: 'Strategic Advisor', company: 'Stanford University', photo: '', bio: 'Professor of Computer Science at Stanford, advising on AI strategy and research partnerships.', linkedIn: 'https://linkedin.com/in/robert-liu-stanford', twitter: 'https://twitter.com/robertliu', displayOrder: 0 },
    { name: 'Amanda Foster', designation: 'Board Advisor', company: 'Foster Ventures', photo: '', bio: 'Serial entrepreneur and VC with 20+ years in enterprise software. Former CEO of DataStream Inc.', linkedIn: 'https://linkedin.com/in/amanda-foster-vc', twitter: '', displayOrder: 1 },
    { name: 'Hassan Al-Jaber', designation: 'Industry Advisor', company: 'Qatar Tech Fund', photo: '', bio: 'Technology investment advisor with deep expertise in Middle East markets and digital transformation.', linkedIn: 'https://linkedin.com/in/hassan-aljaber', twitter: '', displayOrder: 2 },
  ];
  for (const a of advisorsData) {
    await prisma.advisor.create({ data: a });
  }
  console.log(`  ✓ ${advisorsData.length} Advisors`);

  // ── Statistics ──
  const statsData = [
    { number: '50+', label: 'Projects Delivered', icon: 'check_circle', displayOrder: 0 },
    { number: '100+', label: 'Happy Clients', icon: 'groups', displayOrder: 1 },
    { number: '24', label: 'Team Members', icon: 'people', displayOrder: 2 },
    { number: '7', label: 'Countries', icon: 'public', displayOrder: 3 },
  ];
  for (const s of statsData) {
    await prisma.teamStatistic.create({ data: s });
  }
  console.log(`  ✓ ${statsData.length} Statistics`);

  // ── Awards ──
  const awardsData = [
    { title: 'Best Tech Startup 2025', description: 'Awarded by TechInnovate for outstanding innovation in enterprise software solutions.', date: '2025-03-15', image: '', externalLink: '', displayOrder: 0 },
    { title: 'Top Workplace Culture 2024', description: 'Recognized as one of the best places to work in the technology sector by Workplace Excellence Institute.', date: '2024-11-20', image: '', externalLink: '', displayOrder: 1 },
    { title: 'Digital Transformation Partner of the Year', description: 'Awarded by Global Enterprise Forum for exceptional digital transformation consulting services.', date: '2024-09-05', image: '', externalLink: '', displayOrder: 2 },
    { title: 'Innovation in AI/ML 2024', description: 'For groundbreaking work in natural language processing solutions for enterprise clients.', date: '2024-06-12', image: '', externalLink: '', displayOrder: 3 },
  ];
  for (const a of awardsData) {
    await prisma.award.create({ data: a });
  }
  console.log(`  ✓ ${awardsData.length} Awards`);

  // ── Testimonials ──
  const testimonialsData = [
    { name: 'Thomas Berg', position: 'CEO, NordicPay Solutions', photo: '', testimonial: 'DevOrbit transformed our payment infrastructure completely. Their team delivered ahead of schedule and the system has been rock-solid with 99.99% uptime. Truly world-class engineering.', rating: 5, displayOrder: 0 },
    { name: 'Yuki Tanaka', position: 'CTO, Horizon Robotics', photo: '', testimonial: 'Working with DevOrbit on our AI platform was exceptional. They didn\'t just build what we asked for — they brought ideas we hadn\'t considered that made the product significantly better.', rating: 5, displayOrder: 1 },
    { name: 'Maria Santos', position: 'VP Product, GreenLeaf Commerce', photo: '', testimonial: 'The DevOrbit team integrated seamlessly with ours. Their agile approach and transparent communication made the entire development process smooth and enjoyable.', rating: 4, displayOrder: 2 },
  ];
  for (const t of testimonialsData) {
    await prisma.testimonial.create({ data: t });
  }
  console.log(`  ✓ ${testimonialsData.length} Testimonials`);

  // ── Office Locations ──
  const locationsData = [
    {
      country: 'Pakistan',
      city: 'Karachi',
      officeName: 'DevOrbit Headquarters',
      address: '82-Shahrah-e-Faisal, Clifton',
      mapUrl: 'https://maps.google.com/?q=24.8615,67.0099',
      image: '',
      displayOrder: 0,
    },
    {
      country: 'Pakistan',
      city: 'Lahore',
      officeName: 'DevOrbit Innovation Lab',
      address: '45-Gulberg III, Main Boulevard',
      mapUrl: 'https://maps.google.com/?q=31.5204,74.3587',
      image: '',
      displayOrder: 1,
    },
  ];
  for (const l of locationsData) {
    await prisma.officeLocation.create({ data: l });
  }
  console.log(`  ✓ ${locationsData.length} Office Locations`);

  // ── Custom Sections ──
  await prisma.customSection.create({
    data: {
      title: 'Join Our Team',
      subtitle: 'Help us build the future of technology.',
      content: 'At DevOrbit, we are always looking for passionate, talented individuals who want to make a difference. We offer competitive compensation, remote-friendly culture, professional development opportunities, and a supportive environment where your ideas matter.\n\nIf you are excited about technology and want to work with some of the best minds in the industry, we would love to hear from you.',
      images: [],
      videos: [],
      ctaText: 'View Open Positions',
      ctaUrl: '/careers',
      displayOrder: 0,
      isActive: true,
    },
  });
  console.log('  ✓ Custom Sections');

  console.log('\n✅ Team data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
