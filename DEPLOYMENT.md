# NikHire - Professional Deployment Guide

## Overview
NikHire is a professional campus recruitment system that can handle millions of users with proper database configuration and deployment setup. This guide covers production deployment, security best practices, and scalability recommendations.

---

## 1. Database Setup for Production

### Option A: MongoDB Atlas (Recommended for Cloud Deployment)

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account
   - Create a new project

2. **Create a Cluster**
   - Choose a cloud provider (AWS, Google Cloud, Azure)
   - Select a region close to your users
   - Choose M10 or higher tier for production (M0 has limitations)

3. **Enable Authentication**
   - Create a database user with strong password
   - Whitelist your IP address(es)
   - Note your connection string

4. **Configure Connection String**
   ```
   mongodb+srv://username:password@cluster-name.mongodb.net/nikhire?retryWrites=true&w=majority
   ```

### Option B: Self-Hosted MongoDB

1. **Install MongoDB** (Ubuntu/Linux)
   ```bash
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

2. **Enable Authentication**
   ```javascript
   use admin
   db.createUser({ user: "nikhire_user", pwd: "strong_password", roles: ["root"] })
   ```

3. **Enable Replication** for redundancy
   ```javascript
   rs.initiate()
   ```

### Index Optimization for 7 Million Users

The application automatically creates the following indexes:
- Single field indexes: `email`, `role`, `institution`, `documentApproved`, `isActive`, `createdAt`
- Compound indexes: `(role, documentApproved)`, `(institution, role)`, `createdAt DESC`

**For even better performance with millions of users**, consider:
```javascript
db.users.createIndex({ email: 1, institution: 1 })
db.users.createIndex({ role: 1, createdAt: -1 })
db.users.createIndex({ documentApproved: 1, createdAt: -1 })
db.users.createIndex({ skills: 1 })
db.jobs.createIndex({ createdBy: 1, createdAt: -1 })
db.applications.createIndex({ userId: 1, jobId: 1 })
```

### Sharding Configuration (for 7M+ users)

Enable sharding on the database:
```javascript
sh.enableSharding("nikhire")
sh.shardCollection("nikhire.users", { email: 1 })
sh.shardCollection("nikhire.jobs", { createdBy: 1 })
sh.shardCollection("nikhire.applications", { userId: 1 })
```

---

## 2. File Storage for CV/Documents

### Option A: Local Disk (Development Only)
- Files stored in `./uploads` directory
- **NOT suitable for production** (server restarts lose files)

### Option B: AWS S3 (Recommended)

1. **Create S3 Bucket**
   ```bash
   aws s3api create-bucket --bucket nikhire-documents --region us-east-1
   ```

2. **Install AWS SDK**
   ```bash
   npm install aws-sdk
   ```

3. **Update server.js** to use S3:
   ```javascript
   const AWS = require('aws-sdk');
   const s3 = new AWS.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY,
     secretAccessKey: process.env.AWS_SECRET_KEY
   });

   // Replace multer storage with S3
   const upload = multer({ storage: multer.memoryStorage() });

   app.post('/api/users/:id/upload-document', verifyToken, upload.single('document'), async (req, res) => {
     const s3Params = {
       Bucket: process.env.AWS_BUCKET,
       Key: `documents/${req.params.id}/${Date.now()}-${req.file.originalname}`,
       Body: req.file.buffer
     };
     
     s3.upload(s3Params, (err, data) => {
       // Handle response
     });
   });
   ```

### Option C: Google Cloud Storage
Similar to AWS S3, use `@google-cloud/storage` package.

---

## 3. Environment Variables (.env)

```env
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nikhire?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# CORS
CORS_ORIGIN=https://yourdomain.com

# File Storage (if using S3)
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_BUCKET=nikhire-documents

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 4. Deployment Options

### Option A: Heroku (Easiest)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create nikhire-app
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="your_mongodb_atlas_uri"
   heroku config:set JWT_SECRET="your_secret_key"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

### Option B: DigitalOcean (VPS)

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Select 2GB RAM minimum (4GB+ for production)
   - Add your SSH key

2. **Initial Setup**
   ```bash
   ssh root@your_droplet_ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt install -y nodejs
   
   # Install MongoDB (if self-hosting)
   apt install -y mongodb
   
   # Install Nginx
   apt install -y nginx
   ```

3. **Configure Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Setup SSL with Let's Encrypt**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d yourdomain.com
   ```

5. **Deploy Application**
   ```bash
   cd /var/www
   git clone https://github.com/your_username/NikHire.git
   cd NikHire
   npm install --production
   ```

6. **Setup PM2 for Process Management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name nikhire
   pm2 startup
   pm2 save
   ```

### Option C: AWS EC2 (Enterprise)

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.medium or larger
   - Security Group: Allow ports 80, 443, 3000

2. **Same setup as DigitalOcean** (Option B above)

3. **Additional AWS Services**
   - **RDS**: Managed MongoDB compatible service
   - **S3**: For document storage
   - **CloudFront**: CDN for static assets
   - **Route53**: DNS management

---

## 5. API Communication Best Practices

### Secure Communication

1. **Use HTTPS Only** (in production)
   - All requests must be encrypted
   - Use valid SSL certificate (Let's Encrypt is free)

2. **API Keys & Authentication**
   ```javascript
   // Header format
   Authorization: Bearer <JWT_TOKEN>
   
   // Token includes user ID and role
   {
     "userId": "...",
     "role": "student|admin|organization",
     "iat": 1234567890,
     "exp": 1234567890
   }
   ```

3. **Rate Limiting** (enabled by default)
   - Auth endpoints: 5 requests per 15 minutes per IP
   - General API: 100 requests per minute per IP
   - Disable in development with `NODE_ENV=development`

4. **CORS Configuration**
   ```javascript
   // In production, specify exact origin
   CORS_ORIGIN=https://yourdomain.com
   
   // Not: *
   ```

### Error Handling

All API responses follow standard format:
```json
{
  "success": true|false,
  "message": "...",
  "user": {...},
  "pagination": {...}
}
```

### Pagination for Large Datasets

The user list endpoint supports pagination:
```
GET /api/users?page=1&limit=20&role=student&status=pending&sort=-createdAt
```

Response:
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 7000000,
    "pages": 350000
  }
}
```

---

## 6. Performance Optimization

### Database Optimization
- Use connection pooling (Mongoose does this by default)
- Enable read replicas for heavy read operations
- Use caching layer (Redis) for frequently accessed data

### API Optimization
- Use pagination (limit default 20, max 100)
- Add response compression with gzip
- Cache responses with ETags

### Frontend Optimization
- Lazy load images and data
- Use service workers for offline support
- Implement infinite scroll instead of pagination

### Recommended nginx settings:
```nginx
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_comp_level 6;

client_max_body_size 50M;

# Connection pooling
upstream nikhire {
    least_conn;
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```

---

## 7. Scaling for 7 Million Users

### Phase 1: Up to 100,000 users
- MongoDB Atlas M10 tier
- Single Node.js server (t3.large)
- Local file storage or S3

### Phase 2: 100,000 - 1 Million users
- MongoDB Atlas M30+ with sharding
- 2-3 Node.js servers behind load balancer
- S3 for all documents
- Redis cache layer
- CDN for static assets

### Phase 3: 1 Million - 7 Million users
- MongoDB Atlas M50+ with multiple shards
- 5-10 Node.js servers with auto-scaling
- ElasticSearch for user search
- Redis cluster for caching
- Dedicated CDN (CloudFront/Cloudflare)
- Separate analytics database

### Load Testing
```bash
# Install Apache Bench
apt install apache2-utils

# Test endpoint
ab -n 10000 -c 100 https://yourdomain.com/api/users
```

---

## 8. Security Checklist

- [ ] Use HTTPS/SSL everywhere
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Enable MongoDB authentication
- [ ] Whitelist database IPs
- [ ] Use environment variables for secrets
- [ ] Implement rate limiting
- [ ] Validate all inputs server-side
- [ ] Sanitize user input (prevent XSS/injection)
- [ ] Use CORS restrictively
- [ ] Enable database backups (daily minimum)
- [ ] Monitor logs and errors (Sentry)
- [ ] Setup DDoS protection (Cloudflare)
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 9. Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-auto-pull
pm2 web  # Access at http://localhost:9615

# Or use Sentry for error tracking
npm install @sentry/node
```

### Log Aggregation
```bash
# Install Winston logger
npm install winston

# Log to file and external service (ELK stack, Datadog)
```

### Database Monitoring
- MongoDB Atlas provides built-in monitoring
- Set up alerts for slow queries
- Monitor disk usage and connection count

---

## 10. Maintenance & Updates

### Database Backups
```bash
# MongoDB Atlas: Automatic daily backups (included)

# Self-hosted MongoDB:
mongodump --uri "mongodb://..." --out ./backup
```

### Application Updates
```bash
git pull origin main
npm install
npm audit fix
pm2 restart nikhire
```

### Dependency Updates
```bash
npm outdated          # Check for updates
npm update           # Update all
npm audit fix        # Fix vulnerabilities
```

---

## Quick Start Command

**Development:**
```bash
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:8000
```

**Production:**
```bash
npm run server
# Runs on configured PORT (default 3000)
# Requires HTTPS via reverse proxy (Nginx/Apache)
```

---

## Support & Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Ensure network connectivity

**CORS Error**
- Update CORS_ORIGIN to match frontend URL
- Include credentials: true in fetch requests

**File Upload Error**
- Check file size limits (10MB default)
- Verify S3 bucket permissions
- Check disk space for local uploads

**High Memory Usage**
- Enable MongoDB connection pooling
- Implement pagination properly
- Add caching layer (Redis)

---

## Contacts & Resources

- MongoDB Atlas: https://cloud.mongodb.com
- Heroku: https://www.heroku.com
- DigitalOcean: https://www.digitalocean.com
- AWS: https://aws.amazon.com
- Let's Encrypt: https://letsencrypt.org

---

**Last Updated:** November 23, 2025
**Version:** 1.0.0
