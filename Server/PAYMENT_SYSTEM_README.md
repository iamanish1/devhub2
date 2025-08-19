# 💳 Payment System Documentation

This payment system implements **Cashfree** as the sole payment gateway for all payment flows:

- **Cashfree**: Bid fees (₹9), listing fees (₹199), bonus funding (₹200 × contributors), and subscriptions (₹299/month)

## 🔄 Payment Flows

### **1. Bid Fee Payment (₹9)**
```
User → POST /api/payments/bid-fee → Cashfree Order → Webhook → Bid Status Updated
```

### **2. Project Listing Fee (₹199)**
```
User → POST /api/payments/listing → Cashfree Order → Webhook → Project Activated
```

### **3. Bonus Pool Funding (₹200 × contributors)**
```
Project Owner → POST /api/payments/bonus → Cashfree Order → Webhook → Bonus Pool Created
```

### **4. Contributor Payouts**
```
Project Owner → POST /api/projects/:id/complete → Cashfree Payouts → Contributors Paid
```

### **5. Subscription Payment (₹299/month)**
```
User → POST /api/payments/subscription → Cashfree Order → Webhook → Subscription Activated
```

## ⚙️ Configuration

### **Environment Variables**
```env
# Cashfree Configuration
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret

# Feature Flags
USE_CASHFREE_FOR_BIDS=true
USE_CASHFREE_FOR_LISTINGS=true
USE_CASHFREE_FOR_BONUS=true
USE_CASHFREE_FOR_SUBSCRIPTIONS=true

# Payment Amounts
BID_FEE=9
LISTING_FEE=199
BONUS_PER_CONTRIBUTOR=200
SUBSCRIPTION_AMOUNT=299
```

## 🏗️ Architecture

### **Models**
- `PaymentIntent`: Tracks all payment intents
- `BonusPool`: Manages bonus pool funding and distribution
- `Payout`: Handles contributor payouts
- `WebhookEvent`: Logs webhook events for debugging

### **Services**
- `cashfree.js`: Cashfree API integration
- `payouts.js`: Payout processing logic

### **Controllers**
- `paymentsController.js`: Payment creation and management
- `webhooksController.js`: Webhook event handling

## 🔗 API Endpoints

### **Payment Creation**
```http
POST /api/payments/bid-fee
POST /api/payments/listing
POST /api/payments/bonus
POST /api/payments/subscription
POST /api/payments/withdrawal
```

### **Payment Status**
```http
GET /api/payments/status/:intentId
GET /api/payments/history
GET /api/payments/subscription-status
```

### **Webhooks**
```http
POST /webhooks/cashfree
GET /webhooks/events?provider=cashfree&limit=50
```

## 🔄 Webhook Processing

### **Cashfree Webhook Events**
- `order.paid`: Payment successful
- `payment.success`: Payment captured
- `order.failed`: Payment failed

### **Event Handling**
1. **Signature Verification**: Verify webhook authenticity
2. **Duplicate Check**: Prevent duplicate processing
3. **Payment Intent Update**: Update payment status
4. **Business Logic**: Handle specific payment purposes
5. **Logging**: Record event for debugging

## 🧪 Testing

### **Test Payment Flow**
```bash
# Create test payment
curl -X POST http://localhost:5000/api/payments/bid-fee \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "project_id", "bidId": "bid_id"}'

# Check payment status
curl http://localhost:5000/api/payments/status/<intent_id>
```

### **Simulate Webhook**
```bash
# Simulate Cashfree webhook
curl -X POST http://localhost:5000/webhooks/cashfree \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_id", "orderStatus": "PAID"}'
```

## 📊 Monitoring

### **Payment Metrics**
- Success/failure rates
- Average processing time
- Revenue tracking
- Subscription analytics

### **Webhook Monitoring**
- Delivery success rate
- Processing time
- Error rates
- Duplicate events

## 🔐 Security

### **Webhook Security**
- Signature verification
- Duplicate event prevention
- Rate limiting
- IP whitelisting (optional)

### **Payment Security**
- Input validation
- Amount verification
- User authentication
- Audit logging

## 🚨 Error Handling

### **Common Errors**
- Invalid payment amount
- Duplicate payment attempts
- Webhook signature mismatch
- Payment gateway errors

### **Recovery Procedures**
- Retry failed payments
- Manual payment verification
- Webhook replay
- Database reconciliation

## 📈 Future Enhancements

1. **Subscription Management**: Recurring payment handling
2. **Payout System**: Cashfree Payouts integration
3. **Analytics Dashboard**: Payment analytics and reporting
4. **Multi-currency Support**: International payments
5. **Advanced Fraud Detection**: Risk assessment and prevention

## 📞 Support

### **Cashfree Support**
- Email: merchant.support@cashfree.com
- Phone: 1800-102-9533
- Documentation: [https://docs.cashfree.com/](https://docs.cashfree.com/)

### **Platform Support**
- Check logs: `tail -f logs/app.log`
- Monitor webhooks: `GET /webhooks/events`
- Test endpoints: Use provided test scripts
