# Deployment Guide 🚀

This guide will help you deploy your Finance Tracker to the internet so you can access it from anywhere.

## 🎯 Recommended: Vercel (Free & Easy)

Vercel is the easiest and fastest way to deploy this app. It's free for personal projects!

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com) - free)

### Step-by-Step Deployment

#### 1. Push to GitHub

```bash
cd /home/user/omkar/expense-tracker

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Finance Tracker v1.0"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M main
git push -u origin main
```

#### 2. Deploy Backend to Vercel

```bash
cd backend

# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? finance-tracker-backend
# - Directory? ./
# - Override settings? N

# After deployment, note your backend URL
# Example: https://finance-tracker-backend.vercel.app
```

#### 3. Deploy Frontend to Vercel

```bash
cd ../frontend

# Create production environment file
echo "VITE_API_URL=https://YOUR-BACKEND-URL.vercel.app" > .env.production

# Replace YOUR-BACKEND-URL with your actual backend URL from step 2

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? finance-tracker
# - Directory? ./
# - Override settings? N
```

#### 4. Configure Vercel Projects

Go to [vercel.com/dashboard](https://vercel.com/dashboard)

**For Backend:**
1. Select your backend project
2. Go to Settings → Environment Variables
3. Add: `DATABASE_URL` = `file:./dev.db`
4. Redeploy

**For Frontend:**
1. Select your frontend project
2. Go to Settings → Environment Variables
3. Add: `VITE_API_URL` = `https://your-backend.vercel.app`
4. Redeploy

#### 5. Access Your App! 🎉

Your app is now live at: `https://finance-tracker.vercel.app`

---

## 🔄 Alternative: Railway (Also Free)

Railway offers a generous free tier and is great for full-stack apps.

### Step-by-Step

1. **Push to GitHub** (same as above)

2. **Sign up at [railway.app](https://railway.app)**

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your finance-tracker repository

4. **Deploy Backend**
   - Railway will auto-detect Node.js
   - Add environment variable: `DATABASE_URL=file:./dev.db`
   - Set start command: `npm run build && npm start`
   - Note your backend URL

5. **Deploy Frontend**
   - Create another service in the same project
   - Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
   - Set build command: `npm run build`
   - Set start command: `npx serve -s dist`

6. **Access your app** at the Railway-provided URL

---

## 🖥️ Self-Hosting (VPS/Server)

If you have your own server (DigitalOcean, AWS, etc.):

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Backend
cd backend
npm run build
pm2 start dist/server.js --name finance-backend
pm2 save

# Frontend (using serve)
cd ../frontend
npm run build
npm install -g serve
pm2 start "serve -s dist -l 3000" --name finance-frontend
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using Nginx (Recommended for Production)

```nginx
# /etc/nginx/sites-available/finance-tracker

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/finance-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📱 Access from Your Phone

Once deployed, you can access your app from anywhere:

### Via Browser
1. Open your phone's browser
2. Go to your deployed URL
3. Bookmark it for quick access

### Install as App (PWA)
1. Open the app in your browser
2. **Android**: Tap menu → "Add to Home screen"
3. **iPhone**: Tap Share → "Add to Home Screen"
4. App icon appears on your home screen!

---

## 🔒 Security Considerations

### For Production Use:

1. **Add Authentication**
   - Consider adding user login
   - Use JWT tokens
   - Implement password hashing

2. **Use PostgreSQL Instead of SQLite**
   - SQLite is great for development
   - For production, use PostgreSQL or MySQL
   - Update `DATABASE_URL` in Prisma

3. **Enable HTTPS**
   - Vercel/Railway provide HTTPS automatically
   - For self-hosting, use Let's Encrypt

4. **Environment Variables**
   - Never commit `.env` files
   - Use platform-specific environment variable management

---

## 🐛 Troubleshooting

### Backend won't start
- Check `DATABASE_URL` is set correctly
- Run `npx prisma generate` before deploying
- Check logs: `vercel logs` or Railway dashboard

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running

### Database issues
- For Vercel: SQLite may not persist (use PostgreSQL)
- For Railway: Add a PostgreSQL database service
- Update `schema.prisma` provider to `postgresql`

---

## 📊 Monitoring

### Vercel
- View logs in Vercel dashboard
- Monitor function execution
- Check analytics

### Railway
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts

---

## 🔄 Updates & Maintenance

### Deploying Updates

**With Vercel:**
```bash
# Just push to GitHub
git add .
git commit -m "Update feature X"
git push

# Vercel auto-deploys from GitHub!
```

**Manual Deploy:**
```bash
cd frontend  # or backend
vercel --prod
```

### Database Migrations

```bash
cd backend
npx prisma migrate deploy
```

---

## 💡 Tips

1. **Use a Custom Domain** (optional)
   - Buy a domain (e.g., from Namecheap)
   - Add to Vercel/Railway in project settings
   - Update DNS records

2. **Set Up Backups**
   - Use the app's backup feature regularly
   - Download backups to cloud storage
   - Consider automated backups

3. **Monitor Usage**
   - Check Vercel/Railway usage dashboard
   - Stay within free tier limits
   - Upgrade if needed

---

## 🎉 You're Done!

Your Finance Tracker is now accessible from anywhere in the world!

**Next Steps:**
- Share the URL with yourself
- Install as PWA on your phone
- Start tracking your finances!

**Questions?** Check the main README or open an issue on GitHub.
