# Razorpay Frontend Setup Guide

## Environment Variables Configuration

To fix the "Razorpay Key ID not configured" error, you need to set up environment variables for the frontend.

### Step 1: Create Environment File

Create a `.env` file in the `client/` directory with the following content:

```env
# Razorpay Configuration
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx  # Replace with your actual Razorpay test key ID
VITE_RAZORPAY_MODE=test                   # Environment mode (test/live)
```

### Step 2: Get Your Razorpay Key ID

1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Copy your **Key ID** (starts with `rzp_test_` for test mode or `rzp_live_` for live mode)
4. Replace `rzp_test_xxxxxxxxxx` in the `.env` file with your actual key ID

### Step 3: Set Environment Mode

- Use `VITE_RAZORPAY_MODE=test` for testing/development
- Use `VITE_RAZORPAY_MODE=live` for production

### Step 4: Restart Development Server

After creating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Test Keys (For Development)

If you don't have a Razorpay account yet, you can use these test keys for development:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_1DP5mmOlF5G5ag
VITE_RAZORPAY_MODE=test
```

**Note**: These are public test keys and should only be used for development/testing.

## Production Setup

For production deployment:

1. Create a Razorpay live account
2. Generate live API keys
3. Set environment variables in your hosting platform (Vercel, Netlify, etc.)
4. Use `VITE_RAZORPAY_MODE=live`

## Troubleshooting

### Error: "Razorpay Key ID not configured"
- Ensure the `.env` file is in the `client/` directory
- Check that the key ID is correct and not the placeholder value
- Restart the development server after making changes

### Error: "Razorpay SDK not loaded"
- Ensure the Razorpay script is loaded in `index.html`
- Check your internet connection
- Verify that the script URL is accessible

### Payment Modal Not Opening
- Check browser console for JavaScript errors
- Ensure all environment variables are set correctly
- Verify that the payment data is being passed correctly

## Security Notes

- Never commit your `.env` file to version control
- Use test keys for development
- Use live keys only in production
- Keep your API keys secure and don't share them publicly
