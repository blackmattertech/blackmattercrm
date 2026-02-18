# Teams Module Setup Guide

This guide explains how to set up the Teams module with avatar uploads, director management, and detailed profiles.

## Database Setup

### 1. Add Director Fields

Run the migration script in Supabase SQL Editor:

```bash
# File: backend/src/database/migrate_director_fields.sql
```

This adds:
- `is_director` (BOOLEAN) - Indicates if user is a director/partner
- `equity_ratio` (DECIMAL) - Equity percentage (0-100) for directors

### 2. Create Storage Buckets

Run the storage setup script in Supabase SQL Editor:

```bash
# File: backend/src/database/setup_storage_buckets.sql
```

This creates:
- **avatars** bucket (public, 5MB limit, images only)
- **leads** bucket (private, 10MB limit, images and documents)

Storage policies are automatically configured:
- Users can upload/update/delete their own avatars
- Public read access to avatars
- Authenticated users can manage lead files

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install multer @types/multer
```

### 2. API Endpoints

The following endpoints are available:

#### Get User Details
```
GET /api/users/:id
```
- Users can view their own profile
- Admins can view any profile

#### Update Profile
```
PUT /api/users/:id/profile
Body: { full_name?, phone? }
```
- Users can update their own profile
- Admins can update any profile

#### Upload Avatar
```
POST /api/users/:id/avatar
Content-Type: multipart/form-data
Body: { avatar: File }
```
- Users can upload their own avatar
- Admins can upload avatars for any user
- Max file size: 5MB
- Allowed types: JPEG, PNG, WebP, GIF

#### Update Director Status (Admin Only)
```
PUT /api/users/:id/director
Body: { is_director?, equity_ratio? }
```
- Admin only
- `equity_ratio` must be between 0 and 100
- Setting `is_director` to false resets `equity_ratio` to 0

## Frontend Features

### Team Detail Page

- **Navigation**: Click on any team member card to view details
- **Edit Mode**: 
  - Users can edit their own profile
  - Admins can edit any profile
- **Avatar Upload**: Click upload icon on avatar to change profile picture
- **Director Management** (Admin Only):
  - Toggle director status
  - Set equity ratio (0-100%)

### Permissions

- **Non-admin users**: Can edit their own profile (full_name, phone, avatar)
- **Admin users**: Can edit all profiles and manage director status

## Usage

1. **View Team Member Details**:
   - Navigate to Teams page
   - Click on any team member card
   - View full profile information

2. **Edit Profile**:
   - Click "Edit Profile" button
   - Update full name and phone
   - Click "Save" to apply changes

3. **Upload Avatar**:
   - Click the upload icon on the avatar
   - Select an image file (max 5MB)
   - Avatar will be uploaded and displayed

4. **Manage Directors** (Admin Only):
   - In edit mode, check "Mark as Director"
   - Set equity ratio percentage
   - Save changes

## File Storage

### Avatar Storage
- Location: `avatars/{user_id}/{timestamp}.{ext}`
- Public access for viewing
- Users can only upload to their own folder

### Lead Files Storage
- Location: `leads/{lead_id}/{filename}`
- Private access (authenticated users only)
- Used for lead attachments and documents

## Troubleshooting

### Avatar Upload Fails
- Check file size (must be < 5MB)
- Verify file type (JPEG, PNG, WebP, GIF only)
- Ensure storage bucket exists and policies are set

### Director Status Not Saving
- Verify user has admin role
- Check equity ratio is between 0-100
- Ensure database migration was run

### Permission Denied
- Users can only edit their own profile
- Admins can edit any profile
- Check user role in database
