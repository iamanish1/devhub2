# 🚀 DevHubs Payment System Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Razorpay merchant account
- Cashfree merchant account
- Public domain (for webhooks)

## 🔧 Step-by-Step Setup

### **Step 1: Environment Configuration**

1. **Copy environment template:**
   ```bash
   cd Server
   cp env.example .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Validate environment:**
   ```bash
   node validate-env.js
   ```

### **Step 2: Payment Provider Setup**

#### **🔵 Razorpay Setup**

1. **Create Razorpay Account:**
   - Visit [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)
   - Sign up and complete KYC verification
   - Wait for account approval (usually 24-48 hours)

2. **Get API Keys:**
   - Go to **Settings → API Keys**
   - Click "Generate Key Pair"
   - Copy `Key ID` and `Key Secret`
   - Update your `.env` file:
     ```env
     RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
     RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     ```

3. **Configure Webhook:**
   - Go to **Settings → Webhooks**
   - Add webhook URL: `https://yourdomain.com/webhooks/razorpay`
   - Copy webhook secret and update `.env`:
     ```env
     RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     ```

4. **Enable Route (Optional):**
   - Contact Razorpay support to enable Route feature
   - Get your linked account ID for transfers
   - Update `.env`:
     ```env
     PLATFORM_RZP_LINKED_ACCOUNT_ID=acc_xxxxxxxxxxxxx
     ```

#### **🟢 Cashfree Setup**

1. **Create Cashfree Account:**
   - Visit [https://merchant.cashfree.com/](https://merchant.cashfree.com/)
   - Sign up and complete business verification
   - Wait for account approval

2. **Get API Credentials:**
   - Go to **Settings → API Keys**
   - Copy `App ID` and `Secret Key`
   - Update your `.env` file:
     ```env
     CASHFREE_APP_ID=xxxxxxxxxxxxxxxxxxxxxxxx
     CASHFREE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
     CASHFREE_ENV=sandbox
     ```

3. **Configure Webhook:**
   - Go to **Settings → Webhooks**
   - Add webhook URL: `https://yourdomain.com/webhooks/cashfree`
   - Copy webhook secret if available:
     ```env
     CASHFREE_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
     ```

### **Step 3: Database Setup**

1. **MongoDB Connection:**
   - Ensure MongoDB is running
   - Update connection string in `.env`:
     ```env
     MONGODB_URI=mongodb://localhost:27017/devhubs
     ```

2. **Database Models:**
   - The payment models will be created automatically when you first use them
   - No manual database setup required

### **Step 4: URL Configuration**

1. **Update URLs in `.env`:**
   ```env
   # Development
   FRONTEND_URL=http://localhost:3000
   CLIENT_URL=http://localhost:3000
   WEBHOOK_PUBLIC_URL=http://localhost:5000/webhooks
   
   # Production (replace with your domain)
   FRONTEND_URL=https://yourdomain.com
   CLIENT_URL=https://yourdomain.com
   WEBHOOK_PUBLIC_URL=https://yourdomain.com/webhooks
   ```

### **Step 5: Feature Flags**

Configure which payment providers to use:

```env
# Enable Cashfree for bid fees (₹9)
USE_CASHFREE_FOR_BIDS=true

# Enable Cashfree for listing fees (₹199)
USE_CASHFREE_FOR_LISTINGS=true

# Enable Razorpay for bonus funding (₹200 × contributors)
USE_RAZORPAY_FOR_BONUS=true

# Enable Razorpay subscriptions (₹299/month)
USE_RAZORPAY_SUBSCRIPTIONS=true
```

### **Step 6: Security Configuration**

1. **JWT Secret:**
   ```env
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

2. **Generate a secure JWT secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### **Step 7: Testing Setup**

1. **Run validation script:**
   ```bash
   node validate-env.js
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Test payment endpoints:**
   ```bash
   node test-payment-system.js
   ```

## 🔍 Environment Validation

Run the validation script to check your setup:

```bash
node validate-env.js
```

This will show:
- ✅ Properly configured variables
- ❌ Missing variables
- ⚠️ Variables with default values
- 🔧 Payment provider status
- 🎯 Feature flags status

## 🧪 Testing

### **Local Testing**

1. **Start server:**
   ```bash
   npm start
   ```

2. **Test endpoints:**
   ```bash
   node test-payment-system.js
   ```

3. **Check webhook events:**
   ```bash
   curl http://localhost:5000/webhooks/events
   ```

### **Production Testing**

1. **Use ngrok for webhook testing:**
   ```bash
   ngrok http 5000
   ```

2. **Update webhook URLs in payment provider dashboards**

3. **Test with real payment flows**

## 🚨 Common Issues & Solutions

### **Issue 1: "Invalid API Key"**
- **Solution:** Check your API credentials in the payment provider dashboard
- **Verify:** Key ID and Secret are correctly copied

### **Issue 2: "Webhook signature verification failed"**
- **Solution:** Ensure webhook secret is correctly set in `.env`
- **Verify:** Webhook URL is accessible from the internet

### **Issue 3: "MongoDB connection failed"**
- **Solution:** Check MongoDB is running and connection string is correct
- **Verify:** Database exists and user has proper permissions

### **Issue 4: "CORS error"**
- **Solution:** Update `CLIENT_URL` and `FRONTEND_URL` in `.env`
- **Verify:** Frontend URL matches your actual frontend domain

## 📞 Support

### **Razorpay Support**
- Email: support@razorpay.com
- Phone: 1800-123-4567
- Documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)

### **Cashfree Support**
- Email: merchant.support@cashfree.com
- Phone: 1800-102-6483
- Documentation: [https://docs.cashfree.com/](https://docs.cashfree.com/)

### **DevHubs Support**
- Check logs: `tail -f logs/app.log`
- Validate environment: `node validate-env.js`
- Test endpoints: `node test-payment-system.js`

## 🔐 Security Checklist

- [ ] JWT secret is strong and unique
- [ ] API keys are kept secure and not committed to git
- [ ] Webhook secrets are properly configured
- [ ] HTTPS is enabled for production
- [ ] Environment variables are properly set
- [ ] Database connection is secure
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is enabled
- [ ] Error logging is configured

## 🚀 Deployment Checklist

- [ ] Environment variables are set in production
- [ ] Database is properly configured
- [ ] Webhook URLs are updated in payment provider dashboards
- [ ] SSL certificate is installed
- [ ] Domain is properly configured
- [ ] Monitoring and logging are set up
- [ ] Backup strategy is implemented
- [ ] Security headers are configured
- [ ] Rate limiting is enabled
- [ ] Error handling is tested

## 📚 Additional Resources

- [Payment System README](PAYMENT_SYSTEM_README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
