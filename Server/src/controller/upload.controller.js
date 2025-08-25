import fs from 'fs';
import path from 'path';

// Upload project files
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const fileInfo = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.status(200).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Error processing upload',
      error: error.message
    });
  }
};

// Upload chat files
export const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    // Validate file size (10MB limit for chat files)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'File size must be less than 10MB'
      });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        message: 'File type not allowed'
      });
    }

    const fileInfo = {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.status(200).json({
      message: 'Chat file uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Chat upload error:', error);
    res.status(500).json({
      message: 'Error processing chat file upload',
      error: error.message
    });
  }
};

// Controller to accept and process uploaded files
export const acceptUpload = async (req, res) => {
  try {
    // Handle both single and multiple file uploads
    let files = [];
    
    if (req.allFiles && typeof req.allFiles === 'function') {
      files = req.allFiles();
    } else {
      // Fallback if normalizeFiles middleware wasn't applied
      if (req.file) {
        files = [req.file];
      } else if (req.files) {
        Object.values(req.files).forEach(fieldFiles => {
          if (Array.isArray(fieldFiles)) {
            files.push(...fieldFiles);
          } else {
            files.push(fieldFiles);
          }
        });
      }
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        message: 'No files uploaded'
      });
    }

    const fileSummaries = files.map(file => ({
      fieldname: file.fieldname,
      originalname: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileSummaries,
      count: files.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      message: 'Error processing upload',
      error: error.message
    });
  }
};

// Controller to delete uploaded files
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File not found'
      });
    }

    fs.unlinkSync(filePath);
    res.status(200).json({
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      message: 'Error deleting file',
      error: error.message
    });
  }
};

// Controller to get file info
export const getFileInfo = async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
    const filePath = path.join(uploadsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File not found'
      });
    }

    const stats = fs.statSync(filePath);
    res.status(200).json({
      filename,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      message: 'Error getting file info',
      error: error.message
    });
  }
};
