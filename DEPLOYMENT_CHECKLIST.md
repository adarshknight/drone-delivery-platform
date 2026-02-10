# Deployment Checklist

## ✅ Files Created

- [x] `render.yaml` - Render.com deployment configuration
- [x] `frontend/.env.production` - Production environment variables
- [x] Backend CORS updated for production URLs
- [x] Backend already has build script in package.json

## 🚀 Ready to Deploy!

### Quick Start (5 minutes):

1. **Push to GitHub:**
   ```bash
   cd /Users/adarsh/.gemini/antigravity/scratch/drone-delivery-platform
   git init
   git add .
   git commit -m "Ready for deployment"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render.com:**
   - Go to [render.com](https://render.com)
   - Sign up (no credit card needed)
   - Click "New +" → "Blueprint"
   - Connect GitHub repository
   - Select your repo
   - Click "Apply"
   - Wait ~5 minutes for deployment

3. **Update Frontend URL:**
   - After backend deploys, copy its URL
   - Update `frontend/.env.production` with actual backend URL
   - Push changes to GitHub
   - Render will auto-redeploy

## 🎯 Your Live URLs:

- **Frontend:** `https://drone-delivery-frontend.onrender.com`
- **Backend:** `https://drone-delivery-backend.onrender.com`

## ⚡ Alternative: Railway.app

If you prefer Railway:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. "New Project" → "Deploy from GitHub"
4. Select repo → Deploy both services
5. Set environment variables in dashboard

## 📝 Notes:

- Free tier spins down after 15 min inactivity
- First request after sleep takes ~30s (cold start)
- Use UptimeRobot to keep it warm (optional)
- All WebSocket features will work on Render ✅
