#!/bin/bash
# Test login endpoint
# Usage: ./test_login.sh

echo "Testing login endpoint..."
echo ""

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "info@blackmattertech.com",
    "password": "YOUR_PASSWORD_HERE"
  }' | jq .

echo ""
echo "If you see an error, check:"
echo "1. Backend is running (npm run dev)"
echo "2. Password is correct"
echo "3. User exists in auth.users"
echo "4. user_profiles entry exists with matching ID"
