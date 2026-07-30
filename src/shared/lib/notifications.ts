import { db } from '@/shared/db';
import { broadcastToUser } from '@/shared/lib/broadcast';

interface CreateNotificationParams {
  type: string;
  title: string;
  message: string;
  userId: string;
  projectId?: string;
  taskId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  const notification = await db.notification.create({
    data: {
      type: params.type,
      title: params.title,
      message: params.message,
      userId: params.userId,
      projectId: params.projectId,
      taskId: params.taskId,
    },
  });

  broadcastToUser(params.userId, 'notification', notification);
  return notification;
}

export async function notifyAssignee(
  taskId: string,
  assigneeId: string,
  creatorName: string,
  taskTitle: string,
  projectId: string,
) {
  return createNotification({
    type: 'TASK_ASSIGNED',
    title: 'Task assigned to you',
    message: `${creatorName} assigned you "${taskTitle}"`,
    userId: assigneeId,
    projectId,
    taskId,
  });
}

export async function notifyComment(
  taskId: string,
  taskOwnerId: string,
  commenterName: string,
  taskTitle: string,
  projectId: string,
  commentUserId: string,
) {
  if (taskOwnerId === commentUserId) return null;
  return createNotification({
    type: 'COMMENT_ADDED',
    title: 'New comment on task',
    message: `${commenterName} commented on "${taskTitle}"`,
    userId: taskOwnerId,
    projectId,
    taskId,
  });
}

export async function notifyStatusChange(
  taskId: string,
  assigneeId: string | null,
  changerName: string,
  taskTitle: string,
  newStatus: string,
  projectId: string,
  changerUserId: string,
) {
  if (!assigneeId || assigneeId === changerUserId) return null;
  return createNotification({
    type: 'STATUS_CHANGED',
    title: 'Task status updated',
    message: `${changerName} changed "${taskTitle}" to ${newStatus}`,
    userId: assigneeId,
    projectId,
    taskId,
  });
}
