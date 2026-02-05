import express from 'express';
import { supabase, redis } from '../index.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with anon key for auth operations
function getSupabaseAnon() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }
  
  return createClient(url, anonKey);
}

const router = express.Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/signup
 * Register a new user - requires admin approval before login
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = signupSchema.parse(req.body);
    
    const supabaseAnon = getSupabaseAnon();
    
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists. Please login or contact admin for approval.' 
      });
    }

    // Check if auth user exists
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === email);
    
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        error: 'An account with this email already exists. Please login or contact admin for approval.' 
      });
    }
    
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || '',
        },
        email_redirect_to: undefined, // Disable email confirmation for now
      },
    });

    if (authError) {
      logger.error('Signup error:', authError);
      
      // Handle duplicate email error
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return res.status(400).json({ 
          success: false, 
          error: 'An account with this email already exists. Please login or contact admin for approval.' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: authError.message || 'Failed to create account' 
      });
    }

    if (!authData.user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user' 
      });
    }

    const userId = authData.user.id;

    // Create user profile with pending approval
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        phone: '',
        full_name: full_name || '',
        role: 'sales', // Default role, admin can change later
        is_active: false, // Not active until approved
        approval_status: 'pending',
      });

    if (profileError) {
      logger.error('Error creating profile:', profileError);
      
      // If profile creation fails, try to delete the auth user
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (deleteError) {
        logger.error('Error deleting auth user:', deleteError);
      }
      
      // Handle duplicate email
      if (profileError.code === '23505' || profileError.message.includes('duplicate')) {
        return res.status(400).json({ 
          success: false, 
          error: 'An account with this email already exists. Please login or contact admin for approval.' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user profile. Please try again.' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please wait for admin approval before logging in.',
      requires_approval: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    logger.error('Error in signup:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password - only works if approved by admin
 */
router.post('/login', async (req, res) => {
  try {
    logger.info('Login attempt received:', { email: req.body?.email });
    const { email, password } = loginSchema.parse(req.body);
    
    logger.info('Login attempt for:', { email });
    const supabaseAnon = getSupabaseAnon();
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.error('Login error:', {
        message: authError.message,
        status: authError.status,
        error: authError,
      });
      return res.status(401).json({ 
        success: false, 
        error: authError.message || 'Invalid email or password',
        details: process.env.NODE_ENV === 'development' ? authError.message : undefined,
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Login failed' 
      });
    }

    const userId = authData.user.id;

    // Get user profile - only select needed fields
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, is_active, approval_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      logger.error('Profile fetch error:', profileError);
      return res.status(401).json({ 
        success: false, 
        error: 'User profile not found. Please contact administrator.' 
      });
    }

    // Check if user is approved and active
    // Handle NULL approval_status for existing users (treat as approved if is_active is true)
    const isApproved = profile.approval_status === 'approved' || 
                      (profile.approval_status == null && profile.is_active === true);
    
    if (!profile.is_active || !isApproved) {
      logger.warn('Login blocked:', {
        userId,
        email,
        is_active: profile.is_active,
        approval_status: profile.approval_status,
      });
      return res.status(403).json({ 
        success: false, 
        error: 'Your account is pending admin approval. Please contact administrator.',
        approval_status: profile.approval_status || 'pending',
        is_active: profile.is_active,
      });
    }

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    const sessionToken = authData.session.access_token;

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: userId,
        email: authData.user.email || email,
        full_name: profile.full_name,
        role: profile.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request data',
        details: error.errors 
      });
    }
    logger.error('Error in login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    const supabaseAnon = getSupabaseAnon();
    
    // Sign out from Supabase
    await supabaseAnon.auth.signOut();
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error in logout:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    
    // Try to get from Redis cache first (5 minute TTL)
    const cacheKey = `user:${user.id}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const cachedUser = JSON.parse(cached);
        return res.json({
          success: true,
          user: cachedUser,
        });
      }
    } catch (cacheError) {
      // If Redis fails, continue to database query
      logger.warn('Redis cache read failed, falling back to database:', cacheError);
    }
    
    // Only select needed fields for faster query
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('id, email, phone, full_name, role, avatar_url, is_active, approval_status')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    const userData = {
      id: profile.id,
      email: profile.email || user.email,
      phone: profile.phone,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      is_active: profile.is_active,
      approval_status: profile.approval_status,
    };

    // Cache in Redis for 5 minutes
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(userData));
    } catch (cacheError) {
      // Ignore cache errors, response is still valid
    }

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    logger.error('Error in /me:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/pending-users
 * Get list of pending users (admin only)
 */
router.get('/pending-users', authenticate, requireAdmin, async (req, res) => {
  try {
    // Try Redis cache first (1 minute TTL for pending users)
    const cacheKey = 'auth:pending-users';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: JSON.parse(cached) });
      }
    } catch (cacheError) {
      // Continue to database if cache fails
    }

    // Only select needed fields for faster query
    const { data: pendingUsers, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, approval_status, created_at')
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching pending users:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch pending users' 
      });
    }

    res.json({
      success: true,
      data: pendingUsers || [],
    });
  } catch (error) {
    logger.error('Error in /pending-users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/approve-user/:id
 * Approve a pending user (admin only)
 */
router.post('/approve-user/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const adminUser = (req as any).user;

    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: true,
        approval_status: 'approved',
        approved_by: adminUser.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error approving user:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to approve user' 
      });
    }

    // Invalidate caches
    try {
      await redis.del('users:all');
      await redis.del(`user:${userId}`);
      await redis.del('auth:pending-users');
    } catch (cacheError) {
      // Ignore cache errors
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error in /approve-user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reject-user/:id
 * Reject a pending user (admin only)
 */
router.post('/reject-user/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

    const { data: updatedUser, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        approval_status: 'rejected',
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Error rejecting user:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to reject user' 
      });
    }

    res.json({
      success: true,
      message: 'User rejected',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error in /reject-user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
