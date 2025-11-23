const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (try real DB first, fall back to in-memory)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nikhire';

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ MongoDB connected');
    return { type: 'real', uri: MONGODB_URI };
  } catch (err) {
    console.warn('✗ MongoDB connection failed:', err.message);
    console.warn('→ Falling back to in-memory MongoDB (mongodb-memory-server)');

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ Connected to in-memory MongoDB');
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
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'organization'],
    default: 'student'
  },
  institution: String,
  occupation: String,
  profileImage: String,
  cv: String,
  cvFilename: String,
  skills: [String],
  experience: String,
  companyName: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

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
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ==================== AUTHENTICATION ROUTES ====================

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, institution, occupation, profileImage, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'student',
      institution: institution || '',
      occupation: occupation || '',
      profileImage: profileImage || '',
      companyName: companyName || ''
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        occupation: user.occupation
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Current User
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get All Users (Admin)
app.get('/api/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

const PORT = process.env.PORT || 5000;

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

startServer();
