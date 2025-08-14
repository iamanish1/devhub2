# File Upload Integration Guide

This guide explains how the file upload system has been integrated into your MERN stack project, specifically for the ProjectListingPage and BidingPage.

## 🎯 Overview

The file upload system allows users to:
- Upload a cover image for their project
- Upload multiple project images (up to 10)
- Upload project documents (up to 20 files)
- View uploaded files in the project bidding page
- Download/view files with proper URLs

## 🏗️ Backend Implementation

### 1. Database Schema Updates

**File:** `Server/src/Model/ProjectListingModel.js`

Added new fields to store file information:

```javascript
Project_images: [{
  filename: String,
  originalName: String,
  url: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}],
Project_documents: [{
  filename: String,
  originalName: String,
  url: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}]
```

### 2. Controller Updates

**File:** `Server/src/controller/ListProjectController.js`

Updated to handle file uploads:

```javascript
// Handle uploaded files
const uploadedImages = req.namedFiles('Project_images') || [];
const uploadedDocuments = req.namedFiles('Project_documents') || [];
const coverImage = req.getFile('Project_cover_photo');

// Process uploaded images
const projectImages = uploadedImages.map(file => ({
  filename: file.filename,
  originalName: file.originalname,
  url: `/uploads/${file.filename}`,
  size: file.size
}));

// Process uploaded documents
const projectDocuments = uploadedDocuments.map(file => ({
  filename: file.filename,
  originalName: file.originalname,
  url: `/uploads/${file.filename}`,
  size: file.size
}));

// Process cover image
let coverPhotoUrl = Project_cover_photo;
if (coverImage) {
  coverPhotoUrl = `/uploads/${coverImage.filename}`;
}
```

### 3. Route Updates

**File:** `Server/src/Routes/ProjectListingRoutes.js`

Added file upload middleware:

```javascript
projectRoutes.post("/listproject", 
  authMiddleware, 
  uploadFields([
    { name: 'Project_cover_photo', maxCount: 1 },
    { name: 'Project_images', maxCount: 10 },
    { name: 'Project_documents', maxCount: 20 }
  ]), 
  ListProject 
)
```

## 🎨 Frontend Implementation

### 1. File Upload Component

**File:** `client/src/components/FileUploadField.jsx`

A reusable component that provides:
- Drag and drop functionality
- File preview for images
- File size validation
- Multiple file support
- Progress tracking

**Usage:**
```jsx
<FileUploadField
  label="Upload Project Images"
  name="Project_images"
  multiple={true}
  accept="image/*"
  maxSize={5}
  maxFiles={10}
  onFilesChange={handleFilesChange}
  showPreview={true}
/>
```

### 2. ProjectListingPage Updates

**File:** `client/src/pages/ProjectListingPage.jsx`

Updated to include file upload fields:

```jsx
// State for file management
const [coverImage, setCoverImage] = useState(null);
const [projectImages, setProjectImages] = useState([]);
const [projectDocuments, setProjectDocuments] = useState([]);

// File change handler
const handleFilesChange = (files, fieldName) => {
  switch (fieldName) {
    case 'Project_cover_photo':
      setCoverImage(files[0] || null);
      break;
    case 'Project_images':
      setProjectImages(files);
      break;
    case 'Project_documents':
      setProjectDocuments(files);
      break;
    default:
      break;
  }
};
```

### 3. BidingPage Updates

**File:** `client/src/pages/BidingPage.jsx`

Added sections to display uploaded files:

```jsx
{/* Project Images and Documents */}
{(project.Project_images?.length > 0 || project.Project_documents?.length > 0) && (
  <div className="bg-[#232323] rounded-xl p-6 border border-gray-700/50 mb-8">
    <h2 className="text-xl font-bold text-blue-400 mb-4">
      Project Files
    </h2>
    
    {/* Display images and documents */}
  </div>
)}
```

## 🔧 Configuration

### Environment Variables

Add to your `.env` file:

```env
# File Upload Configuration
UPLOADS_DRIVER=disk
UPLOADS_DIR=uploads
MAX_FILE_SIZE_MB=10
```

### File Validation

The system validates:
- **File Types**: Images (jpg, png, gif, webp), Documents (pdf, doc, docx, txt, csv), Archives (zip, rar)
- **File Sizes**: Configurable maximum size (default: 10MB)
- **File Count**: Maximum files per field (cover: 1, images: 10, documents: 20)

## 📁 File Storage

### Directory Structure

```
Server/
├── uploads/           # File storage directory
│   ├── image-123.jpg
│   ├── document-456.pdf
│   └── ...
├── src/
│   ├── Middleware/
│   │   └── upload.js  # Upload middleware
│   ├── controller/
│   │   └── ListProjectController.js
│   └── Routes/
│       └── ProjectListingRoutes.js
```

### File URLs

Files are accessible via:
- **Cover Image**: `http://localhost:8000/uploads/filename.jpg`
- **Project Images**: `http://localhost:8000/uploads/filename.png`
- **Documents**: `http://localhost:8000/uploads/document.pdf`

## 🚀 Usage Examples

### 1. Creating a Project with Files

1. Navigate to `/listproject`
2. Fill in project details
3. Upload cover image (optional)
4. Upload project images (optional, up to 10)
5. Upload project documents (optional, up to 20)
6. Submit the form

### 2. Viewing Project Files

1. Navigate to `/bidingPage/[project-id]`
2. Scroll to "Project Files" section
3. View uploaded images in a grid
4. Download documents by clicking the download icon

### 3. File Management

Files are automatically:
- Validated for type and size
- Stored with unique filenames
- Linked to the project in MongoDB
- Served statically by Express

## 🧪 Testing

### Run the Test Script

```bash
cd Server
node test-file-upload.js
```

This will verify:
- ✅ Multer installation
- ✅ Upload middleware
- ✅ Project model updates
- ✅ Controller file handling
- ✅ Route middleware integration
- ✅ Uploads directory
- ✅ Server integration

### Manual Testing

1. **Create Project with Files:**
   - Go to `http://localhost:3000/listproject`
   - Upload various file types
   - Submit the form

2. **View Project Files:**
   - Go to `http://localhost:3000/bidingPage/[project-id]`
   - Check "Project Files" section
   - Verify images display correctly
   - Test document downloads

3. **File Access:**
   - Direct file URLs: `http://localhost:8000/uploads/[filename]`
   - Verify files are accessible

## 🔒 Security Considerations

1. **File Type Validation**: Only allowed MIME types are accepted
2. **File Size Limits**: Prevents large file uploads
3. **Unique Filenames**: Generated to prevent conflicts
4. **Directory Traversal Protection**: Built into Multer
5. **Authentication**: File uploads require user authentication

## 🐛 Troubleshooting

### Common Issues

1. **"No files uploaded"**
   - Check if files are being sent with correct field names
   - Verify form has `enctype="multipart/form-data"`

2. **"File too large"**
   - Increase `MAX_FILE_SIZE_MB` in environment
   - Reduce file size before upload

3. **"Invalid file type"**
   - Check if file MIME type is in allowed list
   - Verify file extension matches content

4. **Files not displaying**
   - Check if server is serving `/uploads` directory
   - Verify file URLs are correct
   - Check MongoDB for file data

### Debug Steps

1. Check server logs for upload errors
2. Verify uploads directory exists and is writable
3. Test file access via direct URLs
4. Check MongoDB for stored file information

## 🔄 Future Enhancements

- **Cloud Storage**: Integration with S3, Cloudinary, or Google Cloud Storage
- **Image Processing**: Automatic resizing and optimization
- **File Compression**: Automatic compression for large files
- **Progress Tracking**: Real-time upload progress
- **Batch Operations**: Bulk file operations
- **File Versioning**: Multiple versions of the same file

## 📚 API Reference

### File Upload Endpoints

- `POST /api/project/listproject` - Create project with files
- `GET /api/project/getlistproject/:id` - Get project with file data
- `GET /uploads/:filename` - Access uploaded files

### File Data Structure

```javascript
{
  filename: "unique-filename.jpg",
  originalName: "my-image.jpg",
  url: "/uploads/unique-filename.jpg",
  size: 1024000,
  uploadedAt: "2024-01-01T00:00:00.000Z"
}
```

This integration provides a complete file upload solution that's secure, scalable, and user-friendly!
