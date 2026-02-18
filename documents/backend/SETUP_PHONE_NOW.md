# 📱 Setup Phone OTP Now - Direct Links

## Your Supabase Project
**Project URL:** `https://ykulpjsflfmyplrphfgq.supabase.co`

## 🎯 Quick Setup (Choose One)

### Option 1: Twilio (Recommended - Free $15.50)

**Step 1: Get Twilio (2 minutes)**
1. Sign up: https://www.twilio.com/try-twilio
2. After signup, copy:
   - Account SID (starts with `AC...`)
   - Auth Token (click "View")
   - Get a phone number (free with trial)

**Step 2: Configure in Supabase**
👉 **Direct Link:** https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/auth/providers

1. Find **Phone** provider
2. Toggle **Enable Phone provider** ON
3. Select **Twilio**
4. Paste credentials and Save

**Step 3: Test**
- Restart backend: `cd backend && npm run dev`
- Try login at http://localhost:5173
- Check your phone for OTP! 📱

---

### Option 2: MessageBird (Free Tier)

1. Sign up: https://www.messagebird.com/en/sign-up
2. Get API key from dashboard
3. Go to: https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/auth/providers
4. Enable Phone > Select MessageBird > Enter API key > Save

---

### Option 3: Vonage (Free Tier)

1. Sign up: https://www.vonage.com/communications-apis/
2. Get API Key and Secret
3. Go to: https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/auth/providers
4. Enable Phone > Select Vonage > Enter credentials > Save

---

## 🔗 Direct Links

**Supabase Phone Settings:**
```
https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/auth/providers
```

**Twilio Console:**
```
https://console.twilio.com/
```

---

## ✅ After Setup

1. **Restart backend:**
   ```bash
   # Stop server (Ctrl+C)
   cd backend
   npm run dev
   ```

2. **Test:**
   - Go to http://localhost:5173
   - Enter phone number
   - Click "Send OTP"
   - **Real SMS will arrive!** 📱

3. **Verify:**
   - Enter OTP from SMS
   - You're logged in! 🎉

---

## 💡 Current Status

- ✅ Backend working
- ✅ Development mode active (OTP: 123456 in console)
- ⏳ Waiting for phone provider configuration

**Once you configure a provider in Supabase, real SMS will work!**

---

See [QUICK_PHONE_SETUP.md](./QUICK_PHONE_SETUP.md) for detailed instructions.
