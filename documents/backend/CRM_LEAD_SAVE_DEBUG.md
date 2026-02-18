# CRM Lead Save Issue - Debugging Guide

## Problem
Leads are not being saved - no POST requests appear in backend logs when clicking "Add Lead" button.

## Root Causes Identified

### 1. Form Submission Issue
- Form has `onSubmit` handler but may not be preventing default properly
- Button click might be triggering page refresh before async function completes

### 2. Database RLS Policies Missing
- `leads` table has RLS enabled but NO policies defined
- Backend uses SERVICE_ROLE_KEY which should bypass RLS, but policies should exist for safety

### 3. No Request Logs
- No POST `/api/crm/leads` requests in backend logs
- Indicates request never reaches backend

## Fixes Applied

### Frontend Fixes

1. **Enhanced Form Submit Handler** (`frontend/src/app/modules/CRM.tsx` line 957):
   - Added comprehensive logging at every step
   - Added `e.stopPropagation()` to prevent event bubbling
   - Added try-catch with detailed error logging
   - Logs form state before submission

2. **Button Click Logging** (line 1117):
   - Added onClick handler to log button clicks
   - Verifies button state (disabled/enabled)
   - Logs form data when button is clicked

3. **API Request Logging** (`frontend/src/lib/api.ts`):
   - Added logging before fetch request
   - Added logging after response received
   - Logs URL, method, status, and response details

### Backend Fixes

1. **RLS Policies Created** (`backend/src/database/setup_leads_rls.sql`):
   - Created policies for SELECT, INSERT, UPDATE, DELETE
   - Allows authenticated users with sales/admin role to create leads
   - Allows users to update/delete their own leads
   - Admins can delete any lead

## Database Setup Required

Run this SQL in Supabase SQL Editor:

```sql
-- See: backend/src/database/setup_leads_rls.sql
```

This will create the necessary RLS policies for the leads table.

## Debugging Steps

1. **Check Browser Console**:
   - Look for `[CRM] ===== FORM SUBMIT EVENT TRIGGERED =====`
   - Look for `[CRM] handleCreateLead called`
   - Look for `[API] About to make fetch request`
   - Look for `[API] Fetch response received`

2. **Check Network Tab**:
   - Open DevTools → Network tab
   - Filter by "leads"
   - Try to create a lead
   - Check if POST request appears
   - Check request status (200, 400, 500, etc.)
   - Check request payload

3. **Check Backend Logs**:
   - Look for `POST /api/crm/leads - Request received`
   - Check for validation errors
   - Check for database errors

4. **Verify Database**:
   - Check if `leads` table exists
   - Check if RLS is enabled: `SELECT * FROM pg_policies WHERE tablename = 'leads';`
   - Check if policies exist
   - Try manual insert to test: `INSERT INTO leads (name, created_by) VALUES ('Test', 'user-id');`

## Common Issues

### Issue 1: Form Still Refreshing
**Symptoms**: Page refreshes, no console logs
**Fix**: Ensure `e.preventDefault()` is called and form handler is async

### Issue 2: Button Disabled
**Symptoms**: Button doesn't respond, no logs
**Fix**: Check `leadForm.name` is not empty, `creatingLead` is false

### Issue 3: CORS Error
**Symptoms**: Network error in console, CORS error message
**Fix**: Check backend CORS configuration allows the origin

### Issue 4: 401 Unauthorized
**Symptoms**: Request fails with 401
**Fix**: Check token is valid, user is authenticated

### Issue 5: 403 Forbidden
**Symptoms**: Request fails with 403
**Fix**: Check user has 'sales' or 'admin' role, `requireSales` middleware

### Issue 6: 400 Bad Request
**Symptoms**: Request fails with 400, validation errors
**Fix**: Check request payload matches schema, all required fields present

### Issue 7: Database Error
**Symptoms**: 500 error, database constraint violation
**Fix**: Check RLS policies, foreign key constraints, required fields

## Testing Checklist

- [ ] Open browser console
- [ ] Fill in lead form (at least name field)
- [ ] Click "Add Lead" button
- [ ] Check console for `[CRM] ===== FORM SUBMIT EVENT TRIGGERED =====`
- [ ] Check console for `[CRM] handleCreateLead called`
- [ ] Check console for `[API] About to make fetch request`
- [ ] Check Network tab for POST request to `/api/crm/leads`
- [ ] Check backend logs for `POST /api/crm/leads - Request received`
- [ ] Verify lead appears in database
- [ ] Verify lead appears in UI list

## Next Steps if Still Not Working

1. Check if form is actually submitting (look for page refresh)
2. Check if JavaScript errors are preventing execution
3. Check if API URL is correct (should be `http://192.168.1.38:3001/api/crm/leads`)
4. Check if token is being sent in Authorization header
5. Check backend is running and accessible
6. Check database connection
7. Check RLS policies are applied
