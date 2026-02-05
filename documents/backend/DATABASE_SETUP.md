# Database Setup - Create Tables in Supabase

## ⚠️ Error You're Seeing

```
Could not find the table 'public.user_profiles' in the schema cache
```

This means the database tables haven't been created yet. Let's fix this!

## 🚀 Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/ykulpjsflfmyplrphfgq/sql/new
2. Or: Dashboard > SQL Editor > New Query

### Step 2: Run the Schema

1. Open the file: `backend/src/database/schema.sql`
2. Copy **ALL** the contents (the entire file)
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

1. Go to: Dashboard > Table Editor
2. You should see these tables:
   - ✅ `user_profiles`
   - ✅ `leads`
   - ✅ `customers`
   - ✅ `tasks`
   - ✅ `invoices`
   - ✅ `products`
   - ✅ And many more...

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

The error should be gone! ✅

## 📋 What the Schema Creates

The schema.sql file creates:

### Core Tables
- `user_profiles` - User information and roles
- `otp_codes` - OTP storage (for backward compatibility)

### CRM Tables
- `leads` - Sales leads
- `customers` - Customer records
- `tasks` - Task management
- `followups` - Follow-up scheduling
- `activity_logs` - Activity tracking

### Accounts Tables
- `chart_of_accounts` - Account structure
- `journal_entries` - Double-entry transactions
- `journal_entry_lines` - Transaction details
- `invoices` - Sales/Purchase invoices
- `invoice_items` - Invoice line items
- `payments` - Payment records
- `receipts` - Receipt records
- `bank_accounts` - Bank accounts
- `bank_ledger` - Bank transactions
- `director_capital_accounts` - Director accounts

### Teams Tables
- `team_members` - Team/freelancer profiles
- `availability_calendar` - Availability tracking
- `project_assignments` - Project assignments
- `earnings` - Earnings tracking

### Products Tables
- `products` - Product/service catalog
- `subscriptions` - SaaS subscriptions

### Marketing Tables
- `campaigns` - Marketing campaigns
- `campaign_metrics` - Campaign performance

### System Tables
- `notifications` - User notifications
- `audit_logs` - System audit trail

## 🔍 Troubleshooting

### "Permission denied" Error
- Make sure you're using the SQL Editor (not API)
- You need to be project owner or have SQL access

### "Table already exists" Warnings
- This is OK! The schema uses `IF NOT EXISTS`
- Just means some tables were already created

### Still Getting Errors After Running Schema
1. Check Supabase logs: Dashboard > Logs > Postgres
2. Verify tables exist: Dashboard > Table Editor
3. Check RLS policies: Dashboard > Authentication > Policies
4. Restart backend server

### Tables Created But Still Errors
- Wait 10-30 seconds for schema cache to refresh
- Restart backend server
- Check table names match exactly (case-sensitive)

## ✅ Verification Checklist

After running schema.sql, verify:

- [ ] `user_profiles` table exists
- [ ] Can see tables in Table Editor
- [ ] No errors in SQL Editor output
- [ ] Backend starts without table errors
- [ ] Can create a user via signup

## 🎯 Next Steps After Schema

1. ✅ Tables created
2. ✅ Run email auth migration (if needed)
3. ✅ Test signup/login
4. ✅ Start using the system!

---

**Once you run the schema.sql file, everything will work!** 🚀
