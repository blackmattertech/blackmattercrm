You are working in the `blackmattercrm` project. Implement a production-quality Blogs UI/UX frontend for the CRM app.

## Context
- The app is React + TypeScript + Vite.
- Navigation already includes `Blogs` and currently renders a placeholder:
  - `frontend/src/app/modules/Blogs.tsx`
- Design system uses existing components under:
  - `frontend/src/app/components/ui/*`
- Existing app style and patterns are in:
  - `frontend/src/app/modules/CRM.tsx`
  - `frontend/src/app/components/TopHeader.tsx`
  - `frontend/src/app/components/PageHeader.tsx`
- Keep the look consistent with BlackMatter CRM theme (clean cards, rounded corners, soft borders, logo-green accents).
- Blog DB migrations are already run. Use real DB tables/columns (no guessed schema).

## Database schema references (must use actual migrated names)
- First, inspect the database schema and confirm exact table/column names before coding API bindings.
- Expected primary entities (use actual names from DB):
  - Blogs table (commonly `public.blogs`)
  - Blog categories table (commonly `public.blog_categories`)
  - Optional blog tags join table (commonly `public.blog_tags` or `public.blog_post_tags`)
  - Optional blog authors table (or use existing `user_profiles` as author source)
- If table names differ, **use migrated names exactly** and keep frontend naming mapped via types/adapters.

### Required DB fields to map (or nearest equivalent columns)
- Blog:
  - `id`
  - `title`
  - `slug`
  - `excerpt`
  - `content`
  - `featured_image_url`
  - `category_id` (or category text)
  - `status` (`draft`, `in_review`, `scheduled`, `published`, `archived`)
  - `scheduled_at`
  - `published_at`
  - `author_id`
  - `seo_title`
  - `seo_description`
  - `created_at`
  - `updated_at`
- Category:
  - `id`
  - `name`
  - `slug` (if available)

### API/data contract (frontend)
- Use CRM backend API if available; otherwise wire a typed service layer that matches these operations:
  - `getBlogs(params)` with search/filter/sort/pagination
  - `getBlog(id)`
  - `createBlog(payload)`
  - `updateBlog(id, payload)`
  - `deleteBlog(id)`
  - `getBlogCategories()`
- Add clear TODO markers only where backend endpoint is not yet present.

## Goal
Replace the placeholder Blogs page with a full frontend experience:
1. Blog listing/table view
2. Search/filter/sort
3. Create/Edit blog form UI
4. Blog detail preview drawer/modal
5. Status workflow UX (Draft / In Review / Scheduled / Published / Archived)

## Requirements

### 1) Blogs page structure
- Build a full `Blogs` module in `frontend/src/app/modules/Blogs.tsx` (or split into subcomponents if cleaner).
- Include:
  - Header with title, subtitle, and primary CTA (`New Blog`)
  - KPI cards (e.g., Total, Drafts, Published, Scheduled)
  - Tabs or segmented controls for status buckets
  - Main table/list of blogs

### 2) Table/list columns
At minimum show:
- Title
- Author
- Category
- Tags
- Status (badge)
- Created At
- Updated At
- Scheduled At (if any)
- Actions menu (View, Edit, Duplicate, Delete)

### 3) UX interactions
- Search by title/author/category.
- Filter by status + category.
- Sort by updated date desc by default.
- Pagination (client-side is fine initially).
- Empty states and loading states with polished UI.
- Confirmation dialog for delete.

### 4) Create/Edit form
- Form fields:
  - Title (required)
  - Slug (auto-generate from title, editable)
  - Excerpt
  - Content (textarea/editor-like area for now)
  - Featured image URL
  - Category
  - Tags (comma-separated input -> chips)
  - Status
  - Scheduled publish datetime (visible when Scheduled)
  - SEO title / meta description (optional section)
- Validation:
  - Required title
  - Slug format check
  - Scheduled datetime required if status is Scheduled
- Use existing `ui` components for consistent style.

### 5) Detail preview
- Add a detail modal/drawer showing:
  - Hero image (if available)
  - Title, meta, status, category, tags
  - Content preview
  - Created/updated/scheduled timestamps

### 6) Data layer
- Implement frontend data hooks/service in a clean way:
  - If backend blog APIs already exist, wire to them with the actual migrated table-backed fields.
  - If APIs are not ready, create a temporary typed mock data layer with TODO comments for API integration, but keep types aligned to migrated DB fields listed above.
- Keep types strict with a dedicated `Blog` interface.

### 7) Date/time formatting
- Use IST display format consistently:
  - `DD-MMM-YY HH:MM AM/PM`
- Reuse existing formatter utilities where possible.

### 8) Visual consistency
- Reuse badge styles similar to CRM status visuals.
- Use brand green accents for primary actions and important highlights.
- Ensure good text contrast in light/dark mode.

## Engineering constraints
- Keep code modular and readable.
- No breaking changes to existing sections (CRM, Accounts, etc.).
- Avoid introducing heavy new dependencies unless absolutely necessary.
- Keep TypeScript strict and avoid `any`.
- Run and fix lint/type/build issues for changed files.

## Deliverables
1. Updated blogs UI implementation
2. Any supporting component files/hooks/types
3. Short summary of:
   - files changed
   - key UX behaviors implemented
   - exact table names/columns used from migrated DB
   - follow-up TODOs for backend API integration (if mocked)

## Acceptance criteria
- Clicking `Blogs` in top nav opens a fully functional frontend page (not placeholder).
- User can create/edit/delete blog entries through UI flow.
- Status filters and search work.
- Dates are displayed in IST format.
- Build succeeds without new lint/type errors.
