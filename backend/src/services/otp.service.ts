import { supabase } from '../index.js';
import { redis } from '../index.js';
import { logger } from '../utils/logger.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60; // Convert to seconds

// Lazy initialization of Supabase client with anon key for phone auth
let supabaseAnon: SupabaseClient | null = null;

function getSupabaseAnon(): SupabaseClient {
  if (!supabaseAnon) {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables');
    }
    
    supabaseAnon = createClient(url, anonKey);
  }
  return supabaseAnon;
}

export class OTPService {
  /**
   * Format phone number for Supabase (E.164 format)
   */
  private static formatPhone(phone: string): string {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // If it's an Indian number (10 digits), add +91
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }
    
    // If it already has country code, add + if missing
    if (cleanPhone.length > 10 && !cleanPhone.startsWith('+')) {
      return `+${cleanPhone}`;
    }
    
    // If it already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return `+${cleanPhone}`;
  }

  /**
   * Send OTP to phone number using Supabase Auth
   */
  static async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate phone number format
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return { success: false, message: 'Invalid phone number format' };
      }

      // Format phone number for Supabase (E.164 format)
      const formattedPhone = this.formatPhone(phone);

      // Check rate limiting (max 3 OTPs per phone per hour)
      const rateLimitKey = `otp_rate_limit:${formattedPhone}`;
      const attempts = await redis.get(rateLimitKey);
      if (attempts && parseInt(attempts) >= 3) {
        return { 
          success: false, 
          message: 'Too many OTP requests. Please try again later.' 
        };
      }

      // Use Supabase Auth to send OTP
      const { data, error } = await getSupabaseAnon().auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        logger.error('Supabase OTP error:', error);
        
        // Check for phone provider disabled error
        const isPhoneProviderDisabled = 
          error.code === 'phone_provider_disabled' ||
          error.message?.includes('phone_provider_disabled') ||
          error.message?.includes('Unsupported phone provider') ||
          error.message?.includes('phone') ||
          error.message?.includes('configuration');
        
        if (isPhoneProviderDisabled) {
          logger.warn('⚠️  Phone provider not enabled in Supabase!');
          logger.warn('📋 Quick Setup Guide:');
          logger.warn('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/providers');
          logger.warn('   2. Find "Phone" provider and click to expand');
          logger.warn('   3. Toggle "Enable Phone provider" to ON');
          logger.warn('   4. Select SMS provider (Twilio, MessageBird, or Vonage)');
          logger.warn('   5. Enter credentials and Save');
          logger.warn('   6. See QUICK_PHONE_SETUP.md for detailed instructions');
          logger.warn('');
          logger.warn('💡 Using development mode - OTP will be logged below:');
          
          // Store a mock OTP for development
          const mockOTP = '123456';
          await redis.setex(`otp:${formattedPhone}`, OTP_EXPIRY, mockOTP);
          logger.info(`[DEV MODE] 📱 OTP for ${formattedPhone}: ${mockOTP}`);
          logger.info(`[DEV MODE] ✅ Use this code to login: ${mockOTP}`);
          
          return {
            success: true,
            message: 'OTP sent (dev mode - see console for code)',
          };
        }
        
        return { 
          success: false, 
          message: error.message || 'Failed to send OTP. Please try again.' 
        };
      }

      // Update rate limit
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 3600); // 1 hour

      return { 
        success: true, 
        message: 'OTP sent successfully to your phone' 
      };
    } catch (error) {
      logger.error('Error sending OTP:', error);
      return { 
        success: false, 
        message: 'An error occurred while sending OTP' 
      };
    }
  }

  /**
   * Verify OTP code using Supabase Auth
   */
  static async verifyOTP(phone: string, code: string): Promise<{ success: boolean; message: string; session?: any }> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhone(phone);

      // Check for development mode OTP (if Supabase not configured)
      const devOTP = await redis.get(`otp:${formattedPhone}`);
      if (devOTP === code) {
        await redis.del(`otp:${formattedPhone}`);
        return { 
          success: true, 
          message: 'OTP verified successfully (development mode)',
          session: { phone: formattedPhone }
        };
      }

      // Verify OTP with Supabase Auth
      const { data, error } = await getSupabaseAnon().auth.verifyOtp({
        phone: formattedPhone,
        token: code,
        type: 'sms',
      });

      if (error) {
        // Increment failed attempts
        const attemptsKey = `otp_attempts:${formattedPhone}`;
        const attempts = await redis.incr(attemptsKey);
        await redis.expire(attemptsKey, 3600);

        if (attempts >= 5) {
          return { 
            success: false, 
            message: 'Too many failed attempts. Please request a new OTP.' 
          };
        }

        return { 
          success: false, 
          message: error.message || 'Invalid or expired OTP' 
        };
      }

      return { 
        success: true, 
        message: 'OTP verified successfully',
        session: data
      };
    } catch (error) {
      logger.error('Error verifying OTP:', error);
      return { success: false, message: 'An error occurred while verifying OTP' };
    }
  }
}
