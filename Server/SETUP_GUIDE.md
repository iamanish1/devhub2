# 🚀 Platform Setup Guide

## **📋 Prerequisites**
- Node.js (v16 or higher)
- MongoDB database
- Cashfree merchant account
- Domain with SSL certificate

## **🔧 Environment Setup**

### **1. Clone and Install**
```bash
git clone <repository-url>
cd developerProduct
npm install
cd Server
npm install
```

### **2. Environment Variables**

Create `.env` file in the Server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/devhub
# or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40project.iam.gserviceaccount.com

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Logging
LOG_LEVEL=info
```

### **3. 🟢 Cashfree Setup**

#### **Create Cashfree Account:**
1. Visit [https://merchant.cashfree.com/](https://merchant.cashfree.com/)
2. Sign up for a merchant account
3. Complete KYC verification
4. Get your App ID and Secret Key

#### **Add Cashfree Environment Variables:**
```env
# Cashfree Configuration
CASHFREE_APP_ID=xxxxxxxxxxxxxxxxxxxxxxxx
CASHFREE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
CASHFREE_ENV=sandbox
```

#### **Configure Webhooks:**
1. Go to Cashfree Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/webhooks/cashfree`
3. Select events: `order.paid`, `payment.success`
4. Copy webhook secret and add to .env:
```env
CASHFREE_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### **4. Payment Configuration**

#### **Enable Payment Features:**
```env
# Enable Cashfree for bid fees (₹9)
USE_CASHFREE_FOR_BIDS=true

# Enable Cashfree for listing fees (₹199)
USE_CASHFREE_FOR_LISTINGS=true

# Enable Cashfree for bonus funding (₹200 × contributors)
USE_CASHFREE_FOR_BONUS=true

# Enable Cashfree for subscriptions (₹299/month)
USE_CASHFREE_FOR_SUBSCRIPTIONS=true
```

#### **Payment Amounts:**
```env
# Bid fee amount (₹9)
BID_FEE=9

# Listing fee amount (₹199)
LISTING_FEE=199

# Bonus per contributor (₹200)
BONUS_PER_CONTRIBUTOR=200

# Subscription amount (₹299)
SUBSCRIPTION_AMOUNT=299
```

## **🚀 Deployment**

### **1. Production Environment**
```env
NODE_ENV=production
CASHFREE_ENV=production
```

### **2. Start Server**
```bash
# Development
npm run dev

# Production
npm start
```

### **3. Verify Setup**
- Check server logs for successful initialization
- Test payment flow with test credentials
- Verify webhook endpoints are accessible

## **🔍 Troubleshooting**

### **Common Issues:**
1. **MongoDB Connection Error**: Check MONGODB_URI format
2. **Payment Gateway Error**: Verify Cashfree credentials
3. **Webhook Failures**: Check webhook URL and secret
4. **File Upload Issues**: Ensure upload directory exists

### **Logs:**
- Check server logs for detailed error messages
- Monitor webhook events in database
- Verify payment status in Cashfree dashboard

## **📞 Support**

### **Cashfree Support**
- Email: merchant.support@cashfree.com
- Phone: 1800-102-9533
- Documentation: [https://docs.cashfree.com/](https://docs.cashfree.com/)

### **Platform Support**
- GitHub Issues: [Repository Issues Page]
- Email: support@yourplatform.com
