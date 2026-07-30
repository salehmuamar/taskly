import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const email = 'salehmuammr30@gmail.com';
  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    const hashed = await bcrypt.hash('Demo123!', 13);
    user = await db.user.create({
      data: { name: 'Demo User', email, password: hashed },
    });
    console.log('Created user:', user.id);
  } else {
    console.log('Found user:', user.id);
  }

  // Workspace
  let ws = await db.workspace.findFirst({ where: { ownerId: user.id } });
  if (!ws) {
    ws = await db.workspace.create({
      data: { name: 'My Workspace', slug: 'my-workspace-' + user.id.slice(0, 8), ownerId: user.id },
    });
  }

  // Projects
  const projects = [
    { name: 'Taskly App', description: 'Main product development', color: '#6366f1', status: 'ACTIVE' },
    { name: 'Marketing Site', description: 'Company website redesign', color: '#f59e0b', status: 'ACTIVE' },
    { name: 'Mobile App', description: 'React Native mobile client', color: '#10b981', status: 'PLANNING' },
    { name: 'Backend API', description: 'Core API services', color: '#3b82f6', status: 'ACTIVE' },
  ];
  const created = [];
  for (const p of projects) {
    let project = await db.project.findFirst({ where: { name: p.name, ownerId: user.id } });
    if (!project) {
      project = await db.project.create({
        data: {
          ...p, ownerId: user.id, workspaceId: ws.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      });
    }
    created.push(project);
  }

  // Tasks
  const tasks = [
    { title: 'Set up CI/CD pipeline', status: 'DONE', priority: 'HIGH', projectIdx: 0, dueOffset: -3 },
    { title: 'Design user dashboard', status: 'DONE', priority: 'URGENT', projectIdx: 0, dueOffset: -5 },
    { title: 'Implement authentication', status: 'IN_PROGRESS', priority: 'URGENT', projectIdx: 0, dueOffset: 2 },
    { title: 'Create project API endpoints', status: 'IN_PROGRESS', priority: 'HIGH', projectIdx: 0, dueOffset: 5 },
    { title: 'Build task management UI', status: 'TODO', priority: 'HIGH', projectIdx: 0, dueOffset: 7 },
    { title: 'Add real-time notifications', status: 'TODO', priority: 'MEDIUM', projectIdx: 0, dueOffset: 14 },
    { title: 'Write unit tests', status: 'TODO', priority: 'MEDIUM', projectIdx: 0, dueOffset: 10 },
    { title: 'Performance optimization', status: 'TODO', priority: 'LOW', projectIdx: 0, dueOffset: 21 },
    { title: 'Homepage hero section', status: 'DONE', priority: 'HIGH', projectIdx: 1, dueOffset: -2 },
    { title: 'Pricing page', status: 'DONE', priority: 'MEDIUM', projectIdx: 1, dueOffset: -1 },
    { title: 'Case studies section', status: 'IN_REVIEW', priority: 'MEDIUM', projectIdx: 1, dueOffset: 3 },
    { title: 'Blog page template', status: 'TODO', priority: 'LOW', projectIdx: 1, dueOffset: 8 },
    { title: 'Design system for mobile', status: 'IN_PROGRESS', priority: 'HIGH', projectIdx: 2, dueOffset: 6 },
    { title: 'Navigation architecture', status: 'TODO', priority: 'MEDIUM', projectIdx: 2, dueOffset: 12 },
    { title: 'Offline support', status: 'TODO', priority: 'LOW', projectIdx: 2, dueOffset: 30 },
    { title: 'Rate limiting middleware', status: 'IN_REVIEW', priority: 'URGENT', projectIdx: 3, dueOffset: 1 },
    { title: 'Database migrations', status: 'DONE', priority: 'HIGH', projectIdx: 3, dueOffset: -4 },
    { title: 'Webhook system', status: 'TODO', priority: 'MEDIUM', projectIdx: 3, dueOffset: 9 },
    { title: 'API documentation', status: 'IN_PROGRESS', priority: 'LOW', projectIdx: 3, dueOffset: 15 },
    { title: 'Error monitoring setup', status: 'DONE', priority: 'HIGH', projectIdx: 3, dueOffset: -6 },
  ];

  let count = 0;
  for (const t of tasks) {
    const exists = await db.task.findFirst({ where: { title: t.title, projectId: created[t.projectIdx].id } });
    if (exists) continue;
    const due = new Date();
    due.setDate(due.getDate() + t.dueOffset);
    const completed = t.status === 'DONE' ? new Date(Date.now() - Math.random() * 86400000 * 6) : null;
    await db.task.create({
      data: {
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: due,
        completedAt: completed,
        projectId: created[t.projectIdx].id,
        creatorId: user.id,
        assigneeId: user.id,
        estimatedHours: Math.floor(Math.random() * 16) + 2,
      },
    });
    count++;
  }
  console.log(`Created ${count} tasks`);
  console.log('Seed complete!');
}

main().catch(console.error).finally(() => db.$disconnect());
