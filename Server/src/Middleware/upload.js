import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 // Default 10MB
  }
});

// Helper function to create upload middleware for specific fields
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Helper function for single file upload
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Helper function for any file upload
export const uploadAny = () => {
  return upload.any();
};

// Normalization middleware to add helper methods to req
export const normalizeFiles = (req, res, next) => {
  // Add helper methods
  req.allFiles = () => {
    const files = [];
    if (req.files) {
      Object.values(req.files).forEach(fieldFiles => {
        if (Array.isArray(fieldFiles)) {
          files.push(...fieldFiles);
        } else {
          files.push(fieldFiles);
        }
      });
    }
    if (req.file) {
      files.push(req.file);
    }
    return files;
  };

  req.namedFiles = (fieldName) => {
    return req.files && req.files[fieldName] ? req.files[fieldName] : [];
  };

  req.getFile = (fieldName) => {
    if (req.files && req.files[fieldName]) {
      return Array.isArray(req.files[fieldName]) ? req.files[fieldName][0] : req.files[fieldName];
    }
    return null;
  };

  next();
};

// Combined middleware for file uploads with normalization
export const withUpload = (fieldsSpec, options = {}) => {
  const middlewares = [];
  
  // Add file upload middleware based on specification
  if (typeof fieldsSpec === 'string') {
    if (fieldsSpec === 'any') {
      middlewares.push(uploadAny());
    } else if (fieldsSpec.startsWith('single:')) {
      const fieldName = fieldsSpec.split(':')[1];
      middlewares.push(uploadSingle(fieldName));
    }
  } else if (Array.isArray(fieldsSpec)) {
    middlewares.push(uploadFields(fieldsSpec));
  }
  
  // Add normalization middleware
  middlewares.push(normalizeFiles);
  
  return middlewares;
};

export default upload;
