# Documentation Structure

This folder contains all project documentation organized by category.

## Folder Structure

### `/root`
General project documentation and setup guides:
- `README.md` - Main project readme
- `SETUP.md` - Initial setup instructions
- `START.md` - Quick start guide
- `QUICK_START.md` - Quick start instructions
- `DEPENDENCY.md` - Dependency installation guide
- `ENV_SETUP.md` - Environment variable setup

### `/backend`
Backend-specific documentation:
- `DATABASE_SETUP.md` - Database setup instructions
- `EMAIL_AUTH_SETUP.md` - Email authentication setup
- `EMAIL_AUTH_MIGRATION.md` - Email auth migration guide
- `EMAIL_AUTH_FIXES.md` - Email auth fixes and troubleshooting
- `AUTH_CHANGES.md` - Authentication changes summary
- `ADMIN_APPROVAL_SETUP.md` - Admin approval system setup
- `REMOVED_OTP.md` - OTP removal documentation
- `SUPABASE_PHONE_AUTH.md` - Supabase phone auth guide (deprecated)
- `SETUP_PHONE_NOW.md` - Phone setup guide (deprecated)
- `QUICK_PHONE_SETUP.md` - Quick phone setup (deprecated)
- `DEBUG_STEPS.md` - Debugging steps
- `TROUBLESHOOT_LOGIN.md` - Login troubleshooting guide
- `CREATE_ADMIN_INSTRUCTIONS.md` - Admin user creation guide
- `test_login.sh` - Login testing script

### `/frontend`
Frontend-specific documentation (currently empty - add frontend docs here)

### `/guides`
General guides and architecture documentation:
- `ARCHITECTURE.md` - System architecture
- `DESIGN_SYSTEM.md` - Design system documentation
- `ATTRIBUTIONS.md` - Attributions and credits
- `Guidelines.md` - Development guidelines

## SQL Files

All SQL migration and setup files are located in:
- `backend/src/database/` - All SQL files including:
  - `schema.sql` - Main database schema
  - `migrate_email_auth.sql` - Email auth migration
  - `migrate_approval_system.sql` - Approval system migration
  - Various fix and utility SQL scripts
