export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  color: string;
}

export interface ProjectMember {
  user: User;
  role: string;
  joinedAt: string;
}

export interface Project extends ProjectSummary {
  description: string | null;
  status: string;
  createdAt: string;
  creator: User;
  members: ProjectMember[];
  _count: { tasks: number };
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  assigneeId: string | null;
  assignee: User | null;
  labels: Array<{ label: { id: string; name: string; color: string } }>;
  subtasks: Array<{ id: string; title: string; status: string }>;
  dependencies: Array<{ dependsOn: { id: string; title: string; status: string } }>;
  comments: Array<{
    id: string;
    content: string;
    user: { name: string };
    createdAt: string;
  }>;
  _count?: { comments: number };
  project: { id: string; name: string; color: string };
  creator?: User;
}
