# BlackMatter ERP System

A comprehensive, production-ready ERP ecosystem built with React, TypeScript, Node.js, and Supabase.

## Project Structure

This is a monorepo with separate `frontend/` and `backend/` directories:
- **Frontend**: React application in `frontend/` directory
- **Backend**: Node.js API server in `backend/` directory

See the [Project Structure](#project-structure) section below for details.

## Features

### 🔐 Authentication
- Email and password authentication (Supabase built-in)
- Role-based access control (Admin, Sales, Developers, Designers)
- Secure session management with JWT tokens
- No external services required - completely free

### 📊 CRM Module
- Lead management with pipeline stages
- Customer relationship tracking
- Task assignment and tracking
- Follow-up scheduling
- Activity logging
- Kanban board view

### 💰 Accounts Module
- Double-entry accounting system
- Chart of accounts
- Invoice management (Sales/Purchase)
- Payment tracking
- Receipt generation
- GST tracking
- Income & expense ledger
- Trial balance generation
- Director capital accounts
- Bank ledger

### 👥 Teams Module
- Freelancer/team member profiles
- Availability calendar
- Earnings tracking
- Project assignment
- Status tracking

### 📦 Products Module
- Services catalog
- SaaS subscription management
- Renewal tracking
- Billing cycles

### 📈 Marketing Module
- Campaign tracking
- Multi-platform ad metrics (Facebook, Instagram, Google, LinkedIn, TikTok, WhatsApp)
- ROI analytics
- Performance dashboards

### 🔔 Notification System
- Real-time notifications
- Deadline alerts
- Payment reminders
- Activity stream
- Priority-based notifications

### 📱 Dashboard Engine
- Aggregated analytics queries
- Redis caching layer
- Real-time summary widgets
- Performance metrics

## Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **ShadCN UI** - Component library
- **Zustand** - State management
- **Vite** - Build tool
- **PWA Ready** - Progressive Web App support

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Supabase** - Database, Auth, Storage, Phone OTP
- **Redis** - Caching layer

## Project Structure

```
blackmattercrm/
├── backend/                 # Backend API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Auth, error handling
│   │   ├── database/       # Schema and migrations
│   │   └── utils/          # Utilities
│   └── package.json
├── frontend/               # Frontend React application
│   ├── src/
│   │   ├── app/            # React application
│   │   │   ├── components/ # Reusable components
│   │   │   ├── modules/    # Feature modules
│   │   │   └── utils/      # Utilities
│   │   ├── lib/            # API client
│   │   ├── store/          # Zustand stores
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- Redis instance (local or cloud)
- Twilio account (optional, for SMS OTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blackmattercrm
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Set up environment variables**
   - Copy `backend/.env.example` to `backend/.env` and fill in your values
   - Create `.env` in `frontend/` with `VITE_API_URL=http://localhost:3001/api`

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema from `backend/src/database/schema.sql` in Supabase SQL Editor

5. **Start Redis**
   ```bash
   # macOS
   brew services start redis
   
   # Or use Docker
   docker run -d -p 6379:6379 redis:alpine
   ```

6. **Run the application**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

### Authentication

1. Enter your mobile number on the login page
2. Receive OTP via SMS (or check console in development)
3. Enter the 6-digit OTP to login
4. First-time users are automatically created with 'sales' role

### Roles

- **Admin**: Full access to all modules
- **Sales**: Access to CRM, Accounts, Products, Marketing
- **Developers**: Access to Teams, Products, Dashboard
- **Designers**: Access to Teams, Products, Dashboard

### Modules

Each module provides:
- List/table views with filtering and search
- Create, read, update, delete operations
- Real-time updates
- Activity logging
- Export capabilities (coming soon)

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user with email and password
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Logout user

### CRM Endpoints

- `GET /api/crm/leads` - Get all leads
- `POST /api/crm/leads` - Create new lead
- `GET /api/crm/leads/:id` - Get lead by ID
- `PUT /api/crm/leads/:id` - Update lead
- `DELETE /api/crm/leads/:id` - Delete lead
- `GET /api/crm/tasks` - Get all tasks
- `POST /api/crm/tasks` - Create task
- `GET /api/crm/followups` - Get followups
- `POST /api/crm/followups` - Create followup
- `GET /api/crm/activities` - Get activity logs

### Dashboard Endpoints

- `GET /api/dashboard/stats` - Get dashboard statistics (cached)
- `GET /api/dashboard/analytics` - Get analytics data (cached)

### Notifications Endpoints

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint configuration (recommended)
- Prettier formatting (recommended)

### Testing

```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
```

### Quick Start (Both Services)

You can also use the root-level scripts to run both services:

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend in development
npm run dev

# Build both for production
npm run build
```

## Security

- JWT-based authentication
- Role-based access control (RBAC)
- Row-level security (RLS) in Supabase
- Rate limiting on OTP endpoints
- Input validation with Zod
- SQL injection protection via Supabase
- CORS configuration
- Helmet.js security headers

## Performance

- Redis caching for dashboard queries
- Database indexing on frequently queried fields
- Optimistic UI updates
- Lazy loading for routes (ready for implementation)
- Image optimization (ready for implementation)

## Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Ensure Redis is accessible
5. Configure Supabase connection

### Frontend Deployment

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables
4. Set up CDN for static assets (recommended)

### Recommended Platforms

- **Backend**: Railway, Render, Fly.io, AWS, GCP
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase (included)
- **Redis**: Redis Cloud, Upstash, AWS ElastiCache

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Check the [DEPENDENCY.md](./DEPENDENCY.md) for setup issues
- Review the API documentation
- Check Supabase and Redis connection status

## Roadmap

- [ ] Complete Accounts module implementation
- [ ] Complete Teams module implementation
- [ ] Complete Products module implementation
- [ ] Complete Marketing module implementation
- [ ] Real-time updates with Supabase Realtime
- [ ] Advanced reporting and analytics
- [ ] PDF export functionality
- [ ] Email integration
- [ ] Mobile app (React Native)
- [ ] Advanced search
- [ ] Workflow automation
- [ ] API documentation with Swagger

---

Built with ❤️ for scalable business operations
  # blackmattercrm
