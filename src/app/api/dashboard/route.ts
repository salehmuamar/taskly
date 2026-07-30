import { NextResponse } from 'next/server';
import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/db';
import { handleError } from '@/shared/errors';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const projectFilter = {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      recentTasks,
      tasksByStatus,
      tasksByPriority,
      completedByDayRaw,
    ] = await Promise.all([
      db.project.count({ where: projectFilter }),
      db.task.count({ where: { project: projectFilter } }),
      db.task.count({ where: { status: 'DONE', project: projectFilter } }),
      db.task.count({
        where: {
          status: { notIn: ['DONE', 'CANCELLED'] },
          dueDate: { lt: new Date() },
          project: projectFilter,
        },
      }),
      db.task.findMany({
        where: { project: projectFilter },
        include: { project: { select: { name: true, color: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
      db.task.groupBy({ by: ['status'], where: { project: projectFilter }, _count: true }),
      db.task.groupBy({ by: ['priority'], where: { project: projectFilter }, _count: true }),
      db.task.groupBy({
        by: ['completedAt'],
        where: {
          status: 'DONE',
          completedAt: { gte: sevenDaysAgo },
          project: projectFilter,
        },
        _count: true,
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of tasksByStatus) {
      statusMap[item.status] = item._count;
    }

    const priorityMap: Record<string, number> = {};
    for (const item of tasksByPriority) {
      priorityMap[item.priority] = item._count;
    }

    const completedByDay: Array<{ date: string; count: number }> = [];
    const dayCounts = new Map<string, number>();
    for (const item of completedByDayRaw) {
      if (item.completedAt) {
        const dayKey = item.completedAt.toISOString().split('T')[0];
        dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + item._count);
      }
    }

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      completedByDay.push({ date: dayLabel, count: dayCounts.get(dayKey) || 0 });
    }

    return NextResponse.json({
      data: {
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        recentTasks,
        tasksByStatus: statusMap,
        tasksByPriority: priorityMap,
        completedByDay,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' },
    });
  } catch (error) {
    const { message, statusCode } = handleError(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
