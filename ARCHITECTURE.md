# Architecture Overview

## System Architecture

```
┌─────────────────┐
│   React Frontend │
│   (Vite + TS)   │
└────────┬─────────┘
         │ HTTP/REST
         │
┌────────▼─────────┐
│  Express Backend │
│   (Node.js + TS) │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│Supabase│ │ Redis │
│(Postgres│ │(Cache)│
│+ Auth) │ │       │
└────────┘ └───────┘
```

## Frontend Architecture

### State Management
- **Zustand** for global state (auth, user preferences)
- **React Hooks** for component-level state
- **API Client** for server communication

### Component Structure
```
frontend/src/
├── app/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # ShadCN UI primitives
│   │   └── ...           # Custom components
│   ├── modules/          # Feature modules
│   │   ├── Dashboard.tsx
│   │   ├── CRM.tsx
│   │   └── ...
│   └── utils/            # Module utilities
├── lib/              # Utilities and API client
└── store/            # Zustand stores
```

### Routing
- Single-page application with section-based navigation
- Protected routes via authentication check
- Role-based module access

## Backend Architecture

### API Structure
```
backend/src/
├── routes/           # Express route handlers
│   ├── auth.routes.ts
│   ├── crm.routes.ts
│   └── ...
├── services/         # Business logic layer
│   ├── otp.service.ts
│   ├── crm.service.ts
│   └── ...
├── middleware/       # Express middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
└── database/         # Schema and migrations
    └── schema.sql
```

### Request Flow
1. Client sends request with JWT token
2. `auth.middleware` validates token
3. Route handler processes request
4. Service layer handles business logic
5. Supabase client executes database queries
6. Response returned to client

### Caching Strategy
- **Redis** for frequently accessed data
- Dashboard stats cached for 5 minutes
- Cache invalidation on data updates
- Fallback to database on cache miss

## Database Architecture

### Supabase (PostgreSQL)

#### Core Tables
- `user_profiles` - User information and roles
- `otp_codes` - OTP verification storage
- `leads` - CRM leads
- `customers` - Converted leads
- `tasks` - Task management
- `followups` - Follow-up scheduling
- `activity_logs` - Audit trail

#### Accounting Tables
- `chart_of_accounts` - Account structure
- `journal_entries` - Double-entry transactions
- `journal_entry_lines` - Transaction line items
- `invoices` - Sales/Purchase invoices
- `payments` - Payment records
- `receipts` - Receipt records
- `bank_accounts` - Bank account management
- `bank_ledger` - Bank transaction ledger
- `director_capital_accounts` - Director accounts

#### Team Management
- `team_members` - Team/freelancer profiles
- `availability_calendar` - Availability tracking
- `project_assignments` - Project assignments
- `earnings` - Earnings tracking

#### Products & Marketing
- `products` - Product/service catalog
- `subscriptions` - SaaS subscriptions
- `campaigns` - Marketing campaigns
- `campaign_metrics` - Campaign performance

#### System
- `notifications` - User notifications
- `audit_logs` - System audit trail

### Indexing Strategy
- Primary keys on all tables
- Foreign key indexes
- Composite indexes on frequently queried columns
- Full-text search indexes (ready for implementation)

### Row Level Security (RLS)
- Enabled on sensitive tables
- User-based access policies
- Role-based access policies
- Admin override capabilities

## Authentication Flow

```
1. User enters phone number
   ↓
2. Backend generates 6-digit OTP
   ↓
3. OTP stored in database + Redis
   ↓
4. OTP sent via SMS (Twilio) or logged (dev)
   ↓
5. User enters OTP
   ↓
6. Backend verifies OTP
   ↓
7. Create/update user in Supabase Auth
   ↓
8. Create/update user profile
   ↓
9. Generate JWT token
   ↓
10. Return token to client
    ↓
11. Client stores token
    ↓
12. Token included in all API requests
```

## Security Architecture

### Authentication
- OTP-based phone authentication
- JWT tokens for API access
- Token stored in localStorage (can be upgraded to httpOnly cookies)
- Token expiration handling

### Authorization
- Role-based access control (RBAC)
- Middleware-level permission checks
- Database-level RLS policies
- Route-level role requirements

### Data Protection
- Input validation with Zod
- SQL injection protection (Supabase)
- XSS protection (React)
- CORS configuration
- Helmet.js security headers
- Rate limiting on OTP endpoints

## Performance Optimizations

### Frontend
- Code splitting (ready for implementation)
- Lazy loading routes
- Optimistic UI updates
- Debounced search inputs
- Virtual scrolling for large lists

### Backend
- Redis caching for dashboard queries
- Database query optimization
- Connection pooling (Supabase)
- Response compression
- Request rate limiting

### Database
- Strategic indexing
- Query optimization
- Materialized views (ready for implementation)
- Partitioning for large tables (ready for implementation)

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Redis for session management
- Load balancer ready
- Database connection pooling

### Vertical Scaling
- Efficient database queries
- Caching layer reduces DB load
- Async processing ready for implementation

### Future Enhancements
- Message queue for background jobs
- CDN for static assets
- Database read replicas
- Microservices split (if needed)

## Monitoring & Logging

### Logging
- Winston logger for backend
- Structured logging
- Error tracking
- Request logging

### Monitoring (Ready for Implementation)
- Health check endpoints
- Performance metrics
- Error rate tracking
- User activity tracking

## Deployment Architecture

### Development
- Local Redis instance
- Supabase cloud database
- Local development servers

### Production (Recommended)
- **Frontend**: Vercel/Netlify/Cloudflare Pages
- **Backend**: Railway/Render/Fly.io
- **Database**: Supabase (managed)
- **Cache**: Redis Cloud/Upstash
- **CDN**: Cloudflare (optional)

### Environment Variables
- Separate `.env` files for dev/prod
- Secrets management via platform
- Environment-specific configurations

## API Design Principles

### RESTful Conventions
- Resource-based URLs
- HTTP method semantics
- Status code usage
- Error response format

### Response Format
```json
{
  "success": true,
  "data": {...},
  "message": "..."
}
```

### Error Handling
- Consistent error format
- Appropriate HTTP status codes
- Error logging
- User-friendly error messages

## Data Flow Examples

### Creating a Lead
```
Frontend → API Client → Auth Middleware → CRM Route → CRM Service → Supabase → Response
```

### Dashboard Stats (Cached)
```
Frontend → API Client → Dashboard Route → Check Redis → 
  Cache Hit: Return cached data
  Cache Miss: Query Supabase → Cache result → Return data
```

### Real-time Updates (Future)
```
Supabase Realtime → WebSocket → Frontend Store → UI Update
```

## Module Dependencies

```
Dashboard
  ├── CRM (leads count)
  ├── Accounts (revenue)
  ├── Tasks (active tasks)
  └── Notifications (alerts)

CRM
  ├── Leads
  ├── Tasks (linked)
  ├── Followups
  └── Activity Logs

Accounts
  ├── Chart of Accounts
  ├── Journal Entries
  ├── Invoices
  └── Payments
```

## Extension Points

### Adding New Modules
1. Create module component in `src/app/modules/`
2. Add route in `backend/src/routes/`
3. Create service in `backend/src/services/`
4. Add database tables in schema
5. Update navigation in `AppLayout`

### Adding New Features
1. Define API endpoints
2. Implement service logic
3. Create frontend components
4. Add state management
5. Update documentation

---

This architecture is designed for:
- ✅ Scalability
- ✅ Maintainability
- ✅ Security
- ✅ Performance
- ✅ Developer Experience
