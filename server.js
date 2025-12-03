const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

// Load environment variables first
dotenv.config();

// S3 config (after dotenv.config())
let s3 = null;
let useS3 = false;
if (process.env.USE_S3 === 'true') {
  try {
    const AWS = require('aws-sdk');
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });
    s3 = new AWS.S3();
    useS3 = true;
  } catch (err) {
    console.warn('⚠ S3 not configured, using disk/GridFS');
  }
}

const app = express();

// Apply middleware
app.use(cookieParser());


// CORS configuration - more restrictive for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

app.use('/api/', apiLimiter);

// Multer configuration for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage for multer so we can route uploads to GridFS or disk as needed
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max for CVs
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT are allowed'));
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// GridFS bucket placeholder - will be created after DB connection
let gridfsBucket = null;

// Helper: initialize GridFS if requested
async function initGridFS() {
  const useGridFS = process.env.USE_GRIDFS === 'true';
  if (!useGridFS) return;
  try {
    await mongoose.connection; // ensure connection
    const db = mongoose.connection.db;
    gridfsBucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'uploads' });
    console.log('✓ GridFS bucket initialized');
  } catch (err) {
    console.warn('✗ GridFS initialization failed:', err.message);
    gridfsBucket = null;
  }
}

// MongoDB Connection (try real DB first, fall back to in-memory)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nikhire';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ MongoDB connected');
    // initialize GridFS if configured
    await initGridFS();
    return { type: 'real', uri: MONGODB_URI };
  } catch (err) {
    console.warn('✗ MongoDB connection failed:', err.message);
    console.warn('→ Falling back to in-memory MongoDB (mongodb-memory-server)');

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to in-memory MongoDB');
    await initGridFS();
    return { type: 'memory', uri };
  }
}

// ==================== DATABASE SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'organization'],
    default: 'student',
    index: true
  },
  institution: {
    type: String,
    index: true
  },
  occupation: String,
  profileImage: String,
  cv: String,
  cvFilename: String,
  skills: [String],
  experience: String,
  companyName: String,
  documentSubmittedAt: Date,
  documentApproved: {
    type: Boolean,
    default: false,
    index: true
  },
  documentReviewNotes: String,
  cvPath: String,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Refresh token (server-side stored for revocation/rotation)
userSchema.add({
  refreshTokenHash: {
    type: String,
    default: null
  }
});

// Create compound indexes for efficient querying
userSchema.index({ role: 1, documentApproved: 1 });
userSchema.index({ institution: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(password) {
  return await bcryptjs.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Job Schema
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Optional array of requirements for the job
  requirements: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Job = mongoose.model('Job', jobSchema);

// Application Schema
const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: String,
  company: String,
  status: {
    type: String,
    enum: ['Applied', 'Reviewed', 'Accepted', 'Rejected'],
    default: 'Applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

const Application = mongoose.model('Application', applicationSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);

// Institution Schema
const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Institution = mongoose.model('Institution', institutionSchema);

// ==================== MIDDLEWARE ====================

// Verify JWT Token
// ==================== MIDDLEWARE ====================

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided', success: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', success: false });
    }
    res.status(401).json({ message: 'Invalid token', success: false });
  }
};

// Admin-only middleware
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Admin access required', success: false });
  }
  next();
};

// Admin or Organization middleware
const verifyAdminOrOrg = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'organization') {
    return res.status(403).json({ message: 'Admin or Organization access required', success: false });
  }
  next();
};

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, institution, occupation, profileImage, companyName } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email and password are required', 
        success: false 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long', 
        success: false 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered', 
        success: false 
      });
    }

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'student',
      institution: institution || '',
      occupation: occupation || '',
      profileImage: profileImage || '',
      companyName: companyName || '',
      isActive: true
    });

    await user.save();
    // Create JWT token with role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    // Create refresh token and persist hash for rotation/revocation
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'your_secret_key'),
      { expiresIn: '30d' }
    );
    const refreshTokenHash = await bcryptjs.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // Set HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'User registered successfully',
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        occupation: user.occupation,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: error.message || 'Registration failed', 
      success: false 
    });
  }
});

// Login User
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required', 
        success: false 
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password', 
        success: false 
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Account is inactive', 
        success: false 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid email or password', 
        success: false 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    // Create and persist refresh token
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'your_secret_key'),
      { expiresIn: '30d' }
    );
    const refreshTokenHash = await bcryptjs.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    // Set HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        occupation: user.occupation,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Login failed', 
      success: false 
    });
  }
});

// Get Current User
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// ==================== USER ROUTES ====================

// Get All Users (Admin/Organization - with pagination, filtering, search)
app.get('/api/users', verifyToken, verifyAdminOrOrg, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, q, sort = '-createdAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (status === 'approved') filter.documentApproved = true;
    if (status === 'pending') filter.documentApproved = false;
    
    // Search in name and email
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { occupation: { $regex: q, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Get Single User Profile (Admin View with CV)
app.get('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update User Profile
app.put('/api/users/:id', verifyToken, async (req, res) => {
  try {
    const { institution, occupation, profileImage, cv, cvFilename, skills, experience, companyName } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { institution, occupation, profileImage, cv, cvFilename, skills, experience, companyName },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Upload CV/Document (Student)
app.post('/api/users/:id/upload-document', verifyToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded', success: false });
    }

    const originalName = req.file.originalname;
    const mimeType = req.file.mimetype;

    let savedPath = null;
    let gridfsId = null;
    let s3Url = null;

    if (useS3 && s3) {
      // Upload to S3
      const s3Key = `documents/${req.params.id}/${Date.now()}-${originalName}`;
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: mimeType,
        ACL: 'private'
      };
      try {
        const result = await s3.upload(params).promise();
        s3Url = result.Location;
        savedPath = s3Url;
      } catch (err) {
        return res.status(500).json({ message: 'S3 upload failed: ' + err.message, success: false });
      }
    } else if (gridfsBucket) {
      // Write buffer to GridFS
      const uploadStream = gridfsBucket.openUploadStream(originalName, { contentType: mimeType });
      const readable = new Readable();
      readable.push(req.file.buffer);
      readable.push(null);
      readable.pipe(uploadStream);

      await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => {
          gridfsId = uploadStream.id;
          resolve();
        });
        uploadStream.on('error', reject);
      });

      savedPath = gridfsId ? gridfsId.toString() : null;
    } else {
      // Fallback: write to disk
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'document-' + uniqueSuffix + path.extname(originalName);
      const fullPath = path.join(uploadsDir, filename);
      fs.writeFileSync(fullPath, req.file.buffer);
      savedPath = fullPath;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        cvFilename: originalName,
        cvPath: savedPath,
        documentSubmittedAt: new Date(),
        documentApproved: false
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Document uploaded successfully',
      success: true,
      user,
      file: {
        originalName,
        size: req.file.size,
        stored: savedPath,
        gridfs: gridfsId ? true : false,
        s3: !!s3Url,
        s3Url
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Approve/Reject Document (Admin/Organization)
app.put('/api/users/:id/approve-document', verifyToken, verifyAdminOrOrg, async (req, res) => {
  try {
    const { approved, reviewNotes } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ message: 'Approval status is required', success: false });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        documentApproved: approved,
        documentReviewNotes: reviewNotes || null
      },
      { new: true }
    ).select('-password');

    res.json({
      message: `Document ${approved ? 'approved' : 'rejected'} successfully`,
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Serve user document (stream from GridFS or static file)
app.get('/api/users/:id/document', verifyToken, verifyAdminOrOrg, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('cvFilename cvPath');
    if (!user) return res.status(404).json({ message: 'User not found', success: false });

    if (gridfsBucket && user.cvPath) {
      // cvPath stored as GridFS file id
      const fileId = new mongoose.Types.ObjectId(user.cvPath);
      const downloadStream = gridfsBucket.openDownloadStream(fileId);
      res.setHeader('Content-Disposition', `attachment; filename="${user.cvFilename || 'document'}"`);
      downloadStream.pipe(res);
      downloadStream.on('error', err => res.status(500).json({ message: err.message, success: false }));
      return;
    }

    // Fallback to static file
    if (user.cvPath && fs.existsSync(user.cvPath)) {
      return res.download(user.cvPath, user.cvFilename || undefined);
    }

    res.status(404).json({ message: 'No document found for user', success: false });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// ==================== REFRESH TOKENS & LOGOUT ====================

// Refresh access token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required', success: false });

    // Verify refresh token signature
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'your_secret_key'));
    } catch (err) {
      return res.status(401).json({ message: 'Invalid refresh token', success: false });
    }

    const user = await User.findById(payload.userId);
    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ message: 'Refresh token invalid or revoked', success: false });
    }
    const match = await bcryptjs.compare(refreshToken, user.refreshTokenHash);
    if (!match) {
      return res.status(401).json({ message: 'Refresh token invalid or revoked', success: false });
    }

    // Rotate refresh token: issue new access token + new refresh token
    const newToken = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '7d' });
    const newRefreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET || 'your_secret_key'),
      { expiresIn: '30d' }
    );
    user.refreshTokenHash = await bcryptjs.hash(newRefreshToken, 10);
    await user.save();

    // Set new HttpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, token: newToken });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// Logout (revoke refresh token)
app.post('/api/auth/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refreshTokenHash = null;
      await user.save();
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message, success: false });
  }
});

// ==================== JOB ROUTES ====================

// Get All Jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().populate('createdBy', 'name email');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Job (Admin)
app.post('/api/jobs', verifyToken, async (req, res) => {
  try {
    const { title, company, description, requirements } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const job = new Job({
      title,
      company,
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? String(requirements).split(',').map(s => s.trim()).filter(Boolean) : []),
      createdBy: req.userId
    });

    await job.save();
    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== APPLICATION ROUTES ====================

// Get User Applications
app.get('/api/applications', verifyToken, async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.userId })
      .populate('jobId')
      .populate('userId', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Applications (Admin)
app.get('/api/applications/all', verifyToken, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('jobId')
      .populate('userId', 'name email');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for Job
app.post('/api/applications', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    const existingApplication = await Application.findOne({
      userId: req.userId,
      jobId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied for this job' });
    }

    const job = await Job.findById(jobId);
    const application = new Application({
      userId: req.userId,
      jobId,
      jobTitle: job.title,
      company: job.company,
      status: 'Applied'
    });

    await application.save();
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TASK ROUTES ====================

// Get User Tasks
app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ studentId: req.userId })
      .populate('assignedBy', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Task (Admin)
app.post('/api/tasks', verifyToken, async (req, res) => {
  try {
    const { studentId, description, dueDate } = req.body;

    if (!studentId || !description || !dueDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const task = new Task({
      studentId,
      description,
      dueDate,
      assignedBy: req.userId,
      status: 'Pending'
    });

    await task.save();
    res.status(201).json({
      message: 'Task assigned successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== INSTITUTION ROUTES ====================

// Get All Institutions
app.get('/api/institutions', async (req, res) => {
  try {
    const institutions = await Institution.find();
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Institution
app.post('/api/institutions', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Institution name is required' });
    }

    const institution = new Institution({ name });
    await institution.save();

    res.status(201).json({
      message: 'Institution added successfully',
      institution
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Institution already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// ==================== INITIALIZATION ====================

// Initialize default institutions
const initializeInstitutions = async () => {
  try {
    const count = await Institution.countDocuments();
    if (count === 0) {
      const institutions = [
        "Ahmadu Bello University",
        "Babcock University",
        "Bayero University",
        "Covenant University",
        "Federal University of Technology, Akure",
        "Lagos State University",
        "Nigerian Defence Academy",
        "Nnamdi Azikiwe University",
        "Obafemi Awolowo University",
        "University of Abuja",
        "University of Benin",
        "University of Calabar",
        "University of Ibadan",
        "University of Ilorin",
        "University of Jos",
        "University of Lagos",
        "University of Maiduguri",
        "University of Nigeria",
        "University of Port Harcourt",
        "University of Uyo"
      ];

      await Institution.insertMany(institutions.map(name => ({ name })));
      console.log('✓ Default institutions initialized');
    }
  } catch (error) {
    console.log('Institution initialization error:', error.message);
  }
};

// ==================== ERROR HANDLING ====================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ==================== START SERVER ====================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    await initializeInstitutions();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();
