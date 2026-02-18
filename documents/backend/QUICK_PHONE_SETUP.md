# 🚀 Quick Setup: Enable Free Phone OTP in Supabase

## Current Status
✅ Backend is working  
✅ Development mode active (OTP: **123456** shown in console)  
❌ Phone provider needs to be enabled in Supabase  

## 🎯 Fastest Way: Twilio Free Trial (5 minutes)

### Step 1: Get Twilio Free Account (2 min)

1. **Sign up:** https://www.twilio.com/try-twilio
   - No credit card required for trial
   - Get $15.50 free credits (~100-200 SMS)

2. **After signup, you'll see:**
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click "View" to see it)
   - Copy both!

3. **Get a phone number:**
   - Click **Phone Numbers** > **Get a number**
   - Choose any number (free with trial)
   - Copy the number (format: +1234567890)

### Step 2: Configure in Supabase (2 min)

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Enable Phone Auth:**
   - Click **Authentication** (left sidebar)
   - Click **Providers** tab
   - Find **Phone** and click to expand
   - Toggle **Enable Phone provider** to **ON** ✅

3. **Configure Twilio:**
   - Under **SMS Provider**, select **Twilio**
   - Paste your credentials:
     - **Twilio Account SID**: `AC...` (from Step 1)
     - **Twilio Auth Token**: (from Step 1)
     - **Twilio Phone Number**: `+1234567890` (from Step 1)
   - Click **Save** 💾

### Step 3: Test (1 min)

1. **Restart backend:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   cd backend
   npm run dev
   ```

2. **Test OTP:**
   - Go to http://localhost:5173
   - Enter your phone number
   - Click "Send OTP"
   - **Check your phone** - you should receive SMS! 📱

## ✅ That's It!

After setup, OTPs will be sent via SMS instead of console logs.

---

## 🔄 Alternative Free Providers

### Option 2: MessageBird (Free Tier)
1. Sign up: https://www.messagebird.com/en/sign-up
2. Get API key from dashboard
3. In Supabase: Select **MessageBird** > Enter API key > Save

### Option 3: Vonage (Free Tier)
1. Sign up: https://www.vonage.com/communications-apis/
2. Get API Key and Secret
3. In Supabase: Select **Vonage** > Enter credentials > Save

---

## 📍 Direct Links

**Supabase Phone Settings:**
```
https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/auth/providers
```

**Twilio Console:**
```
https://console.twilio.com/
```

---

## 🐛 Troubleshooting

### Still seeing "phone_provider_disabled"?
- ✅ Make sure you **saved** the settings in Supabase
- ✅ Wait 30 seconds for changes to propagate
- ✅ Restart backend server
- ✅ Check Supabase Dashboard shows Phone as "Enabled"

### OTP not received?
- Check Twilio balance: https://console.twilio.com/
- Verify phone number format: `+91XXXXXXXXXX`
- Check Supabase logs: Dashboard > Logs > Auth
- Check backend console for errors

### Need help?
- See full guide: [SUPABASE_PHONE_AUTH.md](./SUPABASE_PHONE_AUTH.md)
- Check Supabase docs: https://supabase.com/docs/guides/auth/phone-login

---

## 💰 Cost After Free Trial

**Twilio Pricing:**
- India: ~₹0.50-1.00 per SMS
- US: ~$0.0075 per SMS
- Pay-as-you-go (no monthly fees)

**MessageBird/Vonage:**
- Similar pricing
- Check their websites for current rates

---

**🎉 Once configured, you'll get real SMS OTPs instead of console logs!**
