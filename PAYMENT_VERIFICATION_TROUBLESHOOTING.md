# Payment Verification Troubleshooting Guide

## Problem Description
You're experiencing "Payment verification failed" errors in the console even though payments are being processed successfully through Razorpay.

## Root Causes & Solutions

### 1. **Webhook Configuration Issues**

**Problem**: Webhooks are not properly configured or not reaching your server.

**Solutions**:
- Ensure your webhook URL is correctly configured in Razorpay dashboard
- Check that your server is accessible from the internet (for production)
- Verify webhook secret is properly set in environment variables

**Environment Variables Required**:
```bash
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_ENV=test  # or 'live' for production
```

### 2. **Payment Intent Status Mismatch**

**Problem**: The frontend is checking for payment status using incorrect parameters.

**Solution**: The verification function has been updated to:
- First check payment status using intent ID
- Fall back to webhook verification endpoint
- Handle both orderId and intentId scenarios

### 3. **Environment Variable Issues**

**Problem**: Razorpay service is not properly configured.

**Check Environment Variables**:
```bash
# In your .env file
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
RAZORPAY_ENV=test
```

### 4. **Database Connection Issues**

**Problem**: Payment intents are not being saved or retrieved properly.

**Solution**: Check MongoDB connection and ensure PaymentIntent model is working.

## Debugging Steps

### Step 1: Check Server Logs
Look for these log messages in your server console:
```
[Webhook] Received webhook request
[Webhook] Webhook verification successful
[Payment Check] Checking payment status
```

### Step 2: Use Debug Script
Run the debug script to check payment status:
```bash
cd Server
node debug-payment.js <orderId>
```

### Step 3: Check Frontend Console
Look for these error messages:
```
Payment verification failed: Error: ...
Fallback payment verification also failed: Error: ...
```

### Step 4: Verify Webhook Endpoint
Test your webhook endpoint:
```bash
curl -X POST http://your-server/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## Common Error Scenarios

### Scenario 1: "Payment intent not found"
**Cause**: The payment intent was not saved to the database
**Solution**: Check if the payment creation process is working

### Scenario 2: "Webhook verification failed"
**Cause**: Webhook signature verification is failing
**Solution**: Check webhook secret configuration

### Scenario 3: "Razorpay API error"
**Cause**: Invalid API keys or network issues
**Solution**: Verify API keys and network connectivity

### Scenario 4: "Order verification failed"
**Cause**: Order status check with Razorpay is failing
**Solution**: Check if the order exists in Razorpay dashboard

## Testing Payment Flow

### 1. Create Test Payment
```javascript
// In browser console
const testPayment = await fetch('/api/payments/bonus', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    projectId: 'test-project-id',
    contributorsCount: 1,
    projectTitle: 'Test Project',
    isNewProject: true,
    amountPerContributor: 200
  })
});
```

### 2. Check Payment Status
```javascript
// Get the intentId from the response above
const status = await fetch(`/api/payments/status/${intentId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 3. Manual Verification
```javascript
// Use the webhook check endpoint
const verification = await fetch(`/api/webhooks/check-payment/${orderId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## Production Checklist

- [ ] Webhook URL is publicly accessible
- [ ] Webhook secret is properly configured
- [ ] API keys are for the correct environment (test/live)
- [ ] SSL certificate is valid (for production)
- [ ] Server can handle webhook requests
- [ ] Database connection is stable
- [ ] Error logging is enabled

## Monitoring & Alerts

Set up monitoring for:
- Webhook delivery failures
- Payment verification timeouts
- Database connection issues
- API rate limit errors

## Support

If issues persist:
1. Check server logs for detailed error messages
2. Verify all environment variables are set
3. Test with the debug script
4. Check Razorpay dashboard for payment status
5. Contact support with error logs and payment IDs
