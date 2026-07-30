'use client';

import { useI18n } from '@/i18n';
import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiClient } from '@/shared/lib/api-client';
import { useSocket } from '@/shared/hooks/use-socket';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  project?: { id: string; name: string; color: string } | null;
  task?: { id: string; title: string } | null;
}

export function NotificationBell() {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Notification[]; unreadCount: number }>('/api/notifications?limit=20');
      setNotifications(res.data);
      setUnreadCount(res.unreadCount);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get<{ data: Notification[]; unreadCount: number }>('/api/notifications?limit=20');
        if (active) { setNotifications(res.data); setUnreadCount(res.unreadCount); }
      } catch { /* empty */ }
    })();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => { active = false; clearInterval(interval); };
  }, [fetchNotifications]);

  useSocket({
    onNotification: () => fetchNotifications(),
  });

  async function markAllRead() {
    try {
      await apiClient.patch('/api/notifications', { markAllRead: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* empty */ }
  }

  async function markRead(id: string) {
    try {
      await apiClient.patch('/api/notifications', { id });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* empty */ }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'TASK_ASSIGNED': return '📋';
      case 'COMMENT_ADDED': return '💬';
      case 'STATUS_CHANGED': return '🔄';
      default: return '🔔';
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl glass-subtle hover:glass transition-all"
        aria-label={`${t('common.notifications')}${unreadCount > 0 ? `, ${unreadCount}` : ''}`}
      >
        <Bell className="h-5 w-5 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-scale-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-y-auto rounded-2xl glass-strong border border-white/10 shadow-2xl z-50 animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-semibold text-slate-200">{t('common.notifications')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> {t('common.markAllRead')}
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {t('common.noNotifications')}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.read) markRead(n.id); }}
                    className={`w-full text-left p-4 hover:bg-white/5 transition-colors ${
                      !n.read ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0">{getIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-slate-200'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {n.project && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400">
                              {n.project.name}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-600">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {!n.read && (
                        <div className="h-2 w-2 rounded-full bg-indigo-400 shrink-0 mt-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
