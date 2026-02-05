import { Request, Response, NextFunction } from 'express';
import { supabase } from '../index.js';
import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'sales' | 'developers' | 'designers';
    full_name?: string;
  };
}

// Create Supabase client with anon key for token verification
function getSupabaseAnon() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  }
  
  return createClient(url, anonKey);
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase using anon client
    const supabaseAnon = getSupabaseAnon();
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }

    // Get user profile with role - only select needed fields
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, phone, role, full_name, is_active, approval_status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Profile fetch error:', profileError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User profile not found' 
      });
    }

    req.user = {
      id: user.id,
      email: user.email || profile.email || '',
      phone: profile.phone || '',
      role: profile.role,
      full_name: profile.full_name,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Authentication failed' 
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireSales = requireRole('admin', 'sales');
export const requireDevelopers = requireRole('admin', 'developers');
export const requireDesigners = requireRole('admin', 'designers');
