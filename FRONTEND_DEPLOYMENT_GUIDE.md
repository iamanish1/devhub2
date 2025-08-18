# 🚀 Frontend Deployment Guide

## 📋 **Frontend Deployment Steps**

### **Step 1: Update API Configuration**

Your frontend now has a centralized API configuration in `client/src/config/api.js` that uses environment variables.

### **Step 2: Create Environment Files**

Create these files in your `client` directory:

#### **Development Environment (.env.development)**
```env
VITE_API_URL=http://localhost:8000
VITE_SOCKET_SERVER=http://localhost:8000
```

#### **Production Environment (.env.production)**
```env
VITE_API_URL=https://devhubs2-production.up.railway.app
VITE_SOCKET_SERVER=https://devhubs2-production.up.railway.app
```

### **Step 3: Deploy to Vercel**

#### **Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Deploy
vercel

# Set environment variables
vercel env add VITE_API_URL https://devhubs2-production.up.railway.app
vercel env add VITE_SOCKET_SERVER https://devhubs2-production.up.railway.app
```

#### **Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `client`
5. Set build command: `npm run build`
6. Set output directory: `dist`
7. Add environment variables:
   - `VITE_API_URL`: `https://devhubs2-production.up.railway.app`
   - `VITE_SOCKET_SERVER`: `https://devhubs2-production.up.railway.app`

### **Step 4: Alternative Deployment Options**

#### **Netlify Deployment**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `client/dist` folder
3. Or connect GitHub repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables in site settings

#### **GitHub Pages**
```bash
# Add to package.json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Install gh-pages
npm install --save-dev gh-pages

# Deploy
npm run deploy
```

## 🔧 **Update Components (Optional)**

If you want to use the new API configuration, update your components:

### **Example: Update AuthContext.jsx**
```javascript
import { API_ENDPOINTS } from '../config/api';

// Replace
const res = await axios.get("http://localhost:8000/api/getuser", {

// With
const res = await axios.get(API_ENDPOINTS.GET_USER, {
```

### **Example: Update BidingPage.jsx**
```javascript
import { API_ENDPOINTS, getFileUrl } from '../config/api';

// Replace hardcoded URLs
const bidRes = await axios.get(`http://localhost:8000/api/bid/getBid/${_id}`);

// With
const bidRes = await axios.get(API_ENDPOINTS.GET_BID(_id));

// For file URLs
src={getFileUrl(project.Project_cover_photo)}
```

## 🧪 **Test Deployment**

### **Local Testing**
```bash
cd client
npm run build
npm run preview
```

### **Production Testing**
1. Visit your deployed frontend URL
2. Test user registration/login
3. Test project listing
4. Test bidding functionality
5. Test admin features

## 📋 **Environment Variables Summary**

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | `http://localhost:8000` | `https://devhubs2-production.up.railway.app` |
| `VITE_SOCKET_SERVER` | `http://localhost:8000` | `https://devhubs2-production.up.railway.app` |

## 🚨 **Common Issues**

### **CORS Errors**
- Ensure your backend CORS is configured for your frontend domain
- Update `CLIENT_URL` in Railway to match your frontend URL

### **API Connection Issues**
- Verify environment variables are set correctly
- Check that your Railway backend is running
- Test API endpoints directly

### **Build Errors**
- Ensure all dependencies are installed: `npm install`
- Check for any TypeScript/ESLint errors
- Verify Vite configuration

## 🎯 **Deployment Checklist**

- [ ] Environment files created
- [ ] API configuration updated
- [ ] Build successful locally
- [ ] Deployed to Vercel/Netlify
- [ ] Environment variables set
- [ ] Frontend connects to backend
- [ ] All features tested
- [ ] CORS configured correctly

## 📞 **Quick Deploy Commands**

```bash
# Vercel CLI
npm install -g vercel
cd client
vercel
vercel env add VITE_API_URL https://devhubs2-production.up.railway.app
vercel env add VITE_SOCKET_SERVER https://devhubs2-production.up.railway.app

# Or build and deploy manually
npm run build
# Upload dist folder to your hosting provider
```

**Your frontend will be live at: `https://your-app-name.vercel.app`**
