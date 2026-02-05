# Dependency Setup Guide

This document lists all dependencies and setup requirements for the BlackMatter ERP system.

## Backend Dependencies

### Required Services

1. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Get your project URL and API keys from Settings > API
   - Run the database schema from `backend/src/database/schema.sql` in the Supabase SQL Editor

2. **Redis Instance**
   - Option 1: Local Redis (for development)
     ```bash
     # macOS
     brew install redis
     brew services start redis
     
     # Linux
     sudo apt-get install redis-server
     sudo systemctl start redis
     
     # Docker
     docker run -d -p 6379:6379 redis:alpine
   ```
   - Option 2: Redis Cloud (free tier available)
     - Sign up at https://redis.com/try-free/
     - Get connection details

3. **SMS Provider (Optional - for Phone OTP)**
   - Phone OTP is handled by Supabase Auth (FREE!)
   - Configure SMS provider in Supabase Dashboard:
     - Go to Authentication > Providers > Phone
     - Choose: Twilio, MessageBird, Vonage, or custom
   - For development, OTPs will be logged to console if not configured
   - See [SUPABASE_PHONE_AUTH.md](./SUPABASE_PHONE_AUTH.md) for setup guide

### Backend Package Installation

```bash
cd backend
npm install
```

## Frontend Dependencies

### Frontend Package Installation

```bash
cd frontend
npm install
```

## Environment Variables

### Backend (.env)

Create `backend/.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10
OTP_LENGTH=6

# Twilio Configuration (Optional for development)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Application Configuration
APP_NAME=BlackMatter ERP
APP_URL=http://localhost:5173
API_URL=http://localhost:3001
```

### Frontend (.env)

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:3001/api
```

## Database Setup

1. **Run Supabase Schema**
   - Go to Supabase Dashboard > SQL Editor
   - Copy and paste the contents of `backend/src/database/schema.sql`
   - Execute the script

2. **Verify Tables**
   - Check that all tables are created in Supabase Dashboard > Table Editor

## Running the Application

### Development Mode

1. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (in a new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Production Build

1. **Build Backend**
   ```bash
   cd backend
   npm run build
   npm start
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   # Serve the dist folder with your preferred server
   ```

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check Redis host and port in `.env`

### Supabase Connection Issues
- Verify your Supabase URL and keys are correct
- Check that RLS policies allow your operations
- Ensure database schema is applied

### OTP Not Sending
- Check Twilio credentials (if using)
- In development, check console logs for OTP codes
- Verify phone number format

### Authentication Issues
- Clear browser localStorage
- Check backend logs for errors
- Verify JWT_SECRET is set

## Additional Notes

- For development, you can use mock OTPs (they'll be logged to console)
- Redis caching is optional but recommended for performance
- Supabase provides free tier with generous limits
- Twilio free tier includes trial credits for SMS
