# DevHubs Payment System - Backend Implementation

## Overview

This payment system implements a hybrid approach using **Cashfree** and **Razorpay** for different payment flows:

- **Cashfree PG**: Bid fees (₹9) and listing fees (₹199)
- **Razorpay**: Bonus pool funding (₹200 × contributors) with Route transfers
- **Webhook-first**: All payment confirmations via webhooks
- **Idempotent**: Duplicate webhook protection
- **Secure**: HMAC signature verification

## Payment Flows

### 1. Bid Fee Payment (₹9)
```
User → POST /api/payments/bid-fee → Cashfree Order → Webhook → Bid Status Updated
```

### 2. Listing Fee Payment (₹199)
```
User → POST /api/payments/listing → Cashfree Order → Webhook → Project Activated
```

### 3. Bonus Pool Funding (₹200 × contributors)
```
Project Owner → POST /api/payments/bonus → Razorpay Order → Webhook → Bonus Pool Created
```

### 4. Project Completion & Bonus Distribution
```
Project Owner → POST /api/projects/:id/complete → Razorpay Route Transfers → Contributors Paid
```

## Environment Configuration

Create `.env` file with:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Cashfree Configuration
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret

# Feature Flags
USE_CASHFREE_FOR_BIDS=true
USE_CASHFREE_FOR_LISTINGS=true
USE_RAZORPAY_FOR_BONUS=true
USE_RAZORPAY_SUBSCRIPTIONS=true

# Platform Configuration
PLATFORM_RZP_LINKED_ACCOUNT_ID=optional_platform_account_id
FRONTEND_URL=http://localhost:3000
WEBHOOK_PUBLIC_URL=http://localhost:5000/webhooks
```

## API Endpoints

### Payment Endpoints

#### Create Bid Fee Payment
```http
POST /api/payments/bid-fee
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_id",
  "bidId": "bid_id"
}
```

#### Create Listing Fee Payment
```http
POST /api/payments/listing
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_id"
}
```

#### Create Bonus Pool Funding
```http
POST /api/payments/bonus
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectId": "project_id",
  "contributorsCount": 3
}
```

#### Get Payment Status
```http
GET /api/payments/status/:intentId
Authorization: Bearer <token>
```

#### Get Payment History
```http
GET /api/payments/history?page=1&limit=10&purpose=bid_fee
Authorization: Bearer <token>
```

### Project Payment Endpoints

#### Complete Project & Distribute Bonus
```http
POST /api/projects/:id/complete
Authorization: Bearer <token>
```

#### Get Project Bonus Status
```http
GET /api/projects/:id/bonus-status
Authorization: Bearer <token>
```

#### Select Contributors
```http
POST /api/projects/:id/select-contributors
Authorization: Bearer <token>
Content-Type: application/json

{
  "contributorIds": ["bid_id_1", "bid_id_2"]
}
```

### Webhook Endpoints

#### Razorpay Webhook
```http
POST /webhooks/razorpay
Content-Type: application/json
X-Razorpay-Signature: <signature>
```

#### Cashfree Webhook
```http
POST /webhooks/cashfree
Content-Type: application/json
X-Webhook-Signature: <signature>
```

#### Get Webhook Events (Debug)
```http
GET /webhooks/events?provider=razorpay&limit=50
```

## Database Models

### PaymentIntent
Tracks all payment transactions with status and provider details.

### BonusPool
Manages bonus pool funding and distribution splits.

### WebhookEvent
Ensures webhook idempotency and prevents duplicate processing.

### Updated Models
- **ProjectListing**: Added bonus and escrow fields
- **Bidding**: Added fee payment tracking

## Security Features

1. **HMAC Signature Verification**: All webhooks verified
2. **Idempotency**: Duplicate webhook protection
3. **Authentication**: JWT-based access control
4. **Validation**: Request validation with Joi
5. **Logging**: Comprehensive payment event logging

## Testing

### Postman Collection

Create a Postman collection with:

1. **Bid Fee Flow**:
   - POST `/api/payments/bid-fee`
   - Simulate Cashfree webhook
   - Verify PaymentIntent status = 'paid'

2. **Listing Fee Flow**:
   - POST `/api/payments/listing`
   - Simulate Cashfree webhook
   - Verify project status = 'active'

3. **Bonus Funding Flow**:
   - POST `/api/payments/bonus`
   - Simulate Razorpay webhook
   - Verify BonusPool status = 'funded'

4. **Project Completion Flow**:
   - POST `/api/projects/:id/complete`
   - Verify Route transfers created

### Unit Tests

Test signature verification, idempotency, and split calculations.

## Error Handling

- **400**: Invalid request data
- **401**: Unauthorized access
- **403**: Access denied
- **404**: Resource not found
- **409**: Duplicate payment
- **500**: Internal server error

## Monitoring

### Logs
- Payment events logged with timestamps
- Webhook events tracked
- Error events with stack traces

### Alerts
- Webhook failures
- Transfer failures
- Payment processing errors

## Deployment

1. **Environment Variables**: Set all required env vars
2. **Webhook URLs**: Configure in payment provider dashboards
3. **Database**: Ensure MongoDB connection
4. **SSL**: Required for webhook endpoints
5. **Monitoring**: Set up logging and alerting

## Support

For issues:
1. Check webhook events: `GET /webhooks/events`
2. Verify payment status: `GET /api/payments/status/:intentId`
3. Check logs for error details
4. Validate webhook signatures

## Future Enhancements

1. **Subscription Management**: Razorpay subscription integration
2. **Payout System**: Cashfree/RazorpayX payouts
3. **Refund Handling**: Automated refund processing
4. **Analytics**: Payment analytics dashboard
5. **Multi-currency**: Support for other currencies
