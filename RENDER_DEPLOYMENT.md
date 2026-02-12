# Environment Variables for Render (Backend)

When deploying to Render, add these environment variables in the Render dashboard:

## Required Variables:

```
PORT=5001
MONGO_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=mohit_singh_achieve
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://ride-deck-frontend.netlify.app
NODE_ENV=production
```

## Important Notes:

1. **MONGO_URI**: Replace `<your-mongodb-atlas-connection-string>` with your MongoDB Atlas connection string
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/ride-deck?retryWrites=true&w=majority`
   - Create a free cluster at https://cloud.mongodb.com

2. **FRONTEND_URL**: This should be your Netlify URL
   - Format: `https://ride-deck-frontend.netlify.app`
   - Or your custom domain if you have one

3. **PORT**: Render will use this, but may override it with their own PORT variable

4. **NODE_ENV**: Set to `production` for production deployment

## Steps to Deploy on Render:

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `Ride-deck-backend`
4. Configure:
   - **Name**: Ride-deck-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)
5. Add all the environment variables listed above in the "Environment" section
6. Click "Create Web Service"
7. **Note your backend URL**: `https://ride-deck-backend.onrender.com` (example)
   - You'll need this for the frontend configuration!
