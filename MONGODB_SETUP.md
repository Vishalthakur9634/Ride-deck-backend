# MongoDB Atlas - Complete Setup Guide

## ✅ Current Status:
- Connection string configured with TLS/SSL
- Auto-retry enabled (won't crash if MongoDB is down)
- Server continues running even if MongoDB fails

## 🔧 If You Still Get Errors:

### Option 1: Verify IP Whitelist (Required!)

1. Go to https://cloud.mongodb.com
2. Click **"Network Access"** (left sidebar)
3. Check if you see `0.0.0.0/0` in the list
4. If NOT, click **"Add IP Address"** → **"Allow Access from Anywhere"**
5. Enter: `0.0.0.0/0`
6. Click **"Confirm"**

### Option 2: Verify Database User

1. Go to https://cloud.mongodb.com
2. Click **"Database Access"** (left sidebar)
3. Check if user `vishalthakur` exists
4. Make sure role is **"Atlas Admin"** or **"Read and write to any database"**
5. If password is wrong, click **"Edit"** → **"Edit Password"** → Generate new one
6. Update `.env` file with new password

### Option 3: Get Fresh Connection String

1. Go to https://cloud.mongodb.com
2. Click **"Database"** → **"Connect"** on your cluster
3. Click **"Drivers"**
4. Copy the NEW connection string
5. Replace `<password>` with your password
6. Add `/ride-deck` before the `?`
7. Paste in `.env` as `MONGO_URI=...`

## 🎯 For Localhost Development (Easier!)

If you want to use **localhost MongoDB** instead (no Atlas issues):

1. Make sure MongoDB is installed and running locally
2. Update `.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/ride-deck
   ```
3. Restart backend
4. Use Atlas only for production (Render deployment)

## ⚡ Current Configuration:

Your MongoDB connection is configured to:
- ✅ Timeout quickly (5s) if can't connect
- ✅ Automatically retry every 10 seconds
- ✅ NOT crash the server
- ✅ Allow TLS/SSL connections
- ✅ Handle certificate issues

**The server will keep running even if MongoDB fails!**
