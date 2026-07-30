<div align="center">

# Taskly

**Smart Task Management Platform**

A full-stack, production-ready project management application built with Next.js 16, TypeScript, and modern web technologies. Features real-time collaboration, Kanban boards, Gantt charts, sprint planning, and enterprise-grade security.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

## Screenshots

![](/screenshot/auth.png) | ![](/screenshot/dashboard-overview.png) | ![](/screenshot/project-tasks.png)
:---: | :---: | :---:
**Auth / Login** | **Dashboard** | **Project Tasks**

![](/screenshot/calendar.png) | ![](/screenshot/dashboard-light.png)
:---: | :---:
**Calendar** | **Dashboard (Light Mode)**

---

## Features

- **Kanban Board** — Drag-and-drop task management with customizable columns (TODO, IN_PROGRESS, IN_REVIEW, DONE)
- **List View** — Table-based task view with sorting, filtering, and priority badges
- **Gantt Chart** — Interactive Gantt chart with task dependencies and drag-to-reschedule
- **Calendar View** — Full month calendar grid showing tasks by due date
- **Sprint Planning** — Create and manage sprints with start/end dates, track sprint progress
- **Real-time Updates** — Socket.io-powered live synchronization across all connected clients
- **Multi-Workspace Support** — Organize projects into isolated workspaces with role-based access
- **Rich Text Editor** — Tiptap-powered editor with formatting, task lists, and code blocks
- **File Attachments** — Upload files up to 10MB with drag-and-drop support
- **Dark/Light Theme** — System-aware theming with glass design system
- **i18n Support** — Arabic and English localization
- **Dashboard** — Overview with task distribution charts, completion rates, and project stats
- **CSV/PDF Export** — Generate professional reports

---

## Architecture

```
taskly/
├── prisma/                    # Database schema + migrations + seed
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, register pages
│   │   ├── (dashboard)/       # Dashboard, projects, tasks, calendar, workspaces, settings
│   │   └── api/               # REST API routes (Next.js App Router)
│   ├── features/              # Business logic (projects, tasks, sprints, workspaces, export)
│   ├── shared/                # DB client, UI components, hooks, types, lib
│   └── __tests__/             # Unit tests
├── e2e/                       # Playwright E2E tests
├── server.ts                  # Custom Next.js + Socket.io server
├── docker-compose.yml
└── Dockerfile
```

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API routes, Prisma ORM
- **Real-time**: Socket.io 4
- **Database**: SQLite (dev) / PostgreSQL (prod)

---

## Prerequisites

- Node.js 20+
- npm

---

## Configuration

Main settings are in `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT signing |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |

---

## Local Development

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment**

   ```bash
   cp .env.example .env
   ```

3. **Generate Prisma client & push schema**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Seed the database (optional)**

   ```bash
   npx tsx prisma/seed.mjs
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Account

- **Email:** `salehmuammr30@gmail.com`
- **Password:** `Demo123!`

---

## Building for Production

```bash
npm run build
npm start
```

The build outputs to `.next/`. Deploy to any Node.js hosting (Vercel, Docker, etc.).

---

## Database & Migrations

- Schema lives in `prisma/schema.prisma`
- Migrations are in `prisma/migrations/`
- Default: SQLite (dev), PostgreSQL (prod)
- Run migrations: `npx prisma migrate deploy`
- Seed logic: `prisma/seed.mjs`

---

## Real-time Notifications

- Socket.io server runs alongside Next.js on port 3000
- Client connects via `useSocket` hook
- Real-time events: task created, updated, deleted, status changed, comments added

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST | `/api/tasks` | List / Create tasks |
| GET/PATCH/DELETE | `/api/tasks/[id]` | Get / Update / Delete task |
| GET | `/api/tasks/my` | Current user's assigned tasks |
| GET/POST | `/api/projects` | List / Create projects |
| GET/PATCH/DELETE | `/api/projects/[id]` | Get / Update / Delete project |
| GET/POST | `/api/projects/[id]/members` | List / Add members |
| GET/POST | `/api/projects/[id]/sprints` | List / Create sprints |
| GET/POST | `/api/workspaces` | List / Create workspaces |
| GET/POST | `/api/attachments` | Upload file |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/settings/profile` | Update profile |

Full API docs available at each endpoint (Swagger-style via Next.js API routes).

---

## Testing

```bash
npm run test:run      # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
npm test              # All tests
```

---

## Deployment

### Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy

### Docker

```bash
docker-compose up -d
```

---

## License

This project is licensed under the MIT License.
