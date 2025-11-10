# Al Najah Backend

This is an Express + MongoDB backend providing authentication, product management, categories, and inquiry handling for the Al Najah Company website.

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Required:
- PORT=4000
- MONGO_URI=mongodb://localhost:27017/alnajah
- JWT_SECRET=your_jwt_secret
- TOKEN_EXPIRES_IN=7d

### Optional - Email Notifications:
- EMAIL_SERVICE=gmail (or leave empty for custom SMTP)
- EMAIL_USER=your-email@gmail.com
- EMAIL_PASS=your-app-password
- ADMIN_EMAIL=admin@alnajah.com

**To enable email notifications for inquiries:**
1. Use Gmail with an [App Password](https://support.google.com/accounts/answer/185833)
2. Set EMAIL_SERVICE=gmail, EMAIL_USER, and EMAIL_PASS
3. Inquiries will automatically send notifications to ADMIN_EMAIL

### Optional - AWS S3 for Image Uploads:
- AWS_ACCESS_KEY_ID=your-key
- AWS_SECRET_ACCESS_KEY=your-secret
- AWS_REGION=us-east-1
- AWS_BUCKET_NAME=your-bucket

## Available Endpoints

### Authentication:
- POST /api/auth/register  -> { email, password, role }
- POST /api/auth/login     -> { email, password }
- GET /api/auth/me         -> (requires Bearer token)

### Categories (admin only):
- GET /api/categories
- POST /api/categories
- PATCH /api/categories/:id
- DELETE /api/categories/:id

### Products (admin only):
- GET /api/products
- POST /api/products
- PATCH /api/products/:id
- DELETE /api/products/:id

### Inquiries:
- POST /api/inquiries (public - sends email notification)
- GET /api/inquiries (admin only)
- PATCH /api/inquiries/:id (admin only - update status)

## Run Locally

```powershell
cd backend
npm install
# Configure .env file
npm run dev
```

**Note:** You need MongoDB running locally or use MongoDB Atlas with MONGO_URI.
