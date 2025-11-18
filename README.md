# Nikhire - Campus Recruitment System

A comprehensive web-based campus recruitment platform that connects students with job opportunities and employers with talent. Now with a full-stack Node.js/Express backend with MongoDB database for secure user identity storage and data persistence.

## Key Features

- **User Authentication**: Secure registration and login with JWT tokens and password hashing
- **Database Storage**: MongoDB integration for persistent data storage
- **Job Listings**: Browse and apply for available job opportunities
- **Job Applications**: Apply for jobs and track application status
- **Student Profiles**: Create and manage student profiles with institution and occupation details
- **Task Management**: Admins can assign tasks to students
- **Admin Dashboard**: Full administrative control over jobs, tasks, and users
- **Multiple Institutions**: Support for 70+ Nigerian universities and institutions
- **Responsive Design**: Built with Tailwind CSS for responsive layout
- **RESTful API**: Complete backend API for all operations
- **Security**: Password hashing, JWT authentication, role-based access control

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Tailwind CSS for styling
- Single Page Application (SPA) architecture

### Backend
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcryptjs for password hashing
- CORS for cross-origin requests

### Database
- MongoDB (Local or Cloud - MongoDB Atlas)

## Getting Started

### Prerequisites

1. **Node.js** (v14+) - [Download](https://nodejs.org/)
2. **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
3. **Git** - [Download](https://git-scm.com/)

### Quick Start

**Windows Users (Easiest - Double-click one of these):**
- `start-nikhire.bat` - Batch script (auto-launches both servers)
- `start-nikhire.ps1` - PowerShell script (more control)

**Manual Setup:**

1. Clone the repository:
```bash
git clone https://github.com/Dave870-coder/NikHire.git
cd NikHire
```

2. Install dependencies:
```bash
npm install
```

3. **Terminal 1 - Start Backend (Port 3000):**
```bash
npm run server
```

4. **Terminal 2 - Start Frontend (Port 8000):**
```bash
npm run client
```

5. Open browser: `http://localhost:8000`

**Or run both together:**
```bash
npm run dev
```

**Database:** Automatically uses in-memory MongoDB (no installation needed!)

### Detailed Setup Instructions

For comprehensive backend setup instructions, see [BACKEND_SETUP.md](BACKEND_SETUP.md)

## Project Structure

```
NikHire/
├── index.html              # Main HTML file
├── server.js              # Express backend server
├── .env                   # Environment configuration
├── .gitignore             # Git ignore rules
├── package.json           # Node.js dependencies
├── README.md              # This file
├── BACKEND_SETUP.md       # Detailed backend setup guide
├── js/
│   ├── api-client.js      # API client for backend communication
│   └── app.js             # Frontend application logic
└── node_modules/          # Dependencies (not committed)
```

## Features Breakdown

### Student Features
- Register with secure password encryption
- Login with JWT token authentication
- View available jobs
- Apply for jobs with duplicate prevention
- Track application status (Applied, Reviewed, Accepted, Rejected)
- Update profile (institution, occupation, profile image)
- View assigned tasks with due dates
- Add new institutions to the system

### Admin Features
- View all registered users with details
- View all job applications from students
- Create and manage job postings
- Assign tasks to individual students
- Monitor system activity
- Full data management capabilities

## Database Schema

The application uses MongoDB with the following collections:

### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'student' | 'admin',
  institution: String,
  occupation: String,
  profileImage: String,
  createdAt: Date
}
```

### Jobs
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  description: String,
  createdBy: ObjectId (User),
  createdAt: Date
}
```

### Applications
```javascript
{
  _id: ObjectId,
  userId: ObjectId (User),
  jobId: ObjectId (Job),
  jobTitle: String,
  company: String,
  status: 'Applied' | 'Reviewed' | 'Accepted' | 'Rejected',
  appliedAt: Date
}
```

### Tasks
```javascript
{
  _id: ObjectId,
  studentId: ObjectId (User),
  description: String,
  dueDate: Date,
  status: 'Pending' | 'In Progress' | 'Completed',
  assignedBy: ObjectId (User),
  createdAt: Date
}
```

### Institutions
```javascript
{
  _id: ObjectId,
  name: String (unique),
  createdAt: Date
}
```

## API Endpoints

### Authentication (`/api/auth/`)
- `POST /register` - Register new user
- `POST /login` - Login and receive JWT token
- `GET /me` - Get current user profile (requires auth)

### Users (`/api/users/`)
- `GET /` - Get all users (requires auth)
- `PUT /:id` - Update user profile

### Jobs (`/api/jobs/`)
- `GET /` - Get all jobs
- `POST /` - Create new job (requires auth)

### Applications (`/api/applications/`)
- `GET /` - Get user's applications (requires auth)
- `GET /all` - Get all applications (requires auth)
- `POST /` - Apply for a job (requires auth)

### Tasks (`/api/tasks/`)
- `GET /` - Get user's tasks (requires auth)
- `POST /` - Assign task to student (requires auth)

### Institutions (`/api/institutions/`)
- `GET /` - Get all institutions
- `POST /` - Add new institution (requires auth)

## Testing

### Test User Flow
1. Register a new student account
2. Login with your credentials
3. Browse available jobs
4. Apply for a job
5. Update your profile information
6. View your applications

### Test Admin Flow
1. Register an admin account (requires database modification)
2. Access admin dashboard
3. Create a job posting
4. View all users and applications
5. Assign tasks to students

## Environment Configuration

The `.env` file contains important configuration:

```env
PORT=5000                                    # Backend server port
NODE_ENV=development                         # Environment mode
MONGODB_URI=mongodb://localhost:27017/nikhire  # Database connection
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CORS_ORIGIN=http://localhost:8000           # Frontend origin for CORS
```

⚠️ **Important**: Change `JWT_SECRET` in production to a strong random string!

## Security Features

✅ **Implemented:**
- Password hashing with bcryptjs (10 salt rounds)
- JWT token-based authentication (7-day expiration)
- Role-based access control (student, admin)
- CORS protection
- Input validation on backend
- Mongoose schema validation

⚠️ **For Production, Additionally Implement:**
- HTTPS/TLS encryption
- Rate limiting on API endpoints
- API key authentication for external services
- Database backup and recovery
- Comprehensive input sanitization
- Request size limits
- Security headers (helmet.js)
- SQL injection prevention (already handled by Mongoose)

## Troubleshooting

### MongoDB Connection Error
```
✗ MongoDB connection error: connect ECONNREFUSED
```
**Solution:** Ensure MongoDB is running with `mongod` command

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Change PORT in `.env` or kill the process using the port

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Verify `CORS_ORIGIN` in `.env` matches your frontend URL

### Token Expired Error
```
Invalid token
```
**Solution:** Login again - tokens expire after 7 days

## Running on Different Machines

### Change MongoDB Connection
If MongoDB is on a different machine:
```env
MONGODB_URI=mongodb://192.168.x.x:27017/nikhire
```

### Change Frontend/Backend URLs
Update the API client base URL in the frontend:
```javascript
const apiClient = new APIClient('http://your-server:5000');
```

## Deployment

### Deploy to Heroku
1. Create Heroku account
2. Install Heroku CLI
3. Add Procfile to project
4. Deploy: `git push heroku main`

### Deploy to AWS/Google Cloud
See deployment guides for each platform

### Use MongoDB Atlas
1. Create free cluster at https://www.mongodb.com/cloud/atlas
2. Update `MONGODB_URI` with connection string
3. Whitelist IP addresses

## Future Enhancements

- Email notifications for applications
- Resume upload and parsing
- Interview scheduling system
- Advanced job search and filtering
- Student analytics dashboard
- LinkedIn integration
- Mobile app (React Native)
- Two-factor authentication
- Video interview support
- AI-powered job recommendations

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is open source and available under the MIT License.

## Contact & Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Check [BACKEND_SETUP.md](BACKEND_SETUP.md) for detailed guidance

---

**Built with ❤️ for campus recruitment**
