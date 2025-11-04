Expense & Todo Tracker — MVP

This repository contains a small single-user MVP for tracking daily expenses and todos.

Stack (MVP):
 Backend: Node.js + Express + TypeScript + Prisma + SQLite
- Frontend: Vite + React + TypeScript + Tailwind (see `frontend/`)
- Persistence: SQLite via Prisma (dev DB file `backend/dev.db`)

Quick start (Windows PowerShell):

1. Open a terminal and go to the backend folder:

```powershell
cd d:/FInance/expense-tracker/backend
```

2. Install dependencies:

```powershell
npm install
# generate prisma client and apply migrations (first run)
npx prisma generate
npx prisma migrate dev --name init
```

3. Start dev server:

```powershell
npm run dev
```

4. Open http://localhost:4000 in a browser.

Notes & next steps:
- This is a minimal scaffold to get an end-to-end experience quickly. It uses a JSON file for persistence so you can run the app without installing a database.
- Next improvements I can implement on request:
  - Replace local JSON with SQLite + Prisma
  - Create a React + TypeScript frontend (Vite + Tailwind)
  - Add authentication and multi-user support
  - Add CSV import/export, recurring transactions, tagging and reports

If you'd like me to proceed with switching to the full stack (Prisma + React+TS), say so and I'll migrate the scaffold and add tests and CI.
