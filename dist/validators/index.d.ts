import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
export declare const portfolioSchema: z.ZodObject<{
    title: z.ZodString;
    category: z.ZodString;
    description: z.ZodString;
    detailedDescription: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodString;
    bannerImage: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString>>;
    features: z.ZodOptional<z.ZodArray<z.ZodString>>;
    galleryImages: z.ZodOptional<z.ZodArray<z.ZodString>>;
    statistics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodString;
        icon: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    projectUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    clientName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    industry: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    projectDuration: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    projectType: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    completionDate: z.ZodUnion<[z.ZodOptional<z.ZodNullable<z.ZodString>>, z.ZodLiteral<"">]>;
    active: z.ZodOptional<z.ZodBoolean>;
    featured: z.ZodOptional<z.ZodBoolean>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const serviceSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    detailedDescription: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    features: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    technologies: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    icon: z.ZodString;
    color: z.ZodString;
    order: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const jobSchema: z.ZodObject<{
    title: z.ZodString;
    department: z.ZodEnum<{
        JOBS: "JOBS";
        INTERNSHIP: "INTERNSHIP";
    }>;
    location: z.ZodString;
    type: z.ZodString;
    description: z.ZodString;
    requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString>>;
    imageUrl: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    compensationType: z.ZodOptional<z.ZodString>;
    whoCanApply: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const initiativeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    color: z.ZodString;
    link: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    order: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const consultingSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    icon: z.ZodString;
    color: z.ZodString;
    link: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    order: z.ZodOptional<z.ZodNumber>;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const settingsSchema: z.ZodObject<{
    siteName: z.ZodOptional<z.ZodString>;
    tagline: z.ZodOptional<z.ZodString>;
    heroTitle: z.ZodOptional<z.ZodString>;
    heroSubtitle: z.ZodOptional<z.ZodString>;
    heroBadge: z.ZodOptional<z.ZodString>;
    docbotApiKey: z.ZodOptional<z.ZodString>;
    chatbotApiKey: z.ZodOptional<z.ZodString>;
    chatbotBaseUrl: z.ZodOptional<z.ZodString>;
    chatbotModel: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const contactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    projectType: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    message: z.ZodString;
}, z.core.$strip>;
export declare const callRequestSchema: z.ZodObject<{
    name: z.ZodString;
    purpose: z.ZodString;
    whatsapp: z.ZodString;
    datetime: z.ZodString;
}, z.core.$strip>;
export declare const subscriberSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const contactQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    read: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
}, z.core.$strip>;
export declare const sectionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const questionSchema: z.ZodObject<{
    sectionId: z.ZodString;
    questionText: z.ZodString;
    fieldName: z.ZodString;
    fieldType: z.ZodEnum<{
        number: "number";
        select: "select";
        email: "email";
        url: "url";
        date: "date";
        file: "file";
        text: "text";
        textarea: "textarea";
        tel: "tel";
        multiselect: "multiselect";
        checkbox: "checkbox";
        radio: "radio";
        heading: "heading";
    }>;
    placeholder: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    helpText: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    required: z.ZodOptional<z.ZodBoolean>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    options: z.ZodOptional<z.ZodArray<z.ZodString>>;
    validationRules: z.ZodOptional<z.ZodObject<{
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        pattern: z.ZodOptional<z.ZodString>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        maxFileSize: z.ZodOptional<z.ZodNumber>;
        allowedTypes: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const applicationSchema: z.ZodObject<{
    candidateName: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    answers: z.ZodArray<z.ZodObject<{
        questionId: z.ZodString;
        answer: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const applicationStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        PENDING: "PENDING";
        REVIEWING: "REVIEWING";
        ACCEPTED: "ACCEPTED";
        REJECTED: "REJECTED";
    }>;
}, z.core.$strip>;
export declare const adminNoteSchema: z.ZodObject<{
    content: z.ZodString;
}, z.core.$strip>;
export declare const footerSectionSchema: z.ZodObject<{
    title: z.ZodString;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const footerLinkSchema: z.ZodObject<{
    sectionId: z.ZodString;
    title: z.ZodString;
    url: z.ZodString;
    openInNewTab: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const footerSocialSchema: z.ZodObject<{
    platform: z.ZodString;
    url: z.ZodString;
    icon: z.ZodString;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const footerSettingSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    copyright: z.ZodOptional<z.ZodString>;
    privacyUrl: z.ZodOptional<z.ZodString>;
    termsUrl: z.ZodOptional<z.ZodString>;
    bgColor: z.ZodOptional<z.ZodString>;
    contactEmail: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodOptional<z.ZodString>;
    contactLocation: z.ZodOptional<z.ZodString>;
    addressCoords: z.ZodOptional<z.ZodString>;
    showSocial: z.ZodOptional<z.ZodBoolean>;
    showDescription: z.ZodOptional<z.ZodBoolean>;
    showCopyright: z.ZodOptional<z.ZodBoolean>;
    showLegal: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const teamPageSettingSchema: z.ZodObject<{
    pageTitle: z.ZodOptional<z.ZodString>;
    heroHeading: z.ZodOptional<z.ZodString>;
    heroSubheading: z.ZodOptional<z.ZodString>;
    heroBgImage: z.ZodOptional<z.ZodString>;
    seoTitle: z.ZodOptional<z.ZodString>;
    seoDescription: z.ZodOptional<z.ZodString>;
    metaKeywords: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
    showLeadership: z.ZodOptional<z.ZodBoolean>;
    showDepartments: z.ZodOptional<z.ZodBoolean>;
    showTeamMembers: z.ZodOptional<z.ZodBoolean>;
    showHierarchy: z.ZodOptional<z.ZodBoolean>;
    showTestimonials: z.ZodOptional<z.ZodBoolean>;
    showAwards: z.ZodOptional<z.ZodBoolean>;
    showLocations: z.ZodOptional<z.ZodBoolean>;
    showStatistics: z.ZodOptional<z.ZodBoolean>;
    showCustomSections: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const leadershipMemberSchema: z.ZodObject<{
    name: z.ZodString;
    position: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    photo: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    linkedIn: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const teamDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    departmentHead: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const teamMemberSchema: z.ZodObject<{
    image: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
    jobTitle: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reportsToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    linkedIn: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    skills: z.ZodOptional<z.ZodAny>;
    experience: z.ZodOptional<z.ZodString>;
    joinDate: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const orgNodeSchema: z.ZodObject<{
    label: z.ZodString;
    parentId: z.ZodPipe<z.ZodNullable<z.ZodOptional<z.ZodString>>, z.ZodTransform<string | null | undefined, string | null | undefined>>;
    level: z.ZodOptional<z.ZodNumber>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const founderSchema: z.ZodObject<{
    name: z.ZodString;
    position: z.ZodOptional<z.ZodString>;
    story: z.ZodOptional<z.ZodString>;
    photo: z.ZodOptional<z.ZodString>;
    linkedIn: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    github: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const advisorSchema: z.ZodObject<{
    name: z.ZodString;
    designation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    photo: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    linkedIn: z.ZodOptional<z.ZodString>;
    twitter: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const teamStatisticSchema: z.ZodObject<{
    number: z.ZodString;
    label: z.ZodString;
    icon: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const awardSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    externalLink: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const testimonialSchema: z.ZodObject<{
    name: z.ZodString;
    position: z.ZodOptional<z.ZodString>;
    photo: z.ZodOptional<z.ZodString>;
    testimonial: z.ZodString;
    rating: z.ZodOptional<z.ZodNumber>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const officeLocationSchema: z.ZodObject<{
    country: z.ZodString;
    city: z.ZodString;
    officeName: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    mapUrl: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const customSectionSchema: z.ZodObject<{
    title: z.ZodString;
    subtitle: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodAny>;
    videos: z.ZodOptional<z.ZodAny>;
    ctaText: z.ZodOptional<z.ZodString>;
    ctaUrl: z.ZodOptional<z.ZodString>;
    displayOrder: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const mediaItemSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<{
        IMAGE: "IMAGE";
        VIDEO: "VIDEO";
        DOCUMENT: "DOCUMENT";
    }>>;
    url: z.ZodString;
    altText: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const sendMessageSchema: z.ZodObject<{
    applicantIds: z.ZodArray<z.ZodString>;
    messageType: z.ZodEnum<{
        custom: "custom";
        selection: "selection";
        approved: "approved";
        rejection: "rejection";
    }>;
    customText: z.ZodOptional<z.ZodString>;
    customSubject: z.ZodOptional<z.ZodString>;
    reason: z.ZodString;
    recipientType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        applicant: "applicant";
        intern: "intern";
        employee: "employee";
    }>>>;
}, z.core.$strip>;
export declare const newsSchema: z.ZodObject<{
    title: z.ZodString;
    content: z.ZodString;
    active: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const heroCardSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    subtitle: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    imageType: z.ZodOptional<z.ZodEnum<{
        url: "url";
        upload: "upload";
    }>>;
    tag: z.ZodOptional<z.ZodString>;
    glowColor: z.ZodOptional<z.ZodString>;
    glowOpacity: z.ZodOptional<z.ZodNumber>;
    titleColor: z.ZodOptional<z.ZodString>;
    titleGlowColor: z.ZodOptional<z.ZodString>;
    titleGlowOpacity: z.ZodOptional<z.ZodNumber>;
    subtitleColor: z.ZodOptional<z.ZodString>;
    subtitleGlowColor: z.ZodOptional<z.ZodString>;
    subtitleGlowOpacity: z.ZodOptional<z.ZodNumber>;
    buttonText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    buttonLink: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    order: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map