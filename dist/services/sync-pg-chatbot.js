import { prisma } from '../lib/prisma.js';
const PG_CHAT_URL = process.env.PG_CHAT_URL || 'http://localhost:8010';
export { PG_CHAT_URL };
const SYNC_SOURCE = 'sync:website';
function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function dedupeByTitle(items) {
    const seen = new Set();
    return items.filter(i => {
        const key = (i.title || '').trim().toLowerCase();
        if (!key || key.length <= 1 || seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}
function generateServiceEntries(services) {
    const unique = dedupeByTitle(services);
    const entries = [];
    for (const s of unique) {
        entries.push({
            topic: s.title,
            content: `${s.description}. Contact us to learn more or get a quote.`,
            metadata: { source: SYNC_SOURCE, type: 'service', db_id: s.id },
        });
    }
    if (unique.length > 0) {
        entries.push({
            topic: 'All DevOrbit Services',
            content: `DevOrbit offers ${unique.length} services: ${unique.map(s => s.title).join(', ')}. Each service is tailored to your needs. Contact us for a free consultation.`,
            metadata: { source: SYNC_SOURCE, type: 'service' },
        });
    }
    return entries;
}
function generatePortfolioEntries(projects) {
    const unique = dedupeByTitle(projects);
    const entries = [];
    for (const p of unique) {
        entries.push({
            topic: `Portfolio: ${p.title}`,
            content: `${p.title} (${p.category} project): ${p.description}`,
            metadata: { source: SYNC_SOURCE, type: 'portfolio', db_id: p.id, category: p.category },
        });
    }
    const byCategory = new Map();
    for (const p of unique) {
        const existing = byCategory.get(p.category) || [];
        existing.push(p);
        byCategory.set(p.category, existing);
    }
    for (const [cat, items] of byCategory) {
        entries.push({
            topic: `${cat} Portfolio Projects`,
            content: `Our ${cat} portfolio includes ${items.length} projects: ${items.map(p => p.title).join(', ')}.`,
            metadata: { source: SYNC_SOURCE, type: 'portfolio', category: cat },
        });
    }
    if (byCategory.size > 0) {
        entries.push({
            topic: 'DevOrbit Portfolio Overview',
            content: `DevOrbit has delivered projects across ${byCategory.size} categories: ${[...byCategory.keys()].join(', ')}. ${[...byCategory.entries()].map(([cat, items]) => `${cat}: ${items.map(p => p.title).join(', ')}`).join('. ')}.`,
            metadata: { source: SYNC_SOURCE, type: 'portfolio' },
        });
    }
    return entries;
}
function generateJobEntries(jobs) {
    const deptLabel = (d) => d === 'JOBS' ? 'Job' : 'Internship';
    const unique = dedupeByTitle(jobs);
    const entries = [];
    for (const j of unique) {
        entries.push({
            topic: `Job: ${j.title}`,
            content: `${j.title} - ${deptLabel(j.department)} department, ${j.location} (${j.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}). ${j.description} Requirements: ${j.requirements.join(', ')}.`,
            metadata: { source: SYNC_SOURCE, type: 'job', db_id: j.id, department: j.department },
        });
    }
    const byDept = new Map();
    for (const j of unique) {
        const existing = byDept.get(j.department) || [];
        existing.push(j);
        byDept.set(j.department, existing);
    }
    for (const [dept, items] of byDept) {
        entries.push({
            topic: `${deptLabel(dept)} Job Openings`,
            content: `Current ${deptLabel(dept)} openings at DevOrbit: ${items.map(j => `${j.title} (${j.location})`).join(', ')}.`,
            metadata: { source: SYNC_SOURCE, type: 'job', department: dept },
        });
    }
    if (unique.length > 0) {
        const departments = [...byDept.keys()].map(deptLabel).join(', ');
        entries.push({
            topic: 'DevOrbit Careers & Jobs',
            content: `DevOrbit currently has ${unique.length} open positions across ${byDept.size} departments: ${departments}. Open roles: ${unique.map(j => `${j.title} - ${deptLabel(j.department)}`).join(', ')}. Apply through our website!`,
            metadata: { source: SYNC_SOURCE, type: 'job' },
        });
        entries.push({
            topic: 'Does DevOrbit Hire?',
            content: `Yes! DevOrbit is hiring! We currently have ${unique.length} open positions: ${unique.map(j => j.title).join(', ')}. Check our Careers page for details and to apply.`,
            metadata: { source: SYNC_SOURCE, type: 'job' },
        });
    }
    return entries;
}
function generateInitiativeEntries(initiatives) {
    const unique = dedupeByTitle(initiatives);
    const entries = [];
    for (const ini of unique) {
        entries.push({
            topic: `Initiative: ${ini.title}`,
            content: `${ini.title}: ${ini.description}`,
            metadata: { source: SYNC_SOURCE, type: 'initiative', db_id: ini.id },
        });
    }
    if (unique.length > 0) {
        entries.push({
            topic: 'DevOrbit Initiatives & Social Impact',
            content: `DevOrbit runs ${initiatives.length} key initiatives: ${initiatives.map(i => i.title).join(', ')}. ${initiatives.map(i => `${i.title}: ${i.description}`).join(' ')}`,
            metadata: { source: SYNC_SOURCE, type: 'initiative' },
        });
    }
    return entries;
}
function generateConsultingEntries(consulting) {
    const unique = dedupeByTitle(consulting);
    const entries = [];
    for (const c of unique) {
        entries.push({
            topic: `Consulting: ${c.title}`,
            content: `${c.title}: ${c.description}`,
            metadata: { source: SYNC_SOURCE, type: 'consulting', db_id: c.id },
        });
    }
    if (unique.length > 0) {
        entries.push({
            topic: 'DevOrbit Consulting Services',
            content: `DevOrbit offers ${consulting.length} consulting services: ${consulting.map(c => c.title).join(', ')}. ${consulting.map(c => `${c.title}: ${c.description}`).join(' ')}`,
            metadata: { source: SYNC_SOURCE, type: 'consulting' },
        });
    }
    return entries;
}
function generateSettingsEntries(settings) {
    const entries = [];
    const s = settings || {};
    const name = s.siteName || 'DevOrbit';
    const tagline = s.tagline || '';
    if (name) {
        entries.push({
            topic: `About ${name}`,
            content: `${name} is a software development company${tagline ? ` with the tagline: "${tagline}"` : ''}. We specialize in building modern digital solutions including web development, mobile apps, AI/ML, and cloud infrastructure.`,
            metadata: { source: SYNC_SOURCE, type: 'settings' },
        });
    }
    if (tagline) {
        entries.push({
            topic: 'Company Tagline',
            content: `${name}'s tagline is: "${tagline}"`,
            metadata: { source: SYNC_SOURCE, type: 'settings' },
        });
    }
    return entries;
}
function generateContactEntries() {
    return [
        {
            topic: 'Contact DevOrbit',
            content: 'You can contact DevOrbit through multiple channels: Email at devorbitsoftsolutions@gmail.com, WhatsApp chat available on the website, LinkedIn company page, or the contact form on the website. Response time is typically within 24 hours.',
            metadata: { source: SYNC_SOURCE, type: 'contact' },
        },
        {
            topic: 'DevOrbit Email',
            content: 'The official email to reach DevOrbit is devorbitsoftsolutions@gmail.com. You can expect a response within 24 hours.',
            metadata: { source: SYNC_SOURCE, type: 'contact' },
        },
        {
            topic: 'DevOrbit WhatsApp',
            content: 'You can reach DevOrbit via WhatsApp through the chat widget on their website. This is the fastest way to get a response.',
            metadata: { source: SYNC_SOURCE, type: 'contact' },
        },
        {
            topic: 'DevOrbit Location',
            content: 'DevOrbit provides remote software development services globally. They work with clients worldwide and can be reached via email or WhatsApp.',
            metadata: { source: SYNC_SOURCE, type: 'contact' },
        },
    ];
}
export async function syncAllToPgChatbot() {
    const [services, portfolio, jobs, initiatives, consulting, settings] = await Promise.all([
        prisma.service.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
        prisma.portfolio.findMany({ orderBy: { order: 'asc' } }),
        prisma.job.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
        prisma.initiative.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
        prisma.consulting.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
        prisma.siteSettings.findUnique({ where: { id: 'main' } }),
    ]);
    const allEntries = [
        ...generateServiceEntries(services),
        ...generatePortfolioEntries(portfolio),
        ...generateJobEntries(jobs),
        ...generateInitiativeEntries(initiatives),
        ...generateConsultingEntries(consulting),
        ...generateSettingsEntries(settings),
        ...generateContactEntries(),
    ];
    if (allEntries.length === 0)
        return 0;
    try {
        const url = `${PG_CHAT_URL}/ingest`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: allEntries, source: SYNC_SOURCE }),
        });
        if (!response.ok) {
            const text = await response.text();
            console.error(`[SyncPG] POST /ingest failed (${response.status}): ${text}`);
            return 0;
        }
        const result = await response.json();
        console.log(`[SyncPG] Synced ${result.ingested || 0} entries to PG chatbot`);
        return result.ingested || 0;
    }
    catch (err) {
        console.error('[SyncPG] Sync failed:', err.message);
        return 0;
    }
}
//# sourceMappingURL=sync-pg-chatbot.js.map