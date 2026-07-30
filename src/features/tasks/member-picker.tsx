'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface MemberPickerProps {
  members: Array<{ user: Member }>;
  selectedId: string | null;
  onSelect: (userId: string | null) => void;
  disabled?: boolean;
}

export function MemberPicker({ members, selectedId, onSelect, disabled }: MemberPickerProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const selectedMember = members.find((m) => m.user.id === selectedId)?.user;

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">{t('tasks.assignee')}</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between glass rounded-xl px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedMember ? (
            <>
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                {selectedMember.name?.charAt(0) || '?'}
              </div>
              <span className="text-slate-800 dark:text-white truncate">{selectedMember.name || selectedMember.email}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{t('tasks.unassigned')}</span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full glass-strong rounded-xl shadow-xl border border-black/5 dark:border-white/10 py-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="h-5 w-5 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                <X className="h-3 w-3 text-slate-300 dark:text-slate-600" />
              </div>
              <span className="text-slate-500 dark:text-slate-400">{t('tasks.unassigned')}</span>
            </button>
            {members.map((m) => (
              <button
                key={m.user.id}
                type="button"
                onClick={() => { onSelect(m.user.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left ${selectedId === m.user.id ? 'bg-indigo-500/10 dark:bg-indigo-500/15' : ''}`}
              >
                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                  {m.user.name?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-white truncate">{m.user.name || t('tasks.unnamed')}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{m.user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
