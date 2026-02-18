import express from 'express';
import multer from 'multer';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { supabase, redis } from '../index.js';
import { logger } from '../utils/logger.js';

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  },
});

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', requireAdmin, async (req, res) => {
  try {
    // Try Redis cache first (2 minute TTL for user lists)
    const cacheKey = 'users:all';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: JSON.parse(cached) });
      }
    } catch (cacheError) {
      // Continue to database if cache fails
    }

    // Only select needed fields for faster query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, avatar_url, is_active, approval_status, is_director, equity_ratio, created_at, last_login_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = data || [];
    
    // Cache for 2 minutes
    try {
      await redis.setex(cacheKey, 120, JSON.stringify(users));
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['admin', 'sales', 'developers', 'designers'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${req.params.id}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

/**
 * PUT /api/users/:id/approve
 * Approve user (admin only) - alternative endpoint
 */
router.put('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const adminUser = (req as any).user;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: true,
        approval_status: 'approved',
        approved_by: adminUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${req.params.id}`);
      await redis.del('auth:pending-users');
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data, message: 'User approved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve user' });
  }
});

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const validRoles = ['admin', 'sales', 'developers', 'designers'];
    const userRole = role && validRoles.includes(role) ? role : 'sales';

    // Import createClient for auth operations - use SERVICE_ROLE_KEY for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Create user in Supabase Auth (requires service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || '',
      },
    });

    if (authError) {
      logger.error('Error creating auth user:', authError);
      return res.status(400).json({ 
        success: false, 
        error: authError.message || 'Failed to create user',
        details: process.env.NODE_ENV === 'development' ? authError.message : undefined,
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user' 
      });
    }

    const userId = authData.user.id;
    const adminUser = (req as any).user;

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        phone: phone || '',
        full_name: full_name || '',
        role: userRole,
        is_active: true,
        approval_status: 'approved',
        approved_by: adminUser.id,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, try to delete the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        // Ignore delete errors
      }
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create user profile' 
      });
    }

    // Invalidate users cache
    try {
      await redis.del('users:all');
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.status(201).json({ 
      success: true, 
      data: profile,
      message: 'User created successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

/**
 * PUT /api/users/:id
 * Update user (admin only)
 */
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { full_name, role, phone, is_active, approval_status } = req.body;
    const userId = req.params.id;

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (approval_status !== undefined) updateData.approval_status = approval_status;
    
    if (role !== undefined) {
      if (!['admin', 'sales', 'developers', 'designers'].includes(role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }
      updateData.role = role;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${req.params.id}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user (admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUser = (req as any).user;

    // Prevent admin from deleting themselves
    if (userId === currentUser.id) {
      return res.status(400).json({ 
        success: false, 
        error: 'You cannot delete your own account' 
      });
    }

    // Delete from user_profiles (cascade will handle auth.users if configured)
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    // Also delete from auth.users (requires service role key)
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (deleteError) {
      // Log but don't fail if auth user doesn't exist
      console.error('Error deleting auth user:', deleteError);
    }

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${userId}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

/**
 * GET /api/users/directors
 * Get all directors (users with is_director = true)
 */
router.get('/directors', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, avatar_url, is_director, equity_ratio, created_at')
      .eq('is_director', true)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    logger.error('Error fetching directors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch directors' });
  }
});

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Users can only view their own profile unless they're admin
    if (id !== currentUser.id && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, avatar_url, is_active, approval_status, is_director, equity_ratio, created_at, last_login_at')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id/profile
 * Update user profile (users can update their own, admin can update any)
 */
router.put('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const { full_name, phone } = req.body;

    // Users can only update their own profile unless they're admin
    if (id !== currentUser.id && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${id}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * POST /api/users/:id/avatar
 * Upload avatar for user
 */
router.post('/:id/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;
    const file = (req as any).file;

    // Users can only upload their own avatar unless they're admin
    if (id !== currentUser.id && currentUser.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${id}/${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      logger.error('Error uploading avatar:', uploadError);
      return res.status(500).json({ success: false, error: 'Failed to upload avatar' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update user profile with avatar URL
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (profileError) throw profileError;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${id}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data: profileData, avatar_url: avatarUrl });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    res.status(500).json({ success: false, error: 'Failed to upload avatar' });
  }
});

/**
 * PUT /api/users/:id/director
 * Update director status and equity ratio (admin only)
 */
router.put('/:id/director', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_director, equity_ratio } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (is_director !== undefined) {
      updateData.is_director = is_director;
    }

    if (equity_ratio !== undefined) {
      const ratio = parseFloat(equity_ratio);
      if (isNaN(ratio) || ratio < 0 || ratio > 100) {
        return res.status(400).json({ success: false, error: 'Equity ratio must be between 0 and 100' });
      }
      updateData.equity_ratio = ratio;
    }

    // If setting as non-director, reset equity ratio
    if (is_director === false) {
      updateData.equity_ratio = 0;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${id}`);
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({ success: true, data, message: 'Director status updated successfully' });
  } catch (error) {
    logger.error('Error updating director status:', error);
    res.status(500).json({ success: false, error: 'Failed to update director status' });
  }
});

export default router;
