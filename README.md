# Finance Tracker 💰📱

A comprehensive personal finance management application with budget tracking, recurring expenses, income monitoring, and smart reminders. Built with React, TypeScript, Node.js, and SQLite.

![Finance Tracker](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 📊 Core Features
- **Budget Management**: Set spending limits by category with visual progress bars and alerts
- **Recurring Expenses**: Automate monthly bills and subscriptions
- **Income Tracking**: Monitor all income sources and calculate net savings
- **Cash Flow Analysis**: 6-month trend charts and savings rate calculation
- **Todo Management**: Track tasks with priorities and due dates

### 💾 Data Management
- **CSV Export**: Download expenses, income, and budgets for Excel/Google Sheets
- **Full Backup**: Complete JSON backup of all data
- **Restore**: Upload backups to restore or merge data

### 🔔 Smart Features
- **Browser Notifications**: Budget alerts, bill reminders, and todo notifications
- **Auto-Generation**: Automatically create expenses from recurring bills
- **Real-time Calculations**: Instant budget status and savings updates

### 📱 Mobile Optimized
- **Responsive Design**: Works perfectly on phones, tablets, and desktops
- **PWA Support**: Install on your phone like a native app
- **Touch-Optimized**: Large buttons and intuitive mobile navigation
- **Offline-Ready**: Fast loading and works with poor connection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd expense-tracker
```

2. **Setup Backend**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
Backend runs on `http://localhost:4000`

3. **Setup Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

4. **Access the app**
Open `http://localhost:5173` in your browser

## 🌐 Deployment

### Option 1: Vercel (Recommended - Free)

#### Deploy Backend
```bash
cd backend
npm install -g vercel
vercel
```
Follow prompts and note your backend URL (e.g., `https://your-app.vercel.app`)

#### Deploy Frontend
```bash
cd frontend
# Create .env.production with your backend URL
echo "VITE_API_URL=https://your-backend.vercel.app" > .env.production
vercel
```

### Option 2: Railway (Alternative - Free Tier)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project from GitHub repo
4. Deploy backend and frontend separately
5. Set environment variables

### Option 3: Self-Hosted (VPS)

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
# Serve the dist folder with nginx or any static server
```

## 📱 Install as Mobile App

### Android (Chrome)
1. Open the app in Chrome
2. Tap the three dots menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

### iPhone (Safari)
1. Open the app in Safari
2. Tap the Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

## 🎯 Usage Guide

### Budget Management
1. Go to **Budgets** page
2. Click "Add Budget"
3. Set category, amount, and alert threshold
4. Monitor spending with visual progress bars

### Recurring Expenses
1. Go to **Recurring** page
2. Use templates or create custom recurring bills
3. Click "Generate Due" to create expenses
4. System auto-generates on schedule

### Income Tracking
1. Go to **Income** page
2. Add income sources (salary, freelance, etc.)
3. View cash flow summary and savings rate
4. Analyze 6-month trends

### Export & Backup
1. Go to **Settings** page
2. Export data as CSV for spreadsheets
3. Download full backup (recommended monthly)
4. Restore from backup when needed

### Smart Reminders
1. Go to **Settings** page
2. Enable "Smart Reminders"
3. Allow browser notifications
4. Receive alerts for budgets, bills, and todos

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Router** - Navigation
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **SQLite** - Database
- **date-fns** - Date utilities

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── server/
│   │   │   └── app.ts        # API endpoints
│   │   ├── prisma.ts         # Prisma client
│   │   └── server.ts         # Server entry
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   ├── icon-192.png      # App icon
│   │   └── icon-512.png      # App icon
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Income.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Budgets.tsx
│   │   │   ├── RecurringExpenses.tsx
│   │   │   ├── Todos.tsx
│   │   │   └── Settings.tsx
│   │   ├── main.tsx          # App entry & routing
│   │   └── styles/
│   └── package.json
└── README.md
```

## 🔒 Data Privacy

- **Local Storage**: All data stored on your device
- **No Cloud**: No data sent to external servers
- **Backup Control**: You control your backups
- **Export Anytime**: Download your data as CSV/JSON

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for mobile-first usage
- Focused on privacy and data ownership

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Made with ❤️ for better personal finance management**