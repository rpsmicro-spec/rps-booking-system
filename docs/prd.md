# Product Requirements Document (PRD)

## Job Management System

**Version:** 1.0
**Date:** 2024
**Project:** RPS Micro Electronics - Job Management System

---

## 1. Executive Summary

A Progressive Web App (PWA) for managing CNC machine parts repair business operations. The system allows internal staff to track customer jobs from collection to delivery, manage customer information, upload photos, generate invoices, and automatically notify customers via email and WhatsApp.

---

## 2. Project Overview

### 2.1 Purpose

Streamline the repair business workflow by digitizing job tracking, customer management, and communication processes.

### 2.2 Target Users

- **Primary:** Internal staff members (multiple users)
- **Secondary:** Customers (via notifications only)

### 2.3 Key Goals

- Centralized job and customer management
- Automated status notifications via email
- Mobile-first PWA for on-the-go access
- Public job view pages for customer access (no authentication required)
- Efficient storage management

---

## 3. Technical Stack

### 3.1 Frontend

- **Framework:** Next.js 16 (App Router)
- **UI Library:** shadcn/ui
- **Styling:** Tailwind CSS
- **Theme:** Light/Dark mode support
- **Colors:** Blue (primary), Red (destructive/actions)
- **PWA:** next-pwa for mobile app experience

### 3.2 Backend

- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **File Upload:** Supabase Storage buckets

### 3.3 Services

- **Email:** Resend API
- **Hosting:** Vercel
- **Cron Jobs:** Vercel Cron (for automated cleanup)

---

## 4. Core Features

### 4.1 Authentication

- **Login:** Email and password authentication
- **Invite-Only System:** No public registration. Users are invited by admins/owners
- **Password Setup:** Invited users receive email link to set their password
- **Password Reset:** Forgot password flow with email reset link
- **Session Management:** Secure session handling via Supabase
- **Protected Routes:** All dashboard routes require authentication
- **Multi-user Support:** Multiple staff members can access the system
- **Role-Based Access:** Owner, Admin, and Staff roles with different permissions

### 4.2 Job Management (Full CRUD)

#### 4.2.1 Create Job

**Fields:**

- Customer Name\* (text, 2-100 characters)
- Job Number\* (text, unique, auto-generated with configurable prefix/format)
- Address Fields (separate fields):
  - Address Street (optional, max 200 chars)
  - Address Area (optional, max 100 chars)
  - Address City (optional, max 100 chars)
  - Address State (optional, max 100 chars)
  - Address Pincode (optional, 6 digits)
- Contact Number\* (text, Indian phone number format validation)
- Email ID\* (email, required for notifications)
- Material Type (optional, max 100 chars)
- Booking Date\* (date picker, required)
- Special Requirements (optional, max 2000 chars, hidden from public view)
- Delivery Date (optional, date picker, must be >= booking date)
- Material Photos - Before\* (multiple file upload, max 10 photos, required)
- Material Photos - After (multiple file upload, max 10 photos, optional)
- Invoice File (PDF upload, max 5MB, optional)

**Validation:**

- Required fields marked with \*
- Email format validation
- Indian phone number format validation (10 digits, starts with 6-9)
- File size limits (5MB for photos, 5MB for invoices)
- Image compression on upload (automatic, max 5MB per image)
- Job number auto-generation (configurable via job number settings)
- Delivery date must be on or after booking date

#### 4.2.2 Read Jobs

- **List View:**
  - Card-based layout (mobile-first)
  - Grid view for tablets/desktop
  - Filters: Status, Date range, Customer name
  - Search functionality
  - Pagination or infinite scroll
- **Detail View:**
  - All job information
  - Photo gallery (before/after)
  - Status history timeline
  - Invoice download/view
  - Actions: Edit, Delete, Update Status

#### 4.2.3 Update Job

- Edit all job fields
- Update status (triggers notifications, validates workflow)
- Add/remove photos (max 10 before, max 10 after)
- Update/replace invoice file
- Status workflow validation (prevents invalid transitions):
  - Collected → In Progress
  - In Progress → Completed
  - Completed → Delivered
  - Delivered → (no further transitions)
- All changes logged in audit log

#### 4.2.4 Delete Job

- Soft delete (sets `deleted_at` timestamp)
- Confirmation dialog
- Automatic cleanup of associated files from storage:
  - Before photos deleted from `job-photos` bucket
  - After photos deleted from `job-photos` bucket
  - Invoice file deleted from `invoices` bucket
- Deleted jobs excluded from all queries (filtered by `deleted_at IS NULL`)
- Audit log entry created for deletion

### 4.3 Status Management

**Status Flow:**

1. **Collected** - Initial status when job is created
2. **In Progress** - Work has started
3. **Completed** - Work is finished
4. **Delivered** - Job delivered to customer

**Status Change Actions:**

- Update status dropdown/button
- Workflow validation (prevents invalid status transitions)
- Automatic email notification via Resend (if job has email and public_token)
- Status history tracking (records old_status, new_status, changed_by, changed_at)
- Audit log entry created
- Public view link included in email notifications

### 4.4 Photo Management

- **Before Photos:** Upload at job creation (required, max 10 photos)
- **After Photos:** Upload when work is completed (optional, max 10 photos)
- **Features:**
  - Multiple file upload (drag & drop or click to select)
  - Image compression on upload (automatic, max 5MB per file)
  - Allowed formats: JPEG, PNG, WebP
  - Preview grid before/after upload
  - Delete individual photos (remove from array)
  - Gallery view with lightbox in job detail and public view
  - Stored in Supabase Storage `job-photos` bucket (public)

### 4.5 Invoice Management

- **Upload Option:** Upload PDF file (max 5MB)
- **Storage:** Supabase Storage `invoices` bucket (private)
- **Display:** 
  - Embedded PDF viewer in job detail view (internal)
  - Embedded PDF viewer in public job view (customer-facing)
  - Download button available
- **Retention:** Invoices kept for 7 years (tax compliance)

### 4.6 Public Job View (Customer Access)

**Purpose:** Allow customers to view their job details without authentication

**Access Method:**
- Each job has a unique `public_token` (auto-generated on job creation)
- Public URL format: `/jobs/view/[public_token]`
- No authentication required
- Token is a secure 32-character base64url-encoded random string

**Content Displayed:**
- Job number and current status
- Customer information (name, contact, email, address)
- Job details (booking date, delivery date, material type)
- Status timeline (history of all status changes)
- Before photos gallery
- After photos gallery
- Invoice (embedded PDF viewer + download)
- WhatsApp contact button (links to business WhatsApp)

**Hidden from Public View:**
- Special requirements (internal notes only)
- Internal audit logs
- User information

**Email Integration:**
- All status change emails include "View Job Details" button linking to public page
- Completion emails include "View Completed Job" button
- Public link format: `{APP_URL}/jobs/view/{public_token}`

### 4.7 Notifications

#### 4.7.1 Email Notifications (Resend)

**Status Change Email:**
- **Trigger:** When job status changes (if job has email and public_token)
- **Subject:** "Job [Job Number] Status Update - [Status Label]"
- **Content:**
  - Job number and new status
  - Material type (if available)
  - "View Job Details" button (links to public job view page)
  - WhatsApp contact link (optional)
  - Company contact information
- **Format:** HTML email with plain text fallback

**Completion Email:**
- **Trigger:** When job status changes to "Completed"
- **Subject:** "Job [Job Number] Completed - RPS Micro Electronics"
- **Content:**
  - Completion message
  - Job number, material type, delivery date
  - "View Completed Job" button (links to public job view page)
  - Invoice link (if invoice uploaded)
  - WhatsApp contact link (optional)
  - Company contact information
- **Format:** HTML email with plain text fallback

**Email Features:**
- Responsive HTML design
- Company branding
- Google Maps link to business location
- Automatic sending (non-blocking, failures logged but don't prevent status update)

#### 4.7.2 WhatsApp Links (Optional)

- WhatsApp contact links included in emails (not automatic messages)
- Links open WhatsApp with pre-filled message about the job
- Uses business WhatsApp number from configuration

### 4.8 Storage Management

- **Automatic Cleanup (via cron job):**
  - Photos: Delete 1 year after job completion
  - Invoices: Keep for 7 years (tax compliance)
  - Temp files: Delete after 7 days
  - Orphaned files: Delete after 30 days
- **Storage Buckets:**
  - `job-photos` (public): Before/after photos, max 5MB per file
  - `invoices` (private): Invoice PDFs, max 5MB per file
  - `temp-uploads` (private): Temporary files, auto-cleanup after 7 days
- **Optimization:** 
  - Image compression on upload (automatic)
  - Lazy loading for images in galleries
  - File size validation before upload

---

## 5. User Interface Requirements

### 5.1 Design System

- **Component Library:** shadcn/ui
- **Theme:** Light/Dark mode toggle
- **Color Scheme:**
  - Primary: Blue (#3B82F6 or similar)
  - Destructive: Red (#EF4444 or similar)
  - Background: Adaptive (light/dark)
  - Text: High contrast for accessibility

### 5.2 Responsive Design

- **Mobile First:** Optimized for mobile devices (320px+)
- **Tablet:** Responsive layout (768px+)
- **Desktop:** Full layout (1024px+)
- **Touch Targets:** Minimum 44x44px for mobile

### 5.3 Key Pages/Views

#### 5.3.1 Authentication Pages

- **Login Page:**
  - Email input
  - Password input
  - Remember me checkbox
  - Forgot password link
  - Mobile-optimized form
  - Redirects to dashboard on success

- **Forgot Password Page:**
  - Email input
  - Sends password reset link via email
  - Link expires after use

- **Reset Password Page:**
  - New password input
  - Confirm password input
  - Uses token from email link
  - Redirects to login on success

- **Setup Password Page:**
  - For invited users only
  - New password input
  - Confirm password input
  - Uses token from invitation email
  - Redirects to login on success

- **Note:** No public registration page (invite-only system)

#### 5.3.2 Dashboard

- **Overview:**
  - Stats cards (Total jobs, Active jobs, Completed today)
  - Recent jobs list
  - Quick actions (Create job)
  - Mobile: Stacked layout
  - Desktop: Grid layout

#### 5.3.3 Jobs List

- **Layout:**
  - Mobile: Card list (one per row)
  - Tablet: 2-column grid
  - Desktop: 3-column grid
- **Card Content:**
  - Job number (prominent)
  - Customer name
  - Status badge (color-coded)
  - Booking date
  - Quick actions (view, edit)
- **Filters:**
  - Status filter (chips/buttons)
  - Date range picker
  - Search bar
  - Mobile: Collapsible filter panel

#### 5.3.4 Job Detail View

- **Layout:**
  - Mobile: Stacked sections
  - Desktop: Two-column (info + photos)
- **Sections:**
  - Customer information
  - Job details
  - Status timeline
  - Photo gallery
  - Invoice section
  - Action buttons (Edit, Delete, Update Status)

#### 5.3.5 Create/Edit Job Form

- **Layout:**
  - Mobile: Single column, scrollable
  - Desktop: Two-column form
- **Features:**
  - Step-by-step form (optional)
  - Photo upload with preview
  - Date/time pickers
  - Validation feedback
  - Save draft option (future)

### 5.4 Navigation

- **Mobile:**
  - Bottom navigation bar (Home, Jobs, Create, Profile)
  - Hamburger menu for additional options
- **Desktop:**
  - Sidebar navigation
  - Top bar with user menu and theme toggle

### 5.5 PWA Features

- **Install Prompt:** "Add to Home Screen" prompt
- **Offline Support:** Service worker for offline viewing
- **App Icons:** Multiple sizes for different devices
- **Splash Screen:** Custom splash screen
- **Full Screen:** Standalone display mode

---

## 6. Database Schema

### 6.1 Jobs Table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  -- Separate address fields
  address_street TEXT,
  address_area TEXT,
  address_city TEXT,
  address_state TEXT,
  address_pincode TEXT,
  -- Legacy address field (kept for backward compatibility)
  address TEXT,
  contact_number TEXT,
  email TEXT,
  material_type TEXT,
  booking_date TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  special_requirements TEXT,
  status TEXT CHECK (status IN ('collected', 'in_progress', 'completed', 'delivered')) DEFAULT 'collected',
  before_photos TEXT[] DEFAULT '{}', -- Array of Supabase Storage URLs
  after_photos TEXT[] DEFAULT '{}', -- Array of Supabase Storage URLs
  invoice_file_path TEXT, -- Supabase Storage path for uploaded invoice PDF
  invoice_url TEXT, -- Legacy field (kept for backward compatibility)
  public_token TEXT UNIQUE, -- Auto-generated secure token for public access
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Auto-generate public_token on insert
CREATE TRIGGER trigger_set_job_public_token
  BEFORE INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION set_job_public_token();
```

### 6.2 Job Status History Table

```sql
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Cleanup Log Table

```sql
CREATE TABLE cleanup_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cleanup_type TEXT NOT NULL,
  resource_id UUID,
  resource_type TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  metadata JSONB
);
```

### 6.4 Job Number Settings Table

```sql
CREATE TABLE job_number_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prefix TEXT, -- e.g., "JOB"
  number_base TEXT, -- e.g., "001"
  next_number INTEGER, -- Next number to use
  year INTEGER, -- Current year for year-based numbering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.5 Audit Log Table

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- e.g., 'job.created', 'job.updated', 'job.deleted', 'job.status_changed'
  resource_type TEXT, -- e.g., 'job', 'user'
  resource_id UUID,
  details JSONB, -- Additional context about the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.6 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('owner', 'admin', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Routes

### 7.1 Authentication

- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current session
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/invite` - Invite new user (admin/owner only)

### 7.2 Jobs

- `GET /api/jobs` - List all jobs (with filters: status, search, dateFrom, dateTo, pagination)
- `GET /api/jobs/[id]` - Get job details (authenticated)
- `POST /api/jobs` - Create new job (auto-generates job number if not provided)
- `PATCH /api/jobs/[id]` - Update job (all fields editable)
- `DELETE /api/jobs/[id]` - Soft delete job (deletes associated files)
- `PATCH /api/jobs/[id]/status` - Update status (validates workflow, triggers notifications)
- `GET /api/jobs/[id]/status-history` - Get status change history
- `GET /api/jobs/settings` - Get job number generation settings
- `PUT /api/jobs/settings` - Update job number generation settings

### 7.3 File Upload

- File uploads handled client-side via Supabase Storage SDK
- Photos uploaded to `job-photos` bucket (public)
- Invoices uploaded to `invoices` bucket (private)
- Automatic image compression on photo upload
- File validation (size, type) before upload

### 7.4 Public Job View

- `GET /jobs/view/[token]` - Public job view page (no authentication required)
- Uses `public_token` from jobs table to fetch job data
- Displays all customer-visible information

### 7.5 Notifications

- `POST /api/notifications/send` - Send email notification (requires jobId and notificationType)
- Automatically triggered on status change (if job has email and public_token)
- Notification types: 'status_change' or 'completion'
- Includes public job view link in all emails

### 7.6 Cron Jobs

- `GET /api/cron/cleanup-storage` - Daily storage cleanup (requires CRON_SECRET)
- Deletes old photos, temp files, and orphaned files based on retention policies

### 7.7 Users Management

- `GET /api/users/me` - Get current user information
- `GET /api/users` - List all users (admin/owner only)
- `POST /api/users` - Create/invite user (admin/owner only)
- `PATCH /api/users/[id]` - Update user (admin/owner only)
- `DELETE /api/users/[id]` - Delete user (admin/owner only)

### 7.8 Audit Log

- `GET /api/audit-log` - Get audit log entries (admin/owner only, with filters)

---

## 8. Storage Buckets (Supabase)

### 8.1 Bucket Configuration

1. **job-photos** (public)

   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   - Auto-compression on upload

2. **invoices** (private)

   - Max file size: 5MB
   - Allowed types: application/pdf
   - Retention: 7 years

3. **temp-uploads** (private)
   - Max file size: 5MB
   - Auto-cleanup: 7 days

---

## 9. Security Requirements

### 9.1 Authentication

- Password hashing (Supabase handles this)
- JWT token-based sessions
- Secure cookie storage
- Session timeout

### 9.2 Authorization

- Row Level Security (RLS) in Supabase
- Role-based access control:
  - **Owner:** Full access (users, activity, all jobs)
  - **Admin:** Full access (users, activity, all jobs)
  - **Staff:** Jobs and customers only (no user management, no activity log)
- Public job view uses token-based access (no authentication required)
- Audit log entries track all user actions

### 9.3 Data Protection

- Encrypted file storage
- Private buckets for sensitive data
- Secure file upload validation
- SQL injection prevention (Supabase handles)

### 9.4 API Security

- Rate limiting on API routes
- CORS configuration
- Input validation and sanitization

---

## 10. Performance Requirements

### 10.1 Page Load

- Initial load: < 3 seconds
- Subsequent navigation: < 1 second
- Image optimization: Lazy loading, WebP format

### 10.2 Mobile Performance

- Touch response: < 100ms
- Smooth scrolling: 60fps
- Offline capability: View cached jobs

### 10.3 Storage Optimization

- Image compression: 60-80% size reduction
- Lazy loading for images
- Pagination for large lists

---

## 11. Accessibility Requirements

### 11.1 WCAG Compliance

- Minimum AA level compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### 11.2 Mobile Accessibility

- Touch target sizes: Minimum 44x44px
- Readable font sizes: Minimum 16px
- Color contrast: 4.5:1 minimum

---

## 12. Testing Requirements

### 12.1 Unit Tests

- Utility functions
- API route handlers
- Form validation

### 12.2 Integration Tests

- Authentication flow
- Job CRUD operations
- File upload/download
- Notification sending

### 12.3 E2E Tests

- Complete user workflows
- Mobile device testing
- Cross-browser testing

---

## 13. Deployment

### 13.1 Environment

- **Production:** Vercel
- **Database:** Supabase (cloud)
- **Storage:** Supabase Storage

### 13.2 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

### 13.3 CI/CD

- Automatic deployment on push to main
- Build verification
- Environment variable validation

---

## 14. Future Enhancements (Out of Scope)

- WhatsApp API integration (automatic messages)
- PDF summary generation (currently using public web pages instead)
- Advanced reporting and analytics
- Export to Excel/CSV
- Bulk operations
- Email templates customization UI
- Multi-language support
- SMS notifications
- Calendar integration
- Reminder notifications
- Customer portal with login (currently using public token links)

---

## 15. Success Metrics

### 15.1 User Adoption

- Number of active users
- Jobs created per day/week
- User login frequency

### 15.2 System Performance

- Average page load time
- Storage usage trends
- API response times

### 15.3 Business Impact

- Time saved on manual tracking
- Customer satisfaction (via notifications)
- Error reduction in job management

---

## 16. Timeline & Milestones

### Phase 1: Foundation (Week 1-2)

- Project setup
- Supabase configuration
- Authentication system
- Basic UI components

### Phase 2: Core Features (Week 3-4)

- Job CRUD operations
- File upload system
- Status management
- Basic notifications

### Phase 3: Advanced Features (Week 5-6)

- Public job view pages
- Email notifications with public links
- Storage cleanup
- PWA implementation

### Phase 4: Polish & Deploy (Week 7-8)

- UI/UX refinement
- Testing
- Documentation
- Deployment

---

## 17. Risk Assessment

### 17.1 Technical Risks

- **Storage limits:** Mitigated by automated cleanup
- **API rate limits:** Monitor and optimize
- **Mobile compatibility:** Extensive testing

### 17.2 Business Risks

- **User adoption:** Intuitive UI, training materials
- **Data loss:** Regular backups, soft deletes

---

## 18. Support & Maintenance

### 18.1 Monitoring

- Error tracking (Sentry or similar)
- Performance monitoring
- Storage usage alerts

### 18.2 Maintenance

- Regular dependency updates
- Security patches
- Feature enhancements based on feedback

---

**Document Version:** 2.0  
**Last Updated:** November 2024  
**Owner:** Development Team

---

## 19. Implementation Notes

### 19.1 Key Implementation Details

- **Public Access:** Uses secure token-based public pages instead of PDF generation
- **Address Fields:** Separate address fields (street, area, city, state, pincode) for better data structure
- **Job Number Generation:** Configurable auto-generation with prefix, number base, and year support
- **Status Workflow:** Enforced validation prevents invalid status transitions
- **Soft Deletes:** Jobs are soft-deleted (deleted_at timestamp) and excluded from queries
- **Audit Logging:** All user actions are logged with IP address and user agent
- **File Cleanup:** Automatic deletion of associated files when job is deleted
- **Image Compression:** Automatic compression on photo upload to optimize storage
- **Email Notifications:** Non-blocking, failures don't prevent status updates

### 19.2 Differences from Original PRD

1. **No PDF Generation:** Replaced with public web pages for better UX and easier updates
2. **Separate Address Fields:** Instead of single address text field
3. **Invite-Only System:** No public registration, users must be invited
4. **Invoice Upload Only:** No URL option for invoices (upload PDF only)
5. **Public Token System:** Secure token-based public access instead of PDF links
6. **Role-Based Access:** Owner, Admin, Staff roles with different permissions
7. **Audit Logging:** Comprehensive logging of all system actions

---
