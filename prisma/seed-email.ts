import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'welcome',
    subject: 'Welcome to DevOrbit, {{name}}!',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #112D4E, #3F72AF); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #F9F7F7; margin: 0; font-size: 28px;">Welcome to DevOrbit</h1>
  </div>
  <div style="padding: 30px 20px; background: #F9F7F7; border: 1px solid #3F72AF; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Hi <strong>{{name}}</strong>,</p>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Welcome to DevOrbit! We're thrilled to have you on board.</p>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Your account has been created successfully. You can now access all our features and start building amazing things.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://devorbit.com/login" style="display: inline-block; padding: 12px 32px; background: #3F72AF; color: #F9F7F7; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Get Started</a>
    </div>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Best regards,<br>The DevOrbit Team</p>
  </div>
  <div style="padding: 20px; text-align: center; font-size: 12px; color: #3F72AF;">
    <p>&copy; 2025 DevOrbit Inc. All rights reserved.</p>
  </div>
</div>`,
    variables: ['name', 'email'],
  },
  {
    name: 'newsletter',
    subject: 'DevOrbit Newsletter — {{month}}',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #112D4E, #3F72AF); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #F9F7F7; margin: 0; font-size: 28px;">DevOrbit Monthly</h1>
    <p style="color: #F9F7F7; opacity: 0.9; margin-top: 8px;">{{month}}</p>
  </div>
  <div style="padding: 30px 20px; background: #F9F7F7; border: 1px solid #3F72AF; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Hi <strong>{{name}}</strong>,</p>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Here's what's happening at DevOrbit this month.</p>
    <div style="background: white; border: 1px solid #3F72AF; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="color: #112D4E; margin: 0 0 12px 0; font-size: 18px;">Latest Updates</h2>
      <p style="color: #112D4E; line-height: 1.6;">{{content}}</p>
    </div>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Best regards,<br>The DevOrbit Team</p>
  </div>
</div>`,
    variables: ['name', 'email', 'month', 'content'],
  },
  {
    name: 'certificate',
    subject: 'Your DevOrbit Certificate — {{name}}',
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #112D4E, #3F72AF); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #F9F7F7; margin: 0; font-size: 28px;">Congratulations {{name}}!</h1>
  </div>
  <div style="padding: 30px 20px; background: #F9F7F7; border: 1px solid #3F72AF; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Dear <strong>{{name}}</strong>,</p>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">We are pleased to award you this certificate for successfully completing <strong>{{course}}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 30px; border: 2px solid #3F72AF; border-radius: 12px; background: white;">
        <span style="font-size: 48px;">🏆</span>
        <p style="color: #112D4E; font-weight: bold; margin: 8px 0;">{{certificateId}}</p>
      </div>
    </div>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Your achievement has been noted and we wish you continued success in your journey.</p>
    <p style="color: #112D4E; font-size: 16px; line-height: 1.6;">Warm regards,<br>The DevOrbit Team</p>
  </div>
</div>`,
    variables: ['name', 'email', 'course', 'certificateId'],
  },
];

async function seed() {
  console.log('Seeding email templates...');

  for (const tpl of templates) {
    const existing = await prisma.emailTemplate.findUnique({ where: { name: tpl.name } });
    if (!existing) {
      await prisma.emailTemplate.create({ data: tpl });
      console.log(`  Created template: ${tpl.name}`);
    } else {
      console.log(`  Skipped (exists): ${tpl.name}`);
    }
  }

  console.log('Done.');
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
