# 🔧 Render Deployment - 500 Error Fix

## Current Issue:
Getting 500 errors on `ride-deck-backend.onrender.com/api/auth/register`

## ✅ Quick Fixes to Check:

### 1. **Verify Render Environment Variables**

Go to Render Dashboard → Your Service → Environment

**Required Variables:**
```
NODE_ENV=production
MONGO_URI=mongodb+srv://vishalthakur:vishal9634@ridedeck2.cgmsrud.mongodb.net/ride-deck?retryWrites=true&w=majority
JWT_SECRET=mohit_singh_achieve
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://ride-deck-frontend.netlify.app
PORT=5001
```

### 2. **Check Render Logs**

In Render Dashboard → Your Service → Logs

Look for:
- `✅ MongoDB connected successfully` - Good!
- `❌ MongoDB connection failed` - Problem!
- Any error messages

### 3. **MongoDB Atlas IP Whitelist**

1. Go to https://cloud.mongodb.com
2. Network Access → IP Access List
3. Make sure `0.0.0.0/0` is whitelisted
4. If not, click "Add IP Address" → "Allow Access from Anywhere"

### 4. **Common 500 Error Causes:**

**MongoDB Not Connected:**
- Check if `NODE_ENV=production` is set in Render
- Verify MONGO_URI is correct
- Check MongoDB Atlas allows Render IPs

**Missing Environment Variables:**
- All 6 variables must be set in Render
- Check for typos in variable names

**Build Issues:**
- Make sure latest code is pushed to GitHub
- Check Render is deploying the latest commit

---

## 🔍 Debugging Steps:

1. **Check Render Logs First** - This will tell you exactly what's wrong
2. **Verify MongoDB Connection** - Look for "MongoDB connected" in logs
3. **Test API Endpoints** - Try `/api/auth/login` and `/api/auth/register`

---

## 📋 Checklist:

- [ ] All environment variables set in Render
- [ ] `NODE_ENV=production` in Render
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Latest code pushed to GitHub
- [ ] Render deployed latest commit
- [ ] Checked Render logs for errors

---

**Send me the Render logs if you're still stuck!**
