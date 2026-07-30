'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowLeft, Clock, User, GripVertical, Trash2, Save, LayoutList, LayoutGrid, CalendarClock, Users, X, Shield, Target, GanttChart, Download, FileText } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { apiClient } from '@/shared/lib/api-client';
import { useToast } from '@/shared/ui/toast';
import { priorityDots } from '@/shared/lib/constants';
import { KanbanSkeleton } from '@/shared/ui/skeleton';
import { ListView } from '@/features/tasks/list-view';
import { TimelineView } from '@/features/tasks/timeline-view';
import { GanttView } from '@/features/tasks/gantt-view';
import { MemberPicker } from '@/features/tasks/member-picker';
import { exportTasksToCSV, exportProjectToPDF } from '@/features/export/export-utils';
import { RichEditor } from '@/shared/ui/rich-editor';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/i18n';
import type { Task, Project } from '@/shared/types';

type ViewMode = 'kanban' | 'list' | 'timeline' | 'gantt';

const columns = [
  { id: 'TODO', color: 'bg-slate-500' },
  { id: 'IN_PROGRESS', color: 'bg-blue-500' },
  { id: 'IN_REVIEW', color: 'bg-amber-500' },
  { id: 'DONE', color: 'bg-emerald-500' },
];

function DroppableColumn({ column, tasks, onOpen }: { column: { id: string; color: string; title: string }; tasks: Task[]; onOpen: (t: Task) => void }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className={`space-y-3 glass rounded-2xl p-3 transition-colors duration-200 ${isOver ? 'ring-2 ring-indigo-500/40 bg-indigo-500/5' : ''}`}>
      <div className="flex items-center gap-2 px-2 py-1">
        <div className={`h-2.5 w-2.5 rounded-full ${column.color} shadow-lg`} />
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">{column.title}</h3>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-400 glass rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy} id={column.id}>
        <div className="space-y-2 min-h-[100px]">
          {tasks.map((task) => <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />)}
          {tasks.length === 0 && <div className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isOver ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-black/5 dark:border-white/5'}`}><p className="text-xs text-slate-400 dark:text-slate-400">{t('tasks.dropHere')}</p></div>}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className={`transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 cursor-grab active:cursor-grabbing ${isDragging ? 'rotate-2 shadow-2xl' : ''}`} onClick={() => onOpen(task)}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <GripVertical className="mt-0.5 h-4 w-4 text-slate-400 dark:text-slate-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${priorityDots[task.priority] || ''}`} aria-label={t('tasks.priority') + ': ' + task.priority.toLowerCase()} />
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">{task.title}</h4>
                </div>
                {task.labels.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {task.labels.map(({ label }) => (
                      <span key={label.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: label.color + '20', color: label.color }}>{label.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.dueDate && <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-300"><Clock className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}</span>}
              {task.estimatedHours && <span className="text-[11px] text-slate-400 dark:text-slate-300 glass rounded-lg px-1.5 py-0.5">{task.estimatedHours}h</span>}
              {task.subtasks.length > 0 && <span className="text-[11px] text-slate-400 dark:text-slate-400">{task.subtasks.filter((s) => s.status === 'DONE').length}/{task.subtasks.length}</span>}
            </div>
            {task.assignee ? (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-indigo-500/25" title={task.assignee.name || ''}>{task.assignee.name?.charAt(0) || '?'}</div>
            ) : (
              <div className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center" aria-label={t('tasks.unassigned')}><User className="h-3 w-3 text-slate-300 dark:text-slate-600" /></div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <Card className="shadow-2xl border-2 border-indigo-400/50 rotate-3 opacity-90">
      <CardContent className="p-3"><div className="flex items-center gap-2"><div className={`h-2 w-2 rounded-full ${priorityDots[task.priority] || ''}`} /><h4 className="text-sm font-medium text-slate-800 dark:text-white truncate">{task.title}</h4></div></CardContent>
    </Card>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { toast } = useToast();
  const { data: session } = useSession();
  const { t } = useI18n();
  const formId = useId();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({ title: '', priority: 'MEDIUM', dueDate: '', description: '', assigneeId: '' });
  const [editForm, setEditForm] = useState({ title: '', description: '', status: '', priority: '', dueDate: '', estimatedHours: '', assigneeId: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  const [titleError, setTitleError] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string | null; email: string | null; image: string | null; role: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [isInviting, setIsInviting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchProject = useCallback(async () => {
    try { const response = await apiClient.get<{ data: Project }>(`/api/projects/${projectId}`); setProject(response.data); }
    catch { setProject(null); }
    finally { setIsLoading(false); }
  }, [projectId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchProject is stable, only runs once
  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => { if (project) document.title = `${project.name} | Taskly`; }, [project]);

  const fetchTeam = useCallback(async () => {
    try { const res = await apiClient.get<{ data: typeof teamMembers }>(`/api/projects/${projectId}/members`); setTeamMembers(res.data); }
    catch { /* ignore */ }
  }, [projectId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchTeam calls setTeamMembers internally from async fetch, not synchronous
  useEffect(() => { if (showTeamModal) fetchTeam(); }, [showTeamModal, fetchTeam]);

  const currentUserRole = project?.members?.find((m) => m.user.id === session?.user?.id)?.role ?? (project?.creator?.id === session?.user?.id ? 'OWNER' : null);
  const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';
  const canEdit = currentUserRole !== 'VIEWER' && currentUserRole !== null;

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/api/projects/${projectId}/members/${userId}`, { role: newRole });
      fetchTeam(); fetchProject(); toast(t('tasks.roleUpdated'), 'success');
    } catch { toast(t('tasks.failedToUpdateRole')); }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) { setTitleError(t('tasks.titleRequired')); return; }
    setTitleError(''); setIsCreating(true);
    try {
      await apiClient.post('/api/tasks', {
        projectId, title: newTask.title, priority: newTask.priority,
        dueDate: newTask.dueDate || undefined, description: newTask.description || undefined,
        assigneeId: newTask.assigneeId || undefined,
      });
      setNewTask({ title: '', priority: 'MEDIUM', dueDate: '', description: '', assigneeId: '' });
      setShowNewTaskModal(false); fetchProject(); toast(t('tasks.created'), 'success');
    } catch { toast(t('tasks.failedToCreate')); }
    finally { setIsCreating(false); }
  };

  const handleDragStart = (event: DragStartEvent) => { setActiveTask((project?.tasks ?? []).find((t) => t.id === event.active.id) ?? null); };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;
    if (!columns.some((c) => c.id === newStatus)) return;
    const task = (project?.tasks ?? []).find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try { await apiClient.patch(`/api/tasks/${taskId}`, { status: newStatus }); fetchProject(); }
    catch { toast(t('tasks.failedToMove')); }
  };

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditForm({
      title: task.title, description: task.description || '', status: task.status, priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      estimatedHours: task.estimatedHours?.toString() || '',
      assigneeId: task.assigneeId || '',
    });
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return; setIsSaving(true);
    try {
      await apiClient.patch(`/api/tasks/${selectedTask.id}`, {
        title: editForm.title, description: editForm.description || undefined,
        status: editForm.status, priority: editForm.priority,
        dueDate: editForm.dueDate || null, estimatedHours: editForm.estimatedHours ? parseFloat(editForm.estimatedHours) : null,
        assigneeId: editForm.assigneeId || null,
      });
      setSelectedTask(null); fetchProject(); toast(t('tasks.updated'), 'success');
    } catch { toast(t('tasks.failedToUpdate')); }
    finally { setIsSaving(false); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t('tasks.deleteConfirm'))) return;
    try { await apiClient.delete(`/api/tasks/${taskId}`); setSelectedTask(null); fetchProject(); toast(t('tasks.deleted'), 'success'); }
    catch { toast(t('tasks.failedToDelete')); }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    try { await apiClient.post(`/api/tasks/${selectedTask.id}/comments`, { content: newComment }); setNewComment(''); const response = await apiClient.get<{ data: Task }>(`/api/tasks/${selectedTask.id}`); setSelectedTask(response.data); fetchProject(); toast(t('tasks.commentAdded'), 'success'); }
    catch { toast(t('tasks.failedToAddComment')); }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await apiClient.post(`/api/projects/${projectId}/members`, { email: inviteEmail, role: inviteRole });
      setInviteEmail(''); setInviteRole('MEMBER'); fetchTeam(); toast(t('tasks.memberAdded'), 'success');
    } catch { toast(t('tasks.failedToAddMember')); }
    finally { setIsInviting(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('tasks.removeMember'))) return;
    try { await apiClient.delete(`/api/projects/${projectId}/members/${userId}`); fetchTeam(); toast(t('tasks.memberRemoved'), 'success'); }
    catch { toast(t('tasks.failedToRemoveMember')); }
  };

  if (isLoading) return <KanbanSkeleton />;
  if (!project) return <div className="text-center py-12"><p className="text-slate-500 dark:text-slate-300">{t('projects.notFound')}</p><Link href="/projects" className="mt-4 inline-block text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300">{t('projects.backToProjects')}</Link></div>;

  const tasksByStatus = columns.map((col) => ({ ...col, title: t('status.' + col.id), tasks: (project.tasks ?? []).filter((t) => t.status === col.id) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-slate-400 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label={t('projects.backToProjects')}><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg" style={{ backgroundColor: project.color }}>{project.name.charAt(0).toUpperCase()}</div>
            <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">{project.name}</h1>{project.description && <p className="text-sm text-slate-500 dark:text-slate-300">{project.description}</p>}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex glass rounded-xl p-1 gap-0.5">
            <button onClick={() => setViewMode('kanban')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}><LayoutGrid className="h-3.5 w-3.5" /> {t('tasks.kanban')}</button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}><LayoutList className="h-3.5 w-3.5" /> {t('tasks.viewList')}</button>
            <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${viewMode === 'timeline' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}><CalendarClock className="h-3.5 w-3.5" /> {t('tasks.viewTimeline')}</button>
            <button onClick={() => setViewMode('gantt')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${viewMode === 'gantt' ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}><GanttChart className="h-3.5 w-3.5" /> {t('tasks.viewGantt')}</button>
          </div>
          <Button variant="secondary" onClick={() => setShowTeamModal(true)}><Users className="mr-1.5 h-4 w-4" /> {t('tasks.team')}</Button>
          <Link href={`/projects/${projectId}/sprints`}><Button variant="secondary"><Target className="mr-1.5 h-4 w-4" /> {t('tasks.sprints')}</Button></Link>
          <Button variant="secondary" onClick={() => project && exportTasksToCSV(project.tasks ?? [], project.name)}><Download className="mr-1.5 h-4 w-4" /> {t('tasks.csv')}</Button>
          <Button variant="secondary" onClick={() => project && exportProjectToPDF({ name: project.name, description: project.description, status: project.status, tasks: project.tasks ?? [] })}><FileText className="mr-1.5 h-4 w-4" /> {t('tasks.pdf')}</Button>
          {canEdit && <Button onClick={() => setShowNewTaskModal(true)}><Plus className="mr-2 h-4 w-4" /> {t('tasks.addTask')}</Button>}
        </div>
      </div>

      {viewMode === 'kanban' && (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {tasksByStatus.map((column) => (
              <DroppableColumn key={column.id} column={column} tasks={column.tasks} onOpen={openTaskDetail} />
            ))}
          </div>
          <DragOverlay>{activeTask ? <DragOverlayCard task={activeTask} /> : null}</DragOverlay>
        </DndContext>
      )}

      {viewMode === 'list' && (
        <div className="glass rounded-2xl overflow-hidden">
          <ListView tasks={project.tasks ?? []} onTaskClick={openTaskDetail} />
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="glass rounded-2xl p-6">
          <TimelineView tasks={project.tasks ?? []} onTaskClick={openTaskDetail} />
        </div>
      )}

      {viewMode === 'gantt' && (
        <GanttView tasks={project.tasks ?? []} onTaskClick={openTaskDetail} />
      )}

      <Modal isOpen={showNewTaskModal} onClose={() => setShowNewTaskModal(false)} title={t('tasks.createTask')} size="md">
        <div className="space-y-4">
          <Input label={t('tasks.taskTitle')} placeholder={t('tasks.enterTitle')} value={newTask.title} onChange={(e) => { setNewTask({ ...newTask, title: e.target.value }); setTitleError(''); }} error={titleError} />
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.description')}</label>
            <RichEditor content="" onChange={(html) => setNewTask({ ...newTask, description: html })} placeholder={t('tasks.describeTask')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('tasks.priority')} value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}><option value="LOW">{t('priority.LOW')}</option><option value="MEDIUM">{t('priority.MEDIUM')}</option><option value="HIGH">{t('priority.HIGH')}</option><option value="URGENT">{t('priority.URGENT')}</option></Select>
            <Input label={t('tasks.dueDate')} type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
          </div>
          {project.members && project.members.length > 0 && (
            <MemberPicker members={project.members} selectedId={newTask.assigneeId} onSelect={(id) => setNewTask({ ...newTask, assigneeId: id || '' })} />
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5"><Button variant="secondary" onClick={() => setShowNewTaskModal(false)}>{t('common.cancel')}</Button><Button onClick={handleCreateTask} isLoading={isCreating}>{t('tasks.createTask')}</Button></div>
        </div>
      </Modal>

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title={canEdit ? t('tasks.taskDetails') : t('tasks.taskDetailsViewOnly')} size="lg">
        {selectedTask && (
          <div className="space-y-6">
            <Input label={t('tasks.title_label')} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} disabled={!canEdit} />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.description')}</label>
              <RichEditor content={editForm.description} onChange={(html) => setEditForm({ ...editForm, description: html })} editable={canEdit} placeholder={t('tasks.addDescription')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label={t('tasks.status')} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} disabled={!canEdit}><option value="TODO">{t('status.TODO')}</option><option value="IN_PROGRESS">{t('status.IN_PROGRESS')}</option><option value="IN_REVIEW">{t('status.IN_REVIEW')}</option><option value="DONE">{t('status.DONE')}</option><option value="CANCELLED">{t('tasks.cancelled')}</option></Select>
              <Select label={t('tasks.priority')} value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })} disabled={!canEdit}><option value="LOW">{t('priority.LOW')}</option><option value="MEDIUM">{t('priority.MEDIUM')}</option><option value="HIGH">{t('priority.HIGH')}</option><option value="URGENT">{t('priority.URGENT')}</option></Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label={t('tasks.dueDate')} type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} disabled={!canEdit} />
              <Input label={t('tasks.estimatedHours')} type="number" placeholder="0" value={editForm.estimatedHours} onChange={(e) => setEditForm({ ...editForm, estimatedHours: e.target.value })} disabled={!canEdit} />
            </div>
            {project.members && project.members.length > 0 && canEdit && (
              <MemberPicker members={project.members} selectedId={editForm.assigneeId} onSelect={(id) => setEditForm({ ...editForm, assigneeId: id || '' })} disabled={!canEdit} />
            )}
            {!canEdit && selectedTask.assignee && (
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.assignee')}</label>
                <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">{selectedTask.assignee.name?.charAt(0) || '?'}</div>
                  <span className="text-sm text-slate-800 dark:text-white">{selectedTask.assignee.name}</span>
                </div>
              </div>
            )}
            {selectedTask.dependencies?.length > 0 && (
              <div className="space-y-2"><label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.dependencies')}</label>
                <div className="space-y-1">{selectedTask.dependencies.map((dep) => (
                  <div key={dep.dependsOn.id} className="flex items-center gap-2 text-sm"><div className={`h-2 w-2 rounded-full ${dep.dependsOn.status === 'DONE' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} /><span className={dep.dependsOn.status === 'DONE' ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-800 dark:text-white'}>{dep.dependsOn.title}</span></div>
                ))}</div>
              </div>
            )}
            {selectedTask.subtasks?.length > 0 && (
              <div className="space-y-2"><label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.subtasks')}</label>
                <div className="space-y-1">{selectedTask.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 text-sm"><div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${sub.status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>{sub.status === 'DONE' && <span className="text-white text-[10px]">&#10003;</span>}</div><span className={sub.status === 'DONE' ? 'line-through text-slate-400 dark:text-slate-400' : 'text-slate-800 dark:text-white'}>{sub.title}</span></div>
                ))}</div>
              </div>
            )}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300">{t('tasks.comments')} ({selectedTask.comments?.length})</label>
              <div className="max-h-40 overflow-y-auto space-y-2">{(selectedTask.comments ?? []).map((comment) => (
                <div key={comment.id} className="glass rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300"><span className="font-semibold text-slate-800 dark:text-white">{comment.user.name}</span><span>&middot;</span><span>{new Date(comment.createdAt).toLocaleDateString()}</span></div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{comment.content}</p>
                </div>
              ))}</div>
              {canEdit && (
                <div className="flex gap-2">
                  <label htmlFor={`${formId}-comment`} className="sr-only">{t('tasks.addComment')}</label>
                  <input id={`${formId}-comment`} className="flex-1 glass rounded-xl text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" placeholder={t('tasks.addComment')} value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }} />
                  <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>{t('tasks.send')}</Button>
                </div>
              )}
            </div>
            {canEdit ? (
              <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                <Button variant="danger" size="sm" onClick={() => handleDeleteTask(selectedTask.id)}><Trash2 className="mr-1 h-4 w-4" /> {t('tasks.delete')}</Button>
                <div className="flex gap-3"><Button variant="secondary" onClick={() => setSelectedTask(null)}>{t('common.cancel')}</Button><Button onClick={handleSaveTask} isLoading={isSaving}><Save className="mr-2 h-4 w-4" /> {t('tasks.saveChanges')}</Button></div>
              </div>
            ) : (
              <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
                <Button variant="secondary" onClick={() => setSelectedTask(null)}>{t('common.close')}</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={showTeamModal} onClose={() => setShowTeamModal(false)} title={t('tasks.team')} size="md">
        <div className="space-y-5">
          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">{t('tasks.noMembers')}</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => {
                  const isOwner = member.role === 'OWNER';
                  const isSelf = member.id === session?.user?.id;
                  return (
                    <div key={member.id} className="flex items-center justify-between glass rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">
                            {member.name || t('tasks.unnamed')}
                            {isSelf && <span className="ml-1.5 text-[10px] text-indigo-400 dark:text-indigo-400">{t('tasks.you')}</span>}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && !isOwner ? (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                              className="text-[10px] font-semibold uppercase tracking-wider bg-transparent border border-black/5 dark:border-white/10 rounded-full px-2 py-0.5 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer"
                            >
                              <option value="ADMIN">{t('tasks.admin')}</option>
                              <option value="MEMBER">{t('tasks.member')}</option>
                              <option value="VIEWER">{t('tasks.viewer')}</option>
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 glass rounded-full px-2 py-0.5">{member.role}</span>
                        )}
                        {canManage && !isOwner && (
                          <button onClick={() => handleRemoveMember(member.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1" aria-label={`${t('team.remove')} ${member.name}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {canManage && (
            <div className="border-t border-black/5 dark:border-white/5 pt-4">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">{t('tasks.inviteByEmail')}</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t('workspaces.emailPlaceholder')}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInviteMember(); }}
                  className="flex-1 glass rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} label="" className="w-28">
                  <option value="ADMIN">{t('tasks.admin')}</option>
                  <option value="MEMBER">{t('tasks.member')}</option>
                  <option value="VIEWER">{t('tasks.viewer')}</option>
                </Select>
                <Button size="sm" onClick={handleInviteMember} isLoading={isInviting} disabled={!inviteEmail.trim()}>{t('team.invite')}</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
