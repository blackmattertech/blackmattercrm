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

function isTransientAuthError(error: any): boolean {
  if (!error) return false;
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || 0);
  return (
    status >= 500 ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('temporarily unavailable')
  );
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
        message: 'No token provided',
        code: 'token_missing',
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase using anon client
    const supabaseAnon = getSupabaseAnon();
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

    if (error) {
      if (isTransientAuthError(error)) {
        logger.warn('Authentication upstream unavailable', {
          reason: error?.message,
          status: error?.status,
          code: 'upstream_auth_unavailable',
          path: req.path,
        });
        return res.status(503).json({
          error: 'Authentication temporarily unavailable',
          message: 'Please retry shortly',
          code: 'upstream_auth_unavailable',
        });
      }

      logger.warn('Authentication token validation failed', {
        reason: error?.message,
        status: error?.status,
        code: 'token_invalid_or_expired',
        path: req.path,
      });
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 'token_invalid_or_expired',
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
        code: 'token_invalid_or_expired',
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
        message: 'User profile not found',
        code: 'profile_missing',
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
      logger.warn('requireRole: No user in request', {
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('requireRole: Insufficient permissions', {
        path: req.path,
        method: req.method,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}` 
      });
    }

    logger.debug('requireRole: Access granted', {
      path: req.path,
      userRole: req.user.role,
      requiredRoles: allowedRoles,
    });
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireSales = requireRole('admin', 'sales');
export const requireDevelopers = requireRole('admin', 'developers');
export const requireDesigners = requireRole('admin', 'designers');
