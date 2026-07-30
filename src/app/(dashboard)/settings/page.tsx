'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Shield, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { apiClient } from '@/shared/lib/api-client';
import { useI18n } from '@/i18n';
import { useToast } from '@/shared/ui/toast';

export default function SettingsPage() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const { toast } = useToast();
  useEffect(() => { document.title = t('settings.title') + ' | Taskly'; }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- session data sync on mount */
  useEffect(() => {
    if (session?.user) { setName(session.user.name || ''); setEmail(session.user.email || ''); }
  }, [session]);

  const handleSaveProfile = async () => {
    setIsSavingProfile(true); setProfileSaved(false);
    try { await apiClient.patch('/api/settings/profile', { name }); setProfileSaved(true); toast(t('settings.profileSaved'), 'success'); setTimeout(() => setProfileSaved(false), 3000); }
    catch { toast(t('settings.failedToSave')); }
    finally { setIsSavingProfile(false); }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">{t('settings.subtitle')}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-1.5 shadow-lg shadow-indigo-500/25"><User className="h-4 w-4 text-white" /></div> {t('settings.profile')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input label={t('auth.name')} value={name} onChange={(e) => setName(e.target.value)} />
            <Input label={t('auth.email')} value={email} disabled />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} isLoading={isSavingProfile}><Save className="mr-2 h-4 w-4" /> {profileSaved ? t('settings.saved') : t('settings.saveProfile')}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-1.5 shadow-lg shadow-emerald-500/25"><Shield className="h-4 w-4 text-white" /></div> {t('settings.security')}</CardTitle></CardHeader>
        <CardContent>
          <div className="glass rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('settings.password')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{t('settings.passwordNote')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
