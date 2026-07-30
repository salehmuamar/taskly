'use client';

import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const { t } = useI18n();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onCloseRef.current(); return; }
      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
      return;
    }
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => {
      const autofocus = contentRef.current?.querySelector<HTMLElement>('[autofocus]');
      if (autofocus) autofocus.focus(); else contentRef.current?.focus();
    });
    return () => { document.body.style.overflow = 'unset'; document.removeEventListener('keydown', handleKeyDown); };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined} aria-label={!title ? 'Dialog' : undefined}>
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`relative transform overflow-hidden rounded-3xl glass-strong shadow-2xl shadow-black/10 dark:shadow-black/30 border border-black/5 dark:border-white/10 transition-all sm:my-8 sm:w-full ${sizes[size]} animate-scale-in`}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 px-6 py-4">
              <h3 id="modal-title" className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
