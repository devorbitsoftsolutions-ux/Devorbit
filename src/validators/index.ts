import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(1000),
  detailedDescription: z.string().optional().default(''),
  imageUrl: z.string().url('Invalid image URL'),
  bannerImage: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  technologies: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  galleryImages: z.array(z.string()).optional(),
  statistics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    icon: z.string().optional(),
  })).optional(),
  projectUrl: z.string().optional().or(z.literal('')),
  clientName: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  projectDuration: z.string().optional().or(z.literal('')),
  projectType: z.string().optional().or(z.literal('')),
  completionDate: z.string().nullable().optional().or(z.literal('')),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  order: z.number().int().optional(),
});

export const serviceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  detailedDescription: z.string().optional().default(''),
  imageUrl: z.string().optional().default(''),
  features: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const jobSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  department: z.enum(['JOBS', 'INTERNSHIP']),
  location: z.string().min(1, 'Location is required'),
  type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  requirements: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  compensationType: z.string().optional(),
  whoCanApply: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const initiativeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
  link: z.string().optional().or(z.literal('')),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const consultingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(1, 'Color is required'),
  link: z.string().optional().or(z.literal('')),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const settingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional(),
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(500).optional(),
  heroBadge: z.string().max(200).optional(),
  docbotApiKey: z.string().max(500).optional(),
  chatbotApiKey: z.string().max(2000).optional(),
  chatbotBaseUrl: z.string().max(500).optional(),
  chatbotModel: z.string().max(200).optional(),
});

const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-ZÀ-ÿ\s'.-]+$/, 'Name contains invalid characters');

const phoneSchema = z.string()
  .regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format (e.g. +491234567890)');

const messageSchema = z.string()
  .min(10, 'Message must be at least 10 characters')
  .max(5000, 'Message must not exceed 5000 characters')
  .refine(val => !/<[^>]*>|javascript:|on\w+\s*=|alert\(|prompt\(|confirm\(/i.test(val), {
    message: 'Message contains potentially unsafe content',
  });

export const contactSchema = z.object({
  name: nameSchema,
  email: z.string().email('Invalid email address'),
  projectType: z.string().max(100).optional().default('General'),
  message: messageSchema,
});

export const callRequestSchema = z.object({
  name: nameSchema,
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(1000, 'Purpose must not exceed 1000 characters')
    .refine(val => !/<[^>]*>|javascript:|on\w+\s*=|alert\(|prompt\(|confirm\(/i.test(val), {
      message: 'Purpose contains potentially unsafe content',
    }),
  whatsapp: phoneSchema,
  datetime: z.string().datetime({ offset: true }).refine(val => new Date(val) > new Date(), {
    message: 'Date and time must be in the future',
  }),
});

export const subscriberSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().max(100).optional(),
  source: z.string().max(50).optional().default('WEBSITE'),
});

export const contactQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  read: z.coerce.boolean().optional(),
});

// Application form validators
export const sectionSchema = z.object({
  title: z.string().min(1, 'Section title is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const questionSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  questionText: z.string().min(1, 'Question text is required').max(1000),
  fieldName: z.string().min(1, 'Field name is required').max(100),
  fieldType: z.enum(['text', 'textarea', 'email', 'tel', 'number', 'select', 'multiselect', 'checkbox', 'radio', 'file', 'date', 'url', 'heading']),
  placeholder: z.string().max(200).optional().or(z.literal('')),
  helpText: z.string().max(500).optional().or(z.literal('')),
  required: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  options: z.array(z.string()).optional(),
  validationRules: z.object({
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    maxFileSize: z.number().optional(),
    allowedTypes: z.array(z.string()).optional(),
  }).optional(),
}).refine((data) => {
  if (['select', 'multiselect', 'radio', 'checkbox'].includes(data.fieldType)) {
    return data.options && data.options.length > 0;
  }
  return true;
}, { message: 'Options are required for select, multiselect, radio, and checkbox field types', path: ['options'] });

export const applicationSchema = z.object({
  candidateName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  answers: z.array(z.object({
    questionId: z.string().min(1, 'Question ID is required'),
    answer: z.string().optional().default(''),
  })),
});

export const applicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED']),
});

export const adminNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(2000),
});

export const footerSectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const footerLinkSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  url: z.string().min(1, 'URL is required').max(500),
  openInNewTab: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const footerSocialSchema = z.object({
  platform: z.string().min(1, 'Platform name is required').max(50),
  url: z.string().min(1, 'URL is required').max(500),
  icon: z.string().min(1, 'Icon class is required').max(100),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const footerSettingSchema = z.object({
  companyName: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  copyright: z.string().max(200).optional(),
  privacyUrl: z.string().max(500).optional(),
  termsUrl: z.string().max(500).optional(),
  bgColor: z.string().max(9).optional(),
  contactEmail: z.string().max(200).optional(),
  contactPhone: z.string().max(50).optional(),
  contactLocation: z.string().max(200).optional(),
  addressCoords: z.string().max(100).optional(),
  showSocial: z.boolean().optional(),
  showDescription: z.boolean().optional(),
  showCopyright: z.boolean().optional(),
  showLegal: z.boolean().optional(),
});

export const teamPageSettingSchema = z.object({
  pageTitle: z.string().max(200).optional(),
  heroHeading: z.string().max(200).optional(),
  heroSubheading: z.string().max(500).optional(),
  heroBgImage: z.string().max(500).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  metaKeywords: z.string().max(500).optional(),
  ogImage: z.string().max(500).optional(),
  showLeadership: z.boolean().optional(),
  showDepartments: z.boolean().optional(),
  showTeamMembers: z.boolean().optional(),
  showHierarchy: z.boolean().optional(),
  showTestimonials: z.boolean().optional(),
  showAwards: z.boolean().optional(),
  showLocations: z.boolean().optional(),
  showStatistics: z.boolean().optional(),
  showCustomSections: z.boolean().optional(),
});

export const leadershipMemberSchema = z.object({
  name: z.string().max(100),
  position: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  photo: z.string().max(2000).optional(),
  bio: z.string().max(2000).optional(),
  email: z.string().max(200).optional(),
  linkedIn: z.string().max(500).optional(),
  twitter: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const teamDepartmentSchema = z.object({
  name: z.string().max(100),
  description: z.string().max(1000).optional(),
  departmentHead: z.string().max(100).optional(),
  image: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const teamMemberSchema = z.object({
  image: z.string().max(500).optional(),
  fullName: z.string().max(100),
  jobTitle: z.string().max(100).optional(),
  departmentId: z.string().max(100).optional().nullable(),
  reportsToId: z.string().max(100).optional().nullable(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  linkedIn: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  bio: z.string().max(5000).optional(),
  skills: z.any().optional(),
  experience: z.string().max(500).optional(),
  joinDate: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().optional(),
});

export const orgNodeSchema = z.object({
  label: z.string().max(200),
  parentId: z.string().max(100).optional().nullable().transform(v => v === '' ? null : v),
  level: z.number().optional(),
  displayOrder: z.number().optional(),
});

export const founderSchema = z.object({
  name: z.string().max(100),
  position: z.string().max(100).optional(),
  story: z.string().max(5000).optional(),
  photo: z.string().max(2000).optional(),
  linkedIn: z.string().max(500).optional(),
  twitter: z.string().max(500).optional(),
  github: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
});

export const advisorSchema = z.object({
  name: z.string().max(100),
  designation: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  photo: z.string().max(2000).optional(),
  bio: z.string().max(2000).optional(),
  linkedIn: z.string().max(500).optional(),
  twitter: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
});

export const teamStatisticSchema = z.object({
  number: z.string().max(50),
  label: z.string().max(100),
  icon: z.string().max(100).optional(),
  displayOrder: z.number().optional(),
});

export const awardSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(2000).optional(),
  date: z.string().max(50).optional(),
  image: z.string().max(500).optional(),
  externalLink: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
});

export const testimonialSchema = z.object({
  name: z.string().max(100),
  position: z.string().max(100).optional(),
  photo: z.string().max(2000).optional(),
  testimonial: z.string().max(5000),
  rating: z.number().min(1).max(5).optional(),
  displayOrder: z.number().optional(),
});

export const officeLocationSchema = z.object({
  country: z.string().max(100),
  city: z.string().max(100),
  officeName: z.string().max(200).optional(),
  address: z.string().max(500).optional(),
  mapUrl: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
});

export const customSectionSchema = z.object({
  title: z.string().max(200),
  subtitle: z.string().max(500).optional(),
  content: z.string().optional(),
  images: z.any().optional(),
  videos: z.any().optional(),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(500).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const mediaItemSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  url: z.string().max(500),
  altText: z.string().max(200).optional(),
  filename: z.string().max(200).optional(),
});

export const sendMessageSchema = z.object({
  applicantIds: z.array(z.string().min(1)).min(1, 'At least one applicant required'),
  messageType: z.enum(['selection', 'approved', 'rejection', 'custom']),
  customText: z.string().max(5000).optional(),
  customSubject: z.string().max(200).optional(),
  reason: z.string().min(1, 'Reason is required').max(1000),
  recipientType: z.enum(['applicant', 'intern', 'employee']).optional().default('applicant'),
}).refine(data => data.messageType !== 'custom' || (data.customText && data.customText.trim().length > 0), {
  message: 'Custom text is required when messageType is "custom"',
  path: ['customText'],
});

export const newsSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
  active: z.boolean().optional(),
});

export const heroCardSchema = z.object({
  title: z.string().max(200).optional(),
  subtitle: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  imageType: z.enum(['url', 'upload']).optional(),
  tag: z.string().max(100).optional(),
  glowColor: z.string().max(20).optional(),
  glowOpacity: z.number().int().min(0).max(100).optional(),
  titleColor: z.string().max(20).optional(),
  titleGlowColor: z.string().max(20).optional(),
  titleGlowOpacity: z.number().int().min(0).max(100).optional(),
  subtitleColor: z.string().max(20).optional(),
  subtitleGlowColor: z.string().max(20).optional(),
  subtitleGlowOpacity: z.number().int().min(0).max(100).optional(),
  buttonText: z.string().max(100).optional().nullable(),
  buttonLink: z.string().max(500).optional().nullable(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});