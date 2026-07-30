import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string | null;
  dueDate?: string | null;
  assignee?: { name: string | null } | null;
}

interface ExportProject {
  name: string;
  description?: string | null;
  status: string;
  tasks: ExportTask[];
}

export function exportTasksToCSV(tasks: ExportTask[], projectName?: string) {
  const headers = ['Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Description'];
  const rows = tasks.map((t) => [
    t.title,
    t.status.replace('_', ' '),
    t.priority,
    t.assignee?.name || 'Unassigned',
    t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date',
    (t.description || '').replace(/<[^>]*>/g, '').slice(0, 200),
  ]);

  const csvContent = [
    `Task Report${projectName ? ` - ${projectName}` : ''}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `tasks-${projectName ? projectName.toLowerCase().replace(/\s+/g, '-') : 'export'}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportProjectToPDF(project: ExportProject) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text(project.name, 20, 20);
  doc.setFontSize(10);
  doc.text(`Status: ${project.status.replace('_', ' ')} | Generated: ${new Date().toLocaleDateString()}`, 20, 30);

  if (project.description) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    const desc = project.description.replace(/<[^>]*>/g, '');
    const lines = doc.splitTextToSize(desc, pageWidth - 40);
    doc.text(lines, 20, 52);
  }

  const startY = project.description ? 52 + (project.description.length > 100 ? 16 : 8) : 52;

  // Summary
  const statusCounts: Record<string, number> = {};
  const priorityCounts: Record<string, number> = {};
  project.tasks.forEach((t) => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  });

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.text('Summary', 20, startY);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total Tasks: ${project.tasks.length}`, 20, startY + 7);
  const statusText = Object.entries(statusCounts).map(([k, v]) => `${k.replace('_', ' ')}: ${v}`).join(' | ');
  doc.text(statusText, 20, startY + 13);
  const priorityText = Object.entries(priorityCounts).map(([k, v]) => `${k}: ${v}`).join(' | ');
  doc.text(priorityText, 20, startY + 19);

  // Tasks table
  const tableStartY = startY + 28;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(12);
  doc.text('Tasks', 20, tableStartY);

  autoTable(doc, {
    startY: tableStartY + 5,
    head: [['Title', 'Status', 'Priority', 'Assignee', 'Due Date']],
    body: project.tasks.map((t) => [
      t.title.slice(0, 50),
      t.status.replace('_', ' '),
      t.priority,
      t.assignee?.name || 'Unassigned',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-',
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 20, right: 20 },
  });

  doc.save(`${project.name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`);
}
