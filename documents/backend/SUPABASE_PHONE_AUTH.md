# Supabase Phone Authentication Setup

This guide explains how to set up free phone OTP authentication using Supabase's built-in phone auth feature.

## Why Supabase Phone Auth?

✅ **Free tier available** - Supabase provides phone auth with free SMS credits  
✅ **No external dependencies** - No need for Twilio or other SMS services  
✅ **Built-in security** - Handled by Supabase's secure infrastructure  
✅ **Easy setup** - Configure directly in Supabase Dashboard  

## Setup Instructions

### Step 1: Enable Phone Auth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Phone** provider and click to expand
4. Toggle **Enable Phone provider** to ON
5. Click **Save**

### Step 2: Configure SMS Provider

Supabase supports multiple SMS providers. Choose one:

#### Option A: Twilio (Recommended for Production)

1. In Supabase Dashboard, go to **Authentication** > **Providers** > **Phone**
2. Select **Twilio** as the SMS provider
3. Enter your Twilio credentials:
   - **Account SID**: From Twilio Console
   - **Auth Token**: From Twilio Console
   - **Phone Number**: Your Twilio phone number (E.164 format, e.g., +1234567890)
4. Click **Save**

**Note:** Twilio free tier includes trial credits. For production, you'll need a paid plan.

#### Option B: MessageBird (Free Tier Available)

1. Sign up at https://www.messagebird.com
2. Get your API key from MessageBird dashboard
3. In Supabase, select **MessageBird** as SMS provider
4. Enter your MessageBird API key
5. Click **Save**

#### Option C: Vonage (Formerly Nexmo)

1. Sign up at https://www.vonage.com
2. Get your API key and secret
3. In Supabase, select **Vonage** as SMS provider
4. Enter your credentials
5. Click **Save**

#### Option D: Custom SMS Provider

Supabase also supports custom SMS providers via webhooks. See Supabase documentation for details.

### Step 3: Test Phone Auth

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Test the OTP endpoint:
   ```bash
   curl -X POST http://localhost:3001/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210"}'
   ```

3. Check your phone for the OTP code

4. Verify the OTP:
   ```bash
   curl -X POST http://localhost:3001/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "+919876543210", "code": "123456"}'
   ```

## Development Mode

If you haven't configured an SMS provider yet, the system will:
- Log OTP codes to the backend console
- Use a development OTP code (123456) for testing
- Allow you to test the authentication flow

**To see OTP in development:**
1. Check backend console logs when sending OTP
2. Use the OTP code shown in logs to verify

## Phone Number Format

The system automatically formats phone numbers to E.164 format:
- Indian numbers (10 digits): `9876543210` → `+919876543210`
- Numbers with country code: Automatically formatted
- Already formatted: Used as-is

## Free Tier Limits

### Supabase Free Tier
- Phone auth is included
- SMS costs depend on your SMS provider

### SMS Provider Free Tiers

**Twilio:**
- Free trial: $15.50 credit
- ~100-200 SMS depending on destination
- After trial: Pay-as-you-go pricing

**MessageBird:**
- Free tier: Limited free SMS
- Check current limits on their website

**Vonage:**
- Free tier: Limited free SMS
- Check current limits on their website

## Production Recommendations

1. **Use a paid SMS provider** for reliability
2. **Set up rate limiting** (already implemented)
3. **Monitor SMS costs** in your provider dashboard
4. **Configure fallback providers** if available
5. **Set up alerts** for failed SMS deliveries

## Troubleshooting

### OTP Not Received

1. **Check SMS provider configuration** in Supabase Dashboard
2. **Verify phone number format** (must be E.164: +[country code][number])
3. **Check SMS provider balance/credits**
4. **Review Supabase logs** in Dashboard > Logs > Auth
5. **Check backend logs** for error messages

### "Phone provider not configured" Error

- Enable Phone provider in Supabase Dashboard
- Configure at least one SMS provider
- Wait a few minutes for changes to propagate

### Rate Limiting Issues

- Default limit: 3 OTP requests per phone per hour
- Wait 1 hour or clear Redis cache: `redis-cli FLUSHDB`

### Development Mode Not Working

- Check backend console for OTP codes
- Ensure Redis is running
- Verify Supabase credentials in `.env`

## Cost Comparison

| Provider | Free Tier | Cost per SMS (India) | Cost per SMS (US) |
|----------|-----------|---------------------|-------------------|
| Twilio | $15.50 trial | ~₹0.50-1.00 | ~$0.0075 |
| MessageBird | Limited | ~₹0.40-0.80 | ~$0.006 |
| Vonage | Limited | ~₹0.50-1.00 | ~$0.007 |

**Note:** Prices vary by country and volume. Check provider websites for current pricing.

## Alternative: Use Supabase's Test Phone Numbers

For development, Supabase provides test phone numbers that don't require SMS:
- Check Supabase documentation for test numbers
- These work without SMS provider configuration
- Only for development/testing

## Security Best Practices

1. ✅ Rate limiting is already implemented (3 requests/hour)
2. ✅ OTP expiry: 10 minutes (configurable)
3. ✅ Failed attempt tracking (5 attempts max)
4. ✅ Phone number validation
5. ✅ Secure token storage in Redis

## Next Steps

1. Set up your preferred SMS provider in Supabase
2. Test with a real phone number
3. Monitor SMS delivery rates
4. Set up production alerts
5. Consider implementing backup SMS provider

---

For more information, see:
- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Supabase SMS Providers](https://supabase.com/docs/guides/auth/phone-login#sms-providers)
