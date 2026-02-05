# ERP Design System Documentation

## Overview
This is a modern, scalable ERP (Enterprise Resource Planning) system built with a mobile-first approach and PWA-ready architecture. The design follows principles from Linear, Notion, and Stripe dashboards.

## Design Principles

### 1. Mobile-First Responsive Design
- All components are designed to work seamlessly on mobile, tablet, and desktop
- Touch-friendly interface elements with appropriate sizing
- Responsive navigation with bottom tab bar on mobile and sidebar on desktop

### 2. Modern Aesthetic
- Clean, minimal interface with high information density
- Soft shadows and rounded corners for depth
- Premium look with carefully crafted spacing and typography
- Dark and light mode ready

### 3. Notification-First UX
- Real-time activity feeds across the system
- Priority-based notification system
- Notification badges on navigation items
- Toast notifications for actions

### 4. Fast Action Access
- Quick Actions floating button for common tasks
- Keyboard shortcuts ready
- One-click access to key functions
- Search functionality across modules

## Color System

### Brand Colors
- **Primary**: Dynamic based on theme (dark/light)
- **Secondary**: Muted tones for secondary actions
- **Accent**: Highlight and focus states

### Status Colors
- **Active/Success**: Emerald (#10b981)
- **Pending/Warning**: Amber (#f59e0b)
- **Inactive**: Gray (#6b7280)
- **Overdue/Error**: Red (#ef4444)
- **Draft**: Purple (#8b5cf6)
- **Info**: Blue (#3b82f6)

### Semantic Colors
All colors support dark mode variants automatically through CSS custom properties.

## Typography Scale

### Headings
- **H1**: 2xl - Page titles
- **H2**: xl - Section headings
- **H3**: lg - Card headings
- **H4**: base - Subsection titles

### Body Text
- **Base**: Default text size (16px)
- **Small**: Secondary information
- **Extra Small**: Metadata and timestamps

### Font Weights
- **Medium (500)**: Headings, labels, emphasized text
- **Normal (400)**: Body text, descriptions

## Spacing System
- **XS**: 0.25rem (4px)
- **SM**: 0.5rem (8px)
- **MD**: 1rem (16px)
- **LG**: 1.5rem (24px)
- **XL**: 2rem (32px)
- **2XL**: 3rem (48px)

## Shadow System
- **SM**: Subtle elevation for cards
- **MD**: Standard card elevation
- **LG**: Modal and dropdown elevation
- **XL**: Maximum elevation for overlays

## Components Library

### Core Components

#### 1. **StatusBadge**
Displays status with color-coded indicators
- Variants: active, pending, inactive, overdue, draft, paid, unpaid, sent, cancelled
- Includes dot indicator
- Dark mode support

#### 2. **MetricCard**
Display key metrics with trends
- Icon with customizable color
- Value with optional change indicator
- Trend arrows (up/down)
- Subtitle support

#### 3. **PageHeader**
Consistent page headers across all modules
- Title and description
- Search functionality
- Action buttons
- Breadcrumb ready

#### 4. **EmptyState**
User-friendly empty states
- Icon
- Title and description
- Optional call-to-action button

#### 5. **LoadingState**
Loading indicators
- Spinner animation
- Custom message support

#### 6. **ChartCard**
Wrapper for analytics charts
- Title and subtitle
- Action menu
- Consistent styling

#### 7. **DataTable**
Reusable table component
- Custom column definitions
- Row click handlers
- Responsive overflow
- Empty state handling

#### 8. **QuickActions**
Floating action button
- Dropdown menu with common actions
- Context-aware actions
- Mobile and desktop optimized

#### 9. **StatsWidget**
Compact metric display
- Icon indicator
- Trend support
- Configurable styling

### Navigation Components

#### AppLayout
Main application shell
- **Desktop**: Collapsible sidebar navigation
- **Mobile**: Bottom tab bar + hamburger menu
- **Theme Toggle**: Built-in dark/light mode switch
- **User Profile**: Quick access to user info
- **Notification Badge**: Unread count indicator

### Form Components (shadcn/ui based)
- Input fields with validation
- Select dropdowns
- Textareas
- Date pickers
- Switches and checkboxes
- Radio groups
- Labels

### UI Components
- Buttons (variants: default, outline, ghost, destructive)
- Cards with hover effects
- Dialogs and modals
- Dropdown menus
- Tabs
- Tooltips
- Toast notifications (Sonner)
- Scroll areas
- Separators
- Skeletons for loading

## Modules

### 1. Dashboard
- **Bird's eye overview** of business operations
- Real-time activity feed with filters
- Key metrics cards with trends
- Revenue vs Expenses chart (Line chart)
- Sales pipeline visualization (Bar chart)
- Active projects with progress bars
- Upcoming tasks with priorities

### 2. CRM (Customer Relationship Management)
- **List View**: Comprehensive lead table
- **Pipeline View**: Kanban board by sales stage
- Lead detail modal with activity timeline
- Create/edit lead functionality
- Contact information management
- Deal value tracking
- Assignment to team members

### 3. Accounts (Financial Management)
- Financial overview metrics
- **Invoices Tab**: Invoice management with status tracking
- **Expenses Tab**: Expense logging and tracking
- **Reports Tab**: Income statement and cash flow
- Payment tracking
- Export functionality
- Outstanding balance monitoring

### 4. Products & Services
- Product catalog
- Service offerings
- Subscription management
- Pricing tiers
- One-time and recurring billing
- Subscriber count tracking
- Product status management

### 5. Marketing
- Campaign performance dashboard
- Multi-platform tracking (Meta, Google, LinkedIn)
- Key metrics: Impressions, clicks, spend, ROI
- Campaign status management
- Performance analytics

### 6. Teams
- Freelancer management
- Team member profiles
- Availability tracking
- Project assignment
- Earnings tracking
- Contact management
- Status indicators

### 7. Notifications
- Centralized notification center
- Type-based categorization
- Read/unread status
- Time-based sorting
- Priority alerts
- Actionable notifications

### 8. Settings
- **Company Tab**: Business information
- **Users & Roles Tab**: Team member management
- **Integrations Tab**: API connections (Stripe, Google, Slack, etc.)
- **Preferences Tab**: Notification settings
- Role-based access control ready

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layouts
- Bottom navigation bar
- Hamburger menu for extended navigation
- Touch-optimized controls
- Stacked metrics
- Simplified tables (horizontal scroll)

### Tablet (768px - 1024px)
- Two-column layouts
- Hybrid navigation
- Optimized spacing
- Grid-based metrics

### Desktop (> 1024px)
- Multi-column layouts
- Persistent sidebar navigation
- Maximum information density
- Hover states and interactions
- Multi-panel views

## Accessibility Features

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Screen reader friendly
- Touch target sizing (44x44px minimum)

## Performance Optimizations

- Lazy loading for routes (ready for implementation)
- Optimized re-renders with React state management
- Responsive images
- SVG icons (Lucide React)
- CSS variables for theming
- Minimal bundle size

## Dark Mode

- Automatic theme switching
- CSS custom properties for colors
- Preserved across sessions (localStorage ready)
- Smooth transitions
- All components support both themes

## PWA Features (Ready for Implementation)

- Service worker ready
- Installable on mobile devices
- Offline capability structure
- App manifest ready
- Push notifications ready

## Future Enhancements

### Phase 2 Features
- Real-time collaboration
- Advanced search with filters
- Export functionality (PDF, CSV, Excel)
- Bulk actions
- Advanced analytics with more chart types
- Calendar integration
- Task management module
- Document management
- Email integration
- Multi-language support

### Phase 3 Features
- AI-powered insights
- Predictive analytics
- Automated workflows
- Custom dashboard builder
- Advanced reporting engine
- Mobile app (React Native)

## Technology Stack

- **Framework**: React 18.3.1
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)
- **Toast Notifications**: Sonner
- **Build Tool**: Vite
- **Type Safety**: TypeScript ready

## File Structure

```
/src
├── /app
│   ├── App.tsx                 # Main application entry
│   ├── /components             # Reusable components
│   │   ├── AppLayout.tsx       # Main layout with navigation
│   │   ├── StatusBadge.tsx     # Status indicators
│   │   ├── MetricCard.tsx      # Metric display cards
│   │   ├── PageHeader.tsx      # Page headers
│   │   ├── EmptyState.tsx      # Empty state component
│   │   ├── LoadingState.tsx    # Loading indicators
│   │   ├── ChartCard.tsx       # Chart wrapper
│   │   ├── DataTable.tsx       # Table component
│   │   ├── QuickActions.tsx    # Quick action button
│   │   ├── StatsWidget.tsx     # Stat display widget
│   │   └── /ui                 # shadcn/ui components
│   └── /modules                # Feature modules
│       ├── Dashboard.tsx       # Dashboard module
│       ├── CRM.tsx            # CRM module
│       ├── Accounts.tsx       # Accounts module
│       ├── Products.tsx       # Products module
│       ├── Marketing.tsx      # Marketing module
│       ├── Teams.tsx          # Teams module
│       ├── Notifications.tsx  # Notifications module
│       └── Settings.tsx       # Settings module
└── /styles
    ├── theme.css              # Design system tokens
    ├── tailwind.css           # Tailwind directives
    └── fonts.css              # Font imports
```

## Usage Guidelines

### Adding New Modules
1. Create module component in `/src/app/modules`
2. Import in `App.tsx`
3. Add route to navigation in `AppLayout.tsx`
4. Follow existing patterns for consistency

### Creating New Components
1. Use shadcn/ui components as base
2. Follow composition pattern
3. Support dark mode
4. Make responsive by default
5. Include proper TypeScript types

### Styling Best Practices
1. Use Tailwind utility classes
2. Leverage design system tokens
3. Keep mobile-first approach
4. Use semantic color variables
5. Maintain consistent spacing

## Brand Identity

### Logo Placement
- Sidebar header (desktop)
- Mobile header
- Loading screens
- Login/authentication pages

### Voice & Tone
- Professional yet friendly
- Clear and concise
- Action-oriented
- Helpful and supportive

---

**Version**: 1.0.0  
**Last Updated**: February 4, 2026  
**Maintained by**: ERP Development Team
