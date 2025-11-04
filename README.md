# Expense & Todo Tracker — MVP

This repository contains a small single-user MVP for tracking daily expenses and todos.

## Stack

- **Backend**: Node.js + Express + TypeScript + Prisma + SQLite
- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Persistence**: SQLite via Prisma (development database file located at `backend/dev.db`)

## Quick Start

### Backend Setup

1. **Navigate to the backend directory**:

   ```powershell
   cd d:/Finance/expense-tracker/backend
   ```
2. **Install dependencies**:

   ```powershell
   npm install
   ```
3. **Generate Prisma client and apply migrations** (first run):

   ```powershell
   npx prisma generate
   npx prisma migrate dev --name init
   ```
4. **Start the development server**:

   ```powershell
   npm run dev
   ```
5. **Access the backend**:

   Open [http://localhost:4000](http://localhost:4000) in your browser.

### Frontend Setup

1. **Navigate to the frontend directory**:

   ```powershell
   cd d:/Finance/expense-tracker/frontend
   ```
2. **Install dependencies**:

   ```powershell
   npm install
   ```
3. **Start the development server**:

   ```powershell
   npm run dev
   ```
4. **Access the frontend**:

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Notes & Next Steps

- This project provides a minimal scaffold to get an end-to-end experience quickly.
- The backend uses SQLite for persistence, managed via Prisma.
- The frontend is built with React and styled using Tailwind CSS.
- Future improvements could include:
  - Adding authentication and multi-user support
  - Implementing CSV import/export, recurring transactions, tagging, and reports
  - Enhancing the UI/UX with additional features

If you'd like to proceed with any specific improvements or need further assistance, feel free to reach out!