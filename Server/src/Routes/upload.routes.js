import express from 'express';
import { acceptUpload, deleteFile, getFileInfo } from '../controller/upload.controller.js';
import { withUpload } from '../Middleware/upload.js';

const uploadRoutes = express.Router();

// Universal upload endpoint - accepts any files
uploadRoutes.post('/uploads', ...withUpload('any'), acceptUpload);

// Single file upload endpoint
uploadRoutes.post('/uploads/single/:fieldName', (req, res, next) => {
  const fieldName = req.params.fieldName;
  const uploadSingle = withUpload(`single:${fieldName}`);
  uploadSingle[0](req, res, next);
}, acceptUpload);

// Multiple files upload endpoint
uploadRoutes.post('/uploads/multiple', (req, res, next) => {
  const fields = req.body.fields || [{ name: 'files', maxCount: 10 }];
  const uploadFields = withUpload(fields);
  uploadFields[0](req, res, next);
}, acceptUpload);

// Delete file endpoint
uploadRoutes.delete('/uploads/:filename', deleteFile);

// Get file info endpoint
uploadRoutes.get('/uploads/:filename/info', getFileInfo);

export default uploadRoutes;
