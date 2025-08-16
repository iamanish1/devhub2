import fs from 'fs';
import path from 'path';

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
