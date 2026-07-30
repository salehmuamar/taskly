'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useI18n } from '@/i18n';

interface FileUploadProps {
  taskId?: string;
  projectId: string;
  onUploaded?: (attachment: unknown) => void;
}

function getIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({ taskId, projectId, onUploaded }: FileUploadProps) {
  const { t } = useI18n();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      if (taskId) formData.append('taskId', taskId);

      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onUploaded?.(data.data);
    } catch {
      console.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = '';
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        dragOver
          ? 'border-indigo-400 bg-indigo-500/10'
          : 'border-white/10 dark:border-white/10 hover:border-white/20'
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        accept="image/*,application/pdf,.txt,.md,.zip,.doc,.docx,.xls,.xlsx"
      />
      <Upload className="mx-auto h-6 w-6 text-slate-400 mb-2" />
      <p className="text-sm text-slate-400">
        {isUploading ? t('tasks.uploading') : t('tasks.dropFile')}
      </p>
      <p className="text-xs text-slate-500 mt-1">{t('tasks.maxFileSize')}</p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
      >
        {t('tasks.chooseFile')}
      </Button>
    </div>
  );
}

export function AttachmentList({
  attachments,
  onDelete,
}: {
  attachments: Array<{
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    user: { name: string | null };
  }>;
  onDelete?: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-3 rounded-xl glass p-3 group"
        >
          <div className="text-slate-400">{getIcon(att.mimeType)}</div>
          <div className="flex-1 min-w-0">
            <a
              href={`/uploads/${att.filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-slate-200 dark:text-slate-200 hover:text-indigo-400 truncate block"
            >
              {att.originalName}
            </a>
            <p className="text-xs text-slate-500">
              {formatSize(att.size)} · {att.user.name}
            </p>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(att.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
              aria-label={t('tasks.deleteAttachment')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
