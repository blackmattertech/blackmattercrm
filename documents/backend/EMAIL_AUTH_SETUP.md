# Email & Password Authentication Setup

The system now uses **email and password authentication** with Supabase - no external services required!

## ✅ What Changed

- ✅ **Email/Password** instead of Phone OTP
- ✅ **No external services** needed (Twilio, MessageBird, etc.)
- ✅ **Built-in Supabase Auth** - completely free
- ✅ **Signup and Login** forms
- ✅ **Secure password hashing** handled by Supabase

## 🚀 Quick Start

### Step 1: Enable Email Auth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Find **Email** provider
5. Make sure it's **enabled** (should be enabled by default)
6. Configure settings:
   - **Enable email confirmations**: Optional (recommended for production)
   - **Secure email change**: Optional
   - Click **Save**

### Step 2: Update Database Schema

Run this SQL in Supabase SQL Editor to update the user_profiles table:

```sql
-- Add email column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Make phone optional (remove NOT NULL constraint if exists)
ALTER TABLE user_profiles 
ALTER COLUMN phone DROP NOT NULL;

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) 
WHERE email IS NOT NULL;
```

### Step 3: Test Authentication

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test signup:**
   - Go to http://localhost:5173
   - Click "Sign Up" tab
   - Enter email, password, and name
   - Click "Create Account"

4. **Test login:**
   - Use the email and password you just created
   - Click "Sign In"

## 📝 API Endpoints

### Signup
```bash
POST /api/auth/signup
Body: {
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",  // optional
  "role": "sales"            // optional, defaults to "sales"
}
```

### Login
```bash
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
```

### Get Current User
```bash
GET /api/auth/me
Headers: {
  "Authorization": "Bearer <token>"
}
```

### Logout
```bash
POST /api/auth/logout
Headers: {
  "Authorization": "Bearer <token>"
}
```

## 🔒 Security Features

- ✅ **Password hashing** - Handled by Supabase (bcrypt)
- ✅ **JWT tokens** - Secure session management
- ✅ **Email validation** - Built-in email format validation
- ✅ **Password strength** - Minimum 6 characters (configurable)
- ✅ **Rate limiting** - Built into Supabase
- ✅ **Session management** - Automatic token refresh

## 🎨 Frontend Features

- ✅ **Login form** - Email and password
- ✅ **Signup form** - Email, password, and optional name
- ✅ **Tab switching** - Easy toggle between login/signup
- ✅ **Form validation** - Real-time validation
- ✅ **Error handling** - User-friendly error messages
- ✅ **Loading states** - Visual feedback during requests

## 📊 User Roles

Default roles (same as before):
- **admin** - Full access
- **sales** - CRM, Accounts, Products, Marketing
- **developers** - Teams, Products, Dashboard
- **designers** - Teams, Products, Dashboard

New users default to **sales** role.

## 🔄 Migration from Phone Auth

If you had users with phone auth:
1. They can sign up again with email
2. Or you can manually update their profiles to add email
3. Phone field is now optional

## 🛠️ Configuration

### Supabase Email Settings

**Email Templates:**
- Go to **Authentication** > **Email Templates**
- Customize confirmation emails (if enabled)
- Customize password reset emails

**SMTP Settings (Optional):**
- For custom email sending
- Go to **Settings** > **Auth** > **SMTP Settings**
- Configure your SMTP provider (SendGrid, Mailgun, etc.)
- **Note:** Supabase provides free email sending, SMTP is optional

## ✅ Benefits

1. **No External Services** - Everything handled by Supabase
2. **Free** - Supabase free tier includes email auth
3. **Secure** - Industry-standard password hashing
4. **Simple** - No OTP codes, just email/password
5. **Fast** - Instant login, no waiting for SMS

## 🐛 Troubleshooting

### "Email provider disabled"
- Go to Supabase Dashboard > Authentication > Providers
- Enable Email provider
- Save settings

### "Invalid email or password"
- Check email is correct
- Verify password (case-sensitive)
- Check Supabase logs: Dashboard > Logs > Auth

### "User already registered"
- Email already exists
- Use login instead of signup
- Or use password reset

### Token errors
- Check SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env
- Verify token is being sent in Authorization header
- Check token hasn't expired

## 📚 Next Steps

1. ✅ Test signup and login
2. ✅ Customize email templates (optional)
3. ✅ Set up password reset (optional)
4. ✅ Configure email confirmations (optional, recommended for production)

---

**That's it!** Email/password auth is now fully configured and ready to use! 🎉
