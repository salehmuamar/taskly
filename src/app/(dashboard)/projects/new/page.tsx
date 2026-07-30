'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/i18n';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { apiClient } from '@/shared/lib/api-client';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
const colorNames: Record<string, string> = { '#6366f1': 'Indigo', '#8b5cf6': 'Violet', '#ec4899': 'Pink', '#ef4444': 'Red', '#f97316': 'Orange', '#eab308': 'Yellow', '#22c55e': 'Green', '#14b8a6': 'Teal', '#06b6d4': 'Cyan', '#3b82f6': 'Blue' };

export default function NewProjectPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => { document.title = `${t('projects.create')} | Taskly`; }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!form.name.trim()) { setError(t('projects.nameRequired')); return; }
    setIsLoading(true);
    try { const response = await apiClient.post<{ data: { id: string } }>('/api/projects', { name: form.name, description: form.description || undefined, color: form.color }); router.push(`/projects/${response.data.id}`); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('projects.failedToCreate')); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className="text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label={t('projects.backToProjects')}><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('projects.create')}</h1><p className="text-sm text-slate-500 dark:text-slate-300">{t('projects.subtitle_new')}</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('projects.projectDetails')}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div role="alert" className="rounded-2xl glass border-red-500/20 p-4 text-sm text-red-500 dark:text-red-400 flex items-center gap-2 animate-scale-in"><div className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />{error}</div>}
            <Input label={t('projects.name')} placeholder={t('projects.namePlaceholder')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Textarea label={t('projects.description')} rows={3} placeholder={t('projects.descriptionPlaceholder')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('projects.color')}</label>
              <div className="flex gap-2" role="radiogroup" aria-label={t('projects.colorSelect')}>
                {colors.map((c) => (
                  <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={colorNames[c] || c}
                    className={`h-8 w-8 rounded-full transition-all duration-200 ${form.color === c ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-indigo-500/30 scale-110 shadow-lg' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} onClick={() => setForm({ ...form, color: c })} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
              <Link href="/projects"><Button variant="secondary" type="button">{t('common.cancel')}</Button></Link>
              <Button type="submit" isLoading={isLoading}>{t('projects.createProject')}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
