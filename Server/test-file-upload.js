import fs from 'fs';
import path from 'path';

// Simple test to verify upload system
console.log('Testing file upload system...');

// Check if uploads directory exists
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Uploads directory created');
} else {
  console.log('✅ Uploads directory exists');
}

// Check if multer is available
try {
  const multer = await import('multer');
  console.log('✅ Multer is available');
} catch (error) {
  console.log('❌ Multer not available:', error.message);
}

// Check if upload middleware can be imported
try {
  const { uploadFields } = await import('./src/Middleware/upload.js');
  console.log('✅ Upload middleware can be imported');
} catch (error) {
  console.log('❌ Upload middleware import failed:', error.message);
}

console.log('File upload system test completed!');
