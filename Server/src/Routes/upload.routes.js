import express from 'express';
import { acceptUpload, deleteFile, getFileInfo, uploadChatFile } from '../controller/upload.controller.js';
import { uploadSingle, uploadAny, uploadFields, normalizeFiles } from '../Middleware/upload.js';
import authMiddleware from '../Middleware/authenticateMiddelware.js';

const uploadRoutes = express.Router();

// Universal upload endpoint - accepts any files
uploadRoutes.post('/uploads', authMiddleware, uploadAny(), normalizeFiles, acceptUpload);

// Single file upload endpoint
uploadRoutes.post('/uploads/single/:fieldName', authMiddleware, (req, res, next) => {
  const fieldName = req.params.fieldName;
  uploadSingle(fieldName)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    normalizeFiles(req, res, next);
  });
}, acceptUpload);

// Multiple files upload endpoint
uploadRoutes.post('/uploads/multiple', authMiddleware, (req, res, next) => {
  const fields = req.body.fields || [{ name: 'files', maxCount: 10 }];
  uploadFields(fields)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    normalizeFiles(req, res, next);
  });
}, acceptUpload);

// Chat file upload endpoint
uploadRoutes.post('/chat-file', authMiddleware, uploadSingle('file'), uploadChatFile);

// Delete file endpoint
uploadRoutes.delete('/uploads/:filename', authMiddleware, deleteFile);

// Get file info endpoint
uploadRoutes.get('/uploads/:filename/info', authMiddleware, getFileInfo);

export default uploadRoutes;
