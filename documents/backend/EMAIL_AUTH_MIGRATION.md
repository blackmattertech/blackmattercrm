# Database Migration: Email Authentication

## Quick Migration Steps

### Step 1: Run Migration SQL

Go to Supabase Dashboard > SQL Editor and run:

```sql
-- Add email column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Make phone optional
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'phone' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE user_profiles 
        ALTER COLUMN phone DROP NOT NULL;
    END IF;
END $$;

-- Remove unique constraint on phone
DROP INDEX IF EXISTS user_profiles_phone_key;

-- Add unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email 
ON user_profiles(email) 
WHERE email IS NOT NULL;
```

### Step 2: Verify

Check that the migration worked:
- Email column exists
- Phone column is nullable
- Email has unique index

### Step 3: Test

1. Restart backend
2. Try signup with email
3. Try login with email

Done! ✅
