import express from 'express';
import { supabase } from '../index.js';
import { authenticate } from '../middleware/auth.middleware.js';
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
  role: z.enum(['admin', 'sales', 'developers', 'designers']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/signup
 * Register a new user with email and password
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, role } = signupSchema.parse(req.body);
    
    const supabaseAnon = getSupabaseAnon();
    
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: full_name || '',
        },
      },
    });

    if (authError) {
      logger.error('Signup error:', authError);
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

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        phone: '', // Phone optional now
        full_name: full_name || '',
        role: role || 'sales',
        is_active: true,
      });

    if (profileError) {
      logger.error('Error creating profile:', profileError);
      // Continue anyway - profile can be updated later
    }

    // Generate token for API access
    const apiToken = authData.session?.access_token || Buffer.from(JSON.stringify({ 
      userId, 
      email,
      timestamp: Date.now() 
    })).toString('base64');

    res.status(201).json({
      success: true,
      token: apiToken,
      user: {
        id: userId,
        email,
        full_name: full_name || '',
        role: role || 'sales',
      },
      message: 'Account created successfully',
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
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const supabaseAnon = getSupabaseAnon();
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.error('Login error:', authError);
      return res.status(401).json({ 
        success: false, 
        error: authError.message || 'Invalid email or password' 
      });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Login failed' 
      });
    }

    const userId = authData.user.id;
    const sessionToken = authData.session.access_token;

    // Get or create user profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Update last login
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } else {
      // Create profile if doesn't exist
      await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          email: authData.user.email || email,
          phone: authData.user.phone || '',
          role: 'sales',
          is_active: true,
        });
    }

    // Get updated profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    res.json({
      success: true,
      token: sessionToken,
      user: {
        id: userId,
        email: authData.user.email || email,
        full_name: profile?.full_name,
        role: profile?.role || 'sales',
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
    const { user } = req as any;
    
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
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email || user.email,
        phone: profile.phone,
        full_name: profile.full_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
      },
    });
  } catch (error) {
    logger.error('Error in /me:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
