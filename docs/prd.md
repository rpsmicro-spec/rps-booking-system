# Product Requirements Document (PRD)

## CNC Machine Parts Repair Management System

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
- Automated status notifications
- Mobile-first PWA for on-the-go access
- Professional PDF summaries with before/after photos
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
- **PDF Generation:** PDFKit
- **Hosting:** Vercel
- **Cron Jobs:** Vercel Cron (for automated cleanup)

---

## 4. Core Features

### 4.1 Authentication

- **Login/Register:** Email and password authentication
- **Session Management:** Secure session handling via Supabase
- **Protected Routes:** All dashboard routes require authentication
- **Multi-user Support:** Multiple staff members can access the system

### 4.2 Job Management (Full CRUD)

#### 4.2.1 Create Job

**Fields:**

- Customer Name\* (text)
- Job Number\* (text, unique, auto-generated option)
- Address (text)
- Contact Number (text)
- Email ID (email)
- Material Type (text)
- Booking Date & Time\* (datetime picker)
- Special Requirements (textarea)
- Delivery Date (date picker)
- Material Photos - Before\* (multiple file upload)
- Material Photos - After (multiple file upload, available after job starts)
- Invoice Upload/URL (file upload or URL input)

**Validation:**

- Required fields marked with \*
- Email format validation
- Phone number format validation
- File size limits (5MB for photos, 10MB for invoices)
- Image compression on upload

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
- Update status (triggers notifications)
- Add/remove photos
- Update invoice
- Status workflow: Collected → In Progress → Completed → Delivered

#### 4.2.4 Delete Job

- Soft delete option (mark as deleted)
- Confirmation dialog
- Cascade delete associated files from storage

### 4.3 Status Management

**Status Flow:**

1. **Collected** - Initial status when job is created
2. **In Progress** - Work has started
3. **Completed** - Work is finished
4. **Delivered** - Job delivered to customer

**Status Change Actions:**

- Update status dropdown/button
- Automatic email notification via Resend
- Automatic WhatsApp notification (if configured)
- Status history tracking

### 4.4 Photo Management

- **Before Photos:** Upload at job creation
- **After Photos:** Upload when work is completed
- **Features:**
  - Multiple file upload
  - Image compression (max 1MB, 1920px max dimension)
  - Preview before upload
  - Delete individual photos
  - Gallery view with lightbox

### 4.5 Invoice Management

- **Upload Option:** Upload PDF file from Tally export
- **URL Option:** Paste Tally invoice URL (if available)
- **Storage:** Supabase Storage (private bucket)
- **Display:** View/download invoice in job details

### 4.6 PDF Summary Generation

**Trigger:** When job status changes to "Completed"

**Content:**

- Customer information
- Job details (job number, dates, material type)
- Special requirements
- Before photos (embedded)
- After photos (embedded)
- Invoice link/attachment
- Generated date

**Generation:** On-demand via API (not stored in database/storage)
**Delivery:** Attached to completion email, generated when needed

### 4.7 Notifications

#### 4.7.1 Email Notifications (Resend)

- **Status Change:** Email sent on every status update
  - Subject: "Job [Job Number] Status Updated"
  - Content: Current status, next steps, contact info
- **Completion:** Email with PDF summary attached
  - Subject: "Job [Job Number] Completed"
  - Content: Completion message, PDF summary, invoice link

#### 4.7.2 WhatsApp Notifications (Future/Optional)

- Status change messages
- Completion notification with summary link

### 4.8 Storage Management

- **Automatic Cleanup:**
  - Photos: Delete 1 year after job completion
  - Invoices: Keep for 7 years (tax compliance)
  - PDF Summaries: Delete after 3 years
  - Temp files: Delete after 7 days
  - Orphaned files: Delete after 30 days
- **Monitoring:** Storage usage alerts at 80% capacity
- **Optimization:** Image compression on upload

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
  - Remember me option
  - Forgot password link
  - Mobile-optimized form

- **Register Page:**
  - Name, email, password fields
  - Confirm password
  - Terms acceptance
  - Mobile-optimized form

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
  address TEXT,
  contact_number TEXT,
  email TEXT,
  material_type TEXT,
  booking_date TIMESTAMPTZ NOT NULL,
  delivery_date TIMESTAMPTZ,
  special_requirements TEXT,
  status TEXT CHECK (status IN ('collected', 'in_progress', 'completed', 'delivered')) DEFAULT 'collected',
  before_photos TEXT[], -- Array of Supabase Storage URLs
  after_photos TEXT[], -- Array of Supabase Storage URLs
  invoice_url TEXT, -- Tally invoice URL (if available)
  invoice_file_path TEXT, -- Supabase Storage path for uploaded invoice
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
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

---

## 7. API Routes

### 7.1 Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### 7.2 Jobs

- `GET /api/jobs` - List all jobs (with filters)
- `GET /api/jobs/[id]` - Get job details
- `POST /api/jobs` - Create new job
- `PATCH /api/jobs/[id]` - Update job
- `DELETE /api/jobs/[id]` - Delete job
- `PATCH /api/jobs/[id]/status` - Update status (triggers notifications)

### 7.3 File Upload

- `POST /api/upload/photos` - Upload job photos
- `POST /api/upload/invoice` - Upload invoice file
- `DELETE /api/upload/[fileId]` - Delete file

### 7.4 PDF Generation

- `GET /api/jobs/[id]/pdf` - Generate and download PDF summary (on-demand, not stored)

### 7.5 Notifications

- `POST /api/notifications/send` - Send email/WhatsApp
- `POST /api/notifications/test` - Test notification

### 7.6 Cron Jobs

- `GET /api/cron/cleanup-storage` - Daily storage cleanup

---

## 8. Storage Buckets (Supabase)

### 8.1 Bucket Configuration

1. **job-photos** (public)

   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp
   - Auto-compression on upload

2. **invoices** (private)

   - Max file size: 10MB
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
- Users can only access their organization's data
- Admin role for system management (future)

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

- WhatsApp API integration
- Customer portal (view their jobs)
- Advanced reporting and analytics
- Export to Excel/CSV
- Bulk operations
- Email templates customization
- Multi-language support
- SMS notifications
- Calendar integration
- Reminder notifications

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

- PDF generation
- Email notifications
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

**Document Version:** 1.0  
**Last Updated:** 2024  
**Owner:** Development Team

---
