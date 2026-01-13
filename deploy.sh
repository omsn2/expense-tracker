#!/bin/bash

echo "🚀 Finance Tracker - Quick Deployment Script"
echo "=============================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Commit
echo "💾 Creating commit..."
read -p "Enter commit message (default: 'Deploy Finance Tracker v1.0'): " commit_msg
commit_msg=${commit_msg:-"Deploy Finance Tracker v1.0"}
git commit -m "$commit_msg"

echo ""
echo "✅ Git repository ready!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Create a GitHub repository at: https://github.com/new"
echo "2. Run these commands:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo ""
echo "   Backend:"
echo "   cd backend"
echo "   npm install -g vercel"
echo "   vercel login"
echo "   vercel"
echo ""
echo "   Frontend:"
echo "   cd frontend"
echo "   echo 'VITE_API_URL=https://your-backend.vercel.app' > .env.production"
echo "   vercel"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
