'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, UserPlus, Users, Gift, Megaphone, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStore } from '@/stores/useStore';
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
  type AppNotification,
} from '@/hooks/useNotifications';

function timeAgo(iso: string, t: (k: string, v?: Record<string, number>) => string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return t('justNow');
  if (mins < 60) return t('minutesAgo', { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('hoursAgo', { hours });
  const days = Math.floor(hours / 24);
  return t('daysAgo', { days });
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  friend_request:  <UserPlus size={15} className="text-[#fc88c6]" />,
  friend_accepted: <Users    size={15} className="text-emerald-400" />,
  card_received:   <Gift     size={15} className="text-amber-400" />,
  app_news:        <Megaphone size={15} className="text-blue-400" />,
  system:          <Info     size={15} className="text-slate-400" />,
};

function NotifItem({
  notif,
  onRead,
  onDelete,
  t,
}: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  t: (k: string, v?: Record<string, number>) => string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-3 items-start px-4 py-3 border-b border-white/8 last:border-none transition-colors ${
        notif.read
          ? 'opacity-60'
          : 'bg-white/8 dark:bg-white/5'
      }`}
    >
      <div className="mt-0.5 shrink-0">{TYPE_ICON[notif.type] ?? TYPE_ICON.system}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-1">{notif.title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(notif.createdAt, t)}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
        {!notif.read && (
          <button
            onClick={() => onRead(notif._id)}
            aria-label="Mark as read"
            className="p-1 rounded-lg hover:bg-white/20 text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <Check size={12} />
          </button>
        )}
        <button
          onClick={() => onDelete(notif._id)}
          aria-label="Delete notification"
          className="p-1 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bellRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { userId } = useStore();
  const t = useTranslations('notifications');

  const { data } = useNotifications(userId);
  const markRead    = useMarkNotificationsRead();
  const deleteNotif = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const unreadCount   = data?.unreadCount   ?? 0;

  useEffect(() => { setMounted(true); }, []);

  // Close when clicking outside both the bell and the panel
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        bellRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleMarkAll() {
    if (!userId) return;
    markRead.mutate({ userId });
  }
  function handleMarkOne(notificationId: string) {
    if (!userId) return;
    markRead.mutate({ userId, notificationId });
  }
  function handleDelete(notificationId: string) {
    if (!userId) return;
    deleteNotif.mutate({ userId, notificationId });
  }

  if (!userId) return null;

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          key="notif-panel"
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="
            fixed z-[9999] top-16
            left-4 right-4 mx-auto max-w-sm
            md:left-auto md:right-4 md:w-80 md:max-w-none
            max-h-[440px] flex flex-col
            rounded-3xl overflow-hidden
            bg-white/60 dark:bg-slate-900/70
            backdrop-blur-2xl
            border border-white/40 dark:border-white/10
            shadow-[0_8px_40px_rgba(0,0,0,0.15),0_2px_8px_rgba(252,136,198,0.1)]
            dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
          "
        >
          {/* Glass reflection strip */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/5 to-transparent pointer-events-none rounded-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <Bell size={13} className="text-[#fc88c6]" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{t('title')}</span>
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold bg-[#fc88c6] text-white flex items-center justify-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-[11px] text-[#d4509a] dark:text-[#fc88c6] hover:opacity-70 transition-opacity font-medium"
                >
                  {t('markAllRead')}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-xl hover:bg-white/20 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="relative overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                <Bell size={28} className="mx-auto mb-3 opacity-30" />
                {t('empty')}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <NotifItem key={n._id} notif={n} onRead={handleMarkOne} onDelete={handleDelete} t={t} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-all border border-white/10 dark:border-white/5"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold bg-[#fc88c6] text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {mounted && createPortal(panel, document.body)}
    </div>
  );
}

