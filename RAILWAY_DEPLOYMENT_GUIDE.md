# 🚂 Railway Deployment Guide

## 📋 **Step-by-Step Railway Deployment**

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Navigate to Server Directory**
```bash
cd Server
```

### **Step 4: Initialize Railway Project**
```bash
railway init
```

### **Step 5: Deploy to Railway**
```bash
railway up
```

### **Step 6: Set Environment Variables**

You need to set these environment variables in Railway dashboard:

#### **Required Variables:**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devhubs?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=https://your-frontend-domain.vercel.app
UPLOADS_DIR=uploads
MAX_FILE_SIZE_MB=10
```

#### **Optional Firebase Variables (if using):**
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

### **Step 7: Get Your Backend URL**

After deployment, Railway will give you a URL like:
```
https://your-app-name.railway.app
```

### **Step 8: Test Your Deployment**

#### **Health Check:**
```bash
curl https://your-app-name.railway.app/api/health
```

#### **Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

#### **Test API Endpoints:**
```bash
# Test project listing
curl https://your-app-name.railway.app/api/project/getlistproject

# Test user registration
curl -X POST https://your-app-name.railway.app/api/user \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123"}'
```

## 🗄️ **MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create new cluster (free tier)

### **Step 2: Get Connection String**
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database password
5. Replace `<dbname>` with `devhubs`

### **Step 3: Set in Railway**
```bash
railway variables set MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devhubs?retryWrites=true&w=majority
```

## 🔐 **Generate Secure JWT Secret**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then set it in Railway:
```bash
railway variables set JWT_SECRET=your_generated_secret_here
```

## 📱 **Frontend Deployment (Vercel)**

### **Step 1: Deploy Frontend**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set root directory to `client`
4. Deploy

### **Step 2: Set Frontend Environment**
```env
REACT_APP_API_URL=https://your-app-name.railway.app
```

### **Step 3: Update Backend CORS**
Set in Railway:
```bash
railway variables set CLIENT_URL=https://your-frontend-domain.vercel.app
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Build Fails**
- **Solution:** Check if all dependencies are in `package.json`
- **Check:** Ensure `type: "module"` is set for ES6 imports

### **Issue 2: MongoDB Connection Fails**
- **Solution:** Check connection string format
- **Verify:** Network access is enabled in MongoDB Atlas

### **Issue 3: CORS Errors**
- **Solution:** Update `CLIENT_URL` with correct frontend domain
- **Check:** Frontend and backend URLs match

### **Issue 4: Port Issues**
- **Solution:** Railway automatically sets PORT, don't override it
- **Check:** Use `process.env.PORT` in your code

## 📊 **Monitoring & Logs**

### **View Logs:**
```bash
railway logs
```

### **View Variables:**
```bash
railway variables
```

### **Restart Service:**
```bash
railway service restart
```

## 🔄 **Next Steps After Deployment**

### **Phase 2: Add Payment Gateway**
1. **Get your live backend URL**
2. **Add payment gateway code**
3. **Configure webhooks with live URLs**
4. **Test payment flows**

## 📞 **Railway Commands Reference**

```bash
# Deploy
railway up

# View logs
railway logs

# Set variables
railway variables set KEY=value

# View variables
railway variables

# Open dashboard
railway open

# Restart service
railway service restart
```

## 🎯 **Deployment Checklist**

- [ ] Railway CLI installed
- [ ] Logged into Railway
- [ ] Project initialized
- [ ] Code deployed
- [ ] Environment variables set
- [ ] MongoDB connected
- [ ] Health check working
- [ ] API endpoints tested
- [ ] Frontend deployed
- [ ] CORS configured
- [ ] Ready for payment gateway

## 🚀 **Quick Deploy Commands**

```bash
# Complete deployment sequence
npm install -g @railway/cli
railway login
cd Server
railway init
railway up
railway variables set NODE_ENV=production
railway variables set MONGODB_URI=your_mongodb_uri
railway variables set JWT_SECRET=your_jwt_secret
railway variables set CLIENT_URL=https://your-frontend-domain.vercel.app
```

**Your backend will be live at: `https://your-app-name.railway.app`**
