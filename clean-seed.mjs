import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const user = await db.user.findUnique({ where: { email: 'salehmuammr30@gmail.com' } });
  if (user) {
    const { count: pm } = await db.projectMember.deleteMany({ where: { userId: user.id } });
    const { count: t } = await db.task.deleteMany({ where: { creatorId: user.id } });
    const { count: p } = await db.project.deleteMany({ where: { ownerId: user.id } });
    console.log(`Cleaned: ${pm} members, ${t} tasks, ${p} projects`);
  }
  await db.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
