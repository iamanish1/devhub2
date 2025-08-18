// Environment validation script
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔍 Validating Environment Configuration...\n');

const requiredEnvVars = {
  // Basic Configuration
  'NODE_ENV': 'Server environment (development/production)',
  'PORT': 'Server port number',
  'MONGODB_URI': 'MongoDB connection string',
  'JWT_SECRET': 'JWT token secret key',
  'CLIENT_URL': 'Frontend URL for CORS',
  
  // Razorpay Configuration
  'RAZORPAY_KEY_ID': 'Razorpay API Key ID',
  'RAZORPAY_KEY_SECRET': 'Razorpay API Secret Key',
  'RAZORPAY_WEBHOOK_SECRET': 'Razorpay webhook secret',
  
  // Cashfree Configuration
  'CASHFREE_APP_ID': 'Cashfree App ID',
  'CASHFREE_SECRET_KEY': 'Cashfree Secret Key',
  'CASHFREE_ENV': 'Cashfree environment (sandbox/production)',
  'CASHFREE_WEBHOOK_SECRET': 'Cashfree webhook secret',
  
  // Feature Flags
  'USE_CASHFREE_FOR_BIDS': 'Enable Cashfree for bid fees',
  'USE_CASHFREE_FOR_LISTINGS': 'Enable Cashfree for listing fees',
  'USE_RAZORPAY_FOR_BONUS': 'Enable Razorpay for bonus funding',
  'USE_RAZORPAY_SUBSCRIPTIONS': 'Enable Razorpay subscriptions',
  
  // URLs
  'FRONTEND_URL': 'Frontend application URL',
  'WEBHOOK_PUBLIC_URL': 'Public webhook URL'
};

const optionalEnvVars = {
  'PLATFORM_RZP_LINKED_ACCOUNT_ID': 'Razorpay Route linked account ID (optional)',
  'UPLOADS_DIR': 'File uploads directory',
  'MAX_FILE_SIZE_MB': 'Maximum file size in MB'
};

let allValid = true;
const missingVars = [];
const invalidVars = [];

console.log('📋 Required Environment Variables:');
console.log('=====================================');

// Check required variables
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (!value) {
    missingVars.push(key);
    console.log(`❌ ${key}: ${description} - MISSING`);
    allValid = false;
  } else if (value === 'your_' + key.toLowerCase().replace(/_/g, '_') || 
             value.includes('YOUR_') || 
             value === 'optional_platform_account_id') {
    invalidVars.push(key);
    console.log(`⚠️  ${key}: ${description} - DEFAULT VALUE (needs to be updated)`);
    allValid = false;
  } else {
    console.log(`✅ ${key}: ${description} - SET`);
  }
}

console.log('\n📋 Optional Environment Variables:');
console.log('=====================================');

// Check optional variables
for (const [key, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  if (!value) {
    console.log(`ℹ️  ${key}: ${description} - NOT SET (optional)`);
  } else {
    console.log(`✅ ${key}: ${description} - SET`);
  }
}

console.log('\n🔧 Payment Provider Configuration:');
console.log('=====================================');

// Validate Razorpay config
const rzpKeyId = process.env.RAZORPAY_KEY_ID;
const rzpKeySecret = process.env.RAZORPAY_KEY_SECRET;
const rzpWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

if (rzpKeyId && rzpKeySecret && rzpWebhookSecret) {
  console.log('✅ Razorpay: All credentials configured');
  console.log(`   Key ID: ${rzpKeyId.substring(0, 8)}...`);
  console.log(`   Webhook Secret: ${rzpWebhookSecret.substring(0, 8)}...`);
} else {
  console.log('❌ Razorpay: Missing credentials');
}

// Validate Cashfree config
const cfAppId = process.env.CASHFREE_APP_ID;
const cfSecretKey = process.env.CASHFREE_SECRET_KEY;
const cfEnv = process.env.CASHFREE_ENV;

if (cfAppId && cfSecretKey) {
  console.log('✅ Cashfree: All credentials configured');
  console.log(`   App ID: ${cfAppId.substring(0, 8)}...`);
  console.log(`   Environment: ${cfEnv || 'sandbox'}`);
} else {
  console.log('❌ Cashfree: Missing credentials');
}

console.log('\n🎯 Feature Flags Status:');
console.log('==========================');

const featureFlags = {
  'Bid Fees': process.env.USE_CASHFREE_FOR_BIDS === 'true',
  'Listing Fees': process.env.USE_CASHFREE_FOR_LISTINGS === 'true',
  'Bonus Funding': process.env.USE_RAZORPAY_FOR_BONUS === 'true',
  'Subscriptions': process.env.USE_RAZORPAY_SUBSCRIPTIONS === 'true'
};

for (const [feature, enabled] of Object.entries(featureFlags)) {
  console.log(`${enabled ? '✅' : '❌'} ${feature}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

console.log('\n🌐 URL Configuration:');
console.log('======================');

const urls = {
  'Frontend URL': process.env.FRONTEND_URL,
  'Client URL': process.env.CLIENT_URL,
  'Webhook URL': process.env.WEBHOOK_PUBLIC_URL
};

for (const [name, url] of Object.entries(urls)) {
  if (url) {
    console.log(`✅ ${name}: ${url}`);
  } else {
    console.log(`❌ ${name}: NOT SET`);
  }
}

// Summary
console.log('\n📊 Validation Summary:');
console.log('=======================');

if (allValid) {
  console.log('🎉 All required environment variables are properly configured!');
  console.log('✅ Your payment system is ready to use.');
} else {
  console.log('❌ Environment configuration issues found:');
  
  if (missingVars.length > 0) {
    console.log(`\n📝 Missing variables (${missingVars.length}):`);
    missingVars.forEach(varName => console.log(`   - ${varName}`));
  }
  
  if (invalidVars.length > 0) {
    console.log(`\n⚠️  Variables with default values (${invalidVars.length}):`);
    invalidVars.forEach(varName => console.log(`   - ${varName}`));
  }
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Update your .env file with actual values');
  console.log('2. Get API credentials from Razorpay and Cashfree dashboards');
  console.log('3. Configure webhook URLs in payment provider dashboards');
  console.log('4. Run this validation script again');
}

console.log('\n📚 Documentation:');
console.log('==================');
console.log('📖 Payment System README: Server/PAYMENT_SYSTEM_README.md');
console.log('🧪 Test Script: Server/test-payment-system.js');
console.log('🔗 Razorpay Dashboard: https://dashboard.razorpay.com/');
console.log('🔗 Cashfree Dashboard: https://merchant.cashfree.com/');
