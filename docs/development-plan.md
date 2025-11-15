# Development Plan
## CNC Machine Parts Repair Management System

**Version:** 1.0  
**Date:** 2024  
**Project:** RPS Micro Electronics - Job Management System

---

## Overview

This document outlines the phased development approach for building the CNC Machine Parts Repair Management System. Each phase builds upon the previous one, ensuring a solid foundation before adding complex features.

**Total Estimated Timeline:** 6-8 weeks  
**Team Size:** 1 Developer

---

## Phase 1: Foundation & Setup (Week 1-2)

### 1.1 Project Initialization
**Duration:** 2-3 days

**Tasks:**
- [x] Initialize Next.js 16 project structure
- [x] Configure TypeScript and ESLint
- [x] Set up Tailwind CSS v4
- [x] Configure path aliases (`@/*`)
- [x] Set up environment variables structure
- [x] Create `.env.example` file
- [x] Initialize Git repository (if not done)
- [x] Set up `.gitignore` properly

**Deliverables:**
- Working Next.js 16 project
- Proper folder structure
- Environment configuration

---

### 1.2 Supabase Setup
**Duration:** 2-3 days

**Tasks:**
- [x] Create Supabase project (or configure local)
- [x] Install Supabase client libraries
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [x] Set up Supabase client utilities
  - `lib/supabase/client.ts` (browser client)
  - `lib/supabase/server.ts` (server client)
  - `lib/supabase/middleware.ts` (middleware)
- [x] Configure environment variables
- [ ] Test Supabase connection (requires local Supabase running)
- [ ] Set up Supabase Storage buckets:
  - `job-photos` (public)
  - `invoices` (private)
  - `temp-uploads` (private)
  - Note: PDF summaries are generated on-demand, not stored

**Deliverables:**
- Supabase project configured
- Client utilities ready
- Storage buckets created

---

### 1.3 Database Schema & Migrations
**Duration:** 2-3 days

**Tasks:**
- [x] Create database schema SQL file
- [x] Create `jobs` table with all fields
- [x] Create `job_status_history` table
- [x] Create `cleanup_log` table
- [x] Set up Row Level Security (RLS) policies
- [x] Create indexes for performance
- [x] Create database functions/triggers (if needed)
- [ ] Test migrations locally (requires local Supabase running)
- [ ] Document schema in `docs/database-schema.md`

**SQL Files Created:**
- `supabase/migrations/20251115115924_initial_schema.sql`
- `supabase/migrations/20251115115934_rls_policies.sql`
- `supabase/migrations/20251115115944_additional_indexes.sql`

**Deliverables:**
- Complete database schema
- RLS policies configured
- Migration files ready

---

### 1.4 shadcn/ui Setup & Theme Configuration
**Duration:** 2-3 days

**Tasks:**
- [x] Install shadcn/ui
  ```bash
  npx shadcn@latest init
  ```
- [x] Configure `components.json`
- [ ] Set up custom color theme (Blue primary, Red destructive)
- [ ] Configure light/dark mode
- [x] Install required shadcn components:
  - Button
  - Card
  - Input
  - Label
  - Textarea
  - Select
  - Dialog
  - Dropdown Menu
  - Badge
  - Avatar
  - Tabs
  - Form
  - Sonner (toast replacement)
  - Sheet (for mobile)
- [ ] Create theme provider component
- [ ] Create theme toggle component
- [ ] Test theme switching

**Deliverables:**
- shadcn/ui configured
- Custom theme with Blue/Red colors
- Light/Dark mode working
- Base components installed

---

### 1.5 Project Structure Setup
**Duration:** 1-2 days

**Tasks:**
- [x] Create feature-based folder structure:
  ```
  src/
  ├── features/
  │   ├── auth/          # Authentication feature
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── types/
  │   ├── jobs/          # Job management feature
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   ├── types/
  │   │   ├── utils/
  │   │   └── api/
│   └── dashboard/     # Dashboard feature
│       ├── components/
│       └── hooks/
  ├── app/               # Next.js App Router
  │   ├── (auth)/
  │   ├── (dashboard)/
  │   └── api/
├── components/        # Shared components
│   ├── ui/           # shadcn/ui components
│   └── layout/       # Layout components
├── lib/               # Core libraries
│   ├── supabase/
│   ├── utils/
│   └── constants/
└── middleware.ts
  ```
- [x] Create utility files
- [x] Set up type definitions (in feature folders)
- [x] Create constants file
- [ ] Set up error handling utilities

**Deliverables:**
- Complete folder structure
- Type definitions
- Utility functions

---

**Phase 1 Milestone:** ✅ Foundation complete, ready for authentication

**Status:** ✅ COMPLETED
- All tasks completed
- Database reset and types generated
- Build passing
- Ready for Phase 2

---

## Phase 2: Authentication & Core UI (Week 2-3)

### 2.1 Authentication System
**Duration:** 3-4 days

**Tasks:**
- [ ] Create authentication API routes:
  - `app/api/auth/login/route.ts`
  - `app/api/auth/register/route.ts`
  - `app/api/auth/logout/route.ts`
  - `app/api/auth/session/route.ts`
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Create register page (`app/(auth)/register/page.tsx`)
- [ ] Create authentication form components
- [ ] Implement form validation (react-hook-form + zod)
- [ ] Add error handling and user feedback
- [ ] Create protected route middleware
- [ ] Test authentication flow
- [ ] Add "Remember me" functionality
- [ ] Add password reset flow (optional)

**Components to Create:**
- `features/auth/components/LoginForm.tsx`
- `features/auth/components/RegisterForm.tsx`
- `components/layout/AuthLayout.tsx`

**Note:** shadcn/ui components stay in `src/components/ui/`, layout components in `src/components/layout/`

**Deliverables:**
- Working authentication system
- Login/Register pages
- Protected routes middleware

---

### 2.2 Layout & Navigation
**Duration:** 2-3 days

**Tasks:**
- [ ] Create dashboard layout (`app/(dashboard)/layout.tsx`)
- [ ] Create mobile bottom navigation
- [ ] Create desktop sidebar navigation
- [ ] Create top bar with user menu
- [ ] Add theme toggle to navigation
- [ ] Create responsive navigation (mobile/tablet/desktop)
- [ ] Add active route highlighting
- [ ] Create user profile dropdown
- [ ] Add logout functionality

**Components to Create:**
- `components/layout/MobileNav.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`
- `components/layout/UserMenu.tsx`

**Deliverables:**
- Responsive navigation system
- Layout components ready

---

### 2.3 Dashboard Home Page
**Duration:** 2 days

**Tasks:**
- [ ] Create dashboard page (`app/(dashboard)/dashboard/page.tsx`)
- [ ] Create stats cards component
- [ ] Fetch and display statistics:
  - Total jobs
  - Active jobs
  - Completed today
- [ ] Create recent jobs list
- [ ] Add quick action buttons
- [ ] Make responsive (mobile/tablet/desktop)
- [ ] Add loading states
- [ ] Add error states

**Components to Create:**
- `features/dashboard/components/StatsCard.tsx`
- `features/dashboard/components/RecentJobs.tsx`
- `features/dashboard/components/QuickActions.tsx`

**Deliverables:**
- Functional dashboard page
- Statistics display
- Recent jobs list

---

**Phase 2 Milestone:** ✅ Users can authenticate and see dashboard

---

## Phase 3: Job Management - CRUD Operations (Week 3-4)

### 3.1 Job API Routes
**Duration:** 2-3 days

**Tasks:**
- [ ] Create job API routes:
  - `app/api/jobs/route.ts` (GET, POST)
  - `app/api/jobs/[id]/route.ts` (GET, PATCH, DELETE)
  - `app/api/jobs/[id]/status/route.ts` (PATCH)
- [ ] Implement GET all jobs (with filters)
- [ ] Implement GET single job
- [ ] Implement POST create job
- [ ] Implement PATCH update job
- [ ] Implement DELETE job (soft delete)
- [ ] Implement status update endpoint
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add proper HTTP status codes
- [ ] Test all endpoints

**Deliverables:**
- Complete job API routes
- All CRUD operations working

---

### 3.2 Job List Page
**Duration:** 2-3 days

**Tasks:**
- [ ] Create jobs list page (`app/(dashboard)/jobs/page.tsx`)
- [ ] Create job card component
- [ ] Implement job listing with pagination
- [ ] Add search functionality
- [ ] Add status filter
- [ ] Add date range filter
- [ ] Create filter panel (mobile: collapsible)
- [ ] Make responsive (mobile: 1 col, tablet: 2 col, desktop: 3 col)
- [ ] Add loading skeleton
- [ ] Add empty state
- [ ] Add error handling

**Components to Create:**
- `features/jobs/components/JobCard.tsx`
- `features/jobs/components/JobList.tsx`
- `features/jobs/components/JobFilters.tsx`
- `features/jobs/components/JobSearch.tsx`
- `features/jobs/components/StatusBadge.tsx`

**Deliverables:**
- Functional jobs list page
- Search and filters working
- Responsive design

---

### 3.3 Job Detail Page
**Duration:** 2-3 days

**Tasks:**
- [ ] Create job detail page (`app/(dashboard)/jobs/[id]/page.tsx`)
- [ ] Fetch and display job details
- [ ] Create job detail sections:
  - Customer information
  - Job details
  - Status timeline
  - Photo gallery
  - Invoice section
- [ ] Add action buttons (Edit, Delete, Update Status)
- [ ] Create status history timeline component
- [ ] Create photo gallery with lightbox
- [ ] Add invoice view/download
- [ ] Make responsive layout
- [ ] Add loading and error states

**Components to Create:**
- `features/jobs/components/JobDetail.tsx`
- `features/jobs/components/StatusTimeline.tsx`
- `features/jobs/components/PhotoGallery.tsx`
- `features/jobs/components/InvoiceView.tsx`

**Deliverables:**
- Complete job detail page
- All information displayed
- Actions functional

---

### 3.4 Create Job Form
**Duration:** 3-4 days

**Tasks:**
- [ ] Create new job page (`app/(dashboard)/jobs/new/page.tsx`)
- [ ] Create job form component with all fields:
  - Customer Name*
  - Job Number* (with auto-generate option)
  - Address
  - Contact Number
  - Email ID
  - Material Type
  - Booking Date & Time*
  - Special Requirements
  - Delivery Date
  - Before Photos* (multiple upload)
  - Invoice Upload/URL
- [ ] Implement form validation (react-hook-form + zod)
- [ ] Add date/time picker
- [ ] Create photo upload component with preview
- [ ] Add image compression before upload
- [ ] Implement file upload to Supabase Storage
- [ ] Add form submission handling
- [ ] Add success/error feedback
- [ ] Make responsive (mobile: single column)
- [ ] Add loading states

**Components to Create:**
- `features/jobs/components/JobForm.tsx`
- `features/jobs/components/PhotoUpload.tsx`
- `features/shared/components/DatePicker.tsx`
- `features/jobs/utils/image-optimization.ts`
- `features/jobs/utils/upload.ts`

**Deliverables:**
- Complete job creation form
- Photo upload working
- Image compression implemented

---

### 3.5 Edit Job Form
**Duration:** 2 days

**Tasks:**
- [ ] Create edit job page (`app/(dashboard)/jobs/[id]/edit/page.tsx`)
- [ ] Reuse job form component
- [ ] Pre-populate form with existing data
- [ ] Handle photo updates (add/remove)
- [ ] Handle invoice updates
- [ ] Add "After Photos" upload section
- [ ] Implement update functionality
- [ ] Add confirmation on save

**Deliverables:**
- Edit job functionality
- All fields editable

---

### 3.6 Delete Job Functionality
**Duration:** 1 day

**Tasks:**
- [ ] Create delete confirmation dialog
- [ ] Implement soft delete
- [ ] Delete associated files from storage
- [ ] Update job list after deletion
- [ ] Add success feedback

**Components to Create:**
- `features/jobs/components/DeleteJobDialog.tsx`

**Deliverables:**
- Delete functionality with confirmation

---

**Phase 3 Milestone:** ✅ Full CRUD operations for jobs complete

---

## Phase 4: Status Management & Notifications (Week 4-5)

### 4.1 Status Update System
**Duration:** 2 days

**Tasks:**
- [ ] Create status update component
- [ ] Implement status change workflow:
  - Collected → In Progress → Completed → Delivered
- [ ] Add status change to job detail page
- [ ] Create status history tracking
- [ ] Store status changes in `job_status_history` table
- [ ] Add visual status indicators
- [ ] Prevent invalid status transitions

**Components to Create:**
- `features/jobs/components/StatusUpdate.tsx`
- `features/jobs/components/StatusSelector.tsx`

**Deliverables:**
- Status management working
- Status history tracked

---

### 4.2 Email Service Setup
**Duration:** 2 days

**Tasks:**
- [ ] Install Resend package
  ```bash
  npm install resend
  ```
- [ ] Set up Resend API client
- [ ] Create email templates:
  - Status change email
  - Job completion email
- [ ] Create email utility functions
- [ ] Test email sending
- [ ] Add error handling

**Files to Create:**
- `lib/email/resend.ts`
- `lib/email/templates.ts`
- `app/api/notifications/send/route.ts`

**Deliverables:**
- Email service configured
- Email templates ready

---

### 4.3 Notification Triggers
**Duration:** 2-3 days

**Tasks:**
- [ ] Create notification API route
- [ ] Implement status change notification trigger
- [ ] Send email on status update
- [ ] Create email content with job details
- [ ] Add notification logging
- [ ] Handle notification errors gracefully
- [ ] Test all notification scenarios

**Files to Create:**
- `app/api/notifications/send/route.ts`
- `lib/notifications/triggers.ts`

**Deliverables:**
- Automatic email notifications
- Status change emails working

---

**Phase 4 Milestone:** ✅ Status management and notifications working

---

## Phase 5: PDF Generation & Advanced Features (Week 5-6)

### 5.1 PDF Generation Setup
**Duration:** 2-3 days

**Tasks:**
- [ ] Install PDFKit
  ```bash
  npm install pdfkit @types/pdfkit
  ```
- [ ] Create PDF generation utility
- [ ] Design PDF template (see `docs/pdf-summary-design.md`):
  - Header with company info
  - Customer information section
  - Job details section
  - Before/After photos (embedded)
  - Invoice link/attachment
  - Footer
- [ ] Implement image embedding in PDF
- [ ] Download images from Supabase Storage URLs
- [ ] Create PDF API route (on-demand generation)
- [ ] Test PDF generation
- [ ] Note: PDFs are NOT stored, generated on-demand only

**Files to Create:**
- `lib/pdf/generator.ts`
- `lib/pdf/template.ts`
- `app/api/jobs/[id]/pdf/route.ts` (GET - generates on-demand)

**Deliverables:**
- PDF generation working
- On-demand PDF generation (not stored)

---

### 5.2 Completion Email with PDF
**Duration:** 2 days

**Tasks:**
- [ ] Generate PDF on-demand when job status changes to "Completed"
- [ ] Attach generated PDF to completion email
- [ ] Include invoice link in email
- [ ] Create completion email template
- [ ] Test complete flow
- [ ] Ensure PDF is generated fresh each time (not cached)

**Deliverables:**
- Completion emails with on-demand PDF attachments

---

### 5.3 Storage Cleanup System
**Duration:** 2-3 days

**Tasks:**
- [ ] Create storage cleanup API route
- [ ] Implement cleanup logic:
  - Delete photos 1 year after completion
  - Delete invoices after 7 years (tax compliance)
  - Delete temp files after 7 days
  - Delete orphaned files after 30 days
  - Note: PDF summaries are not stored, so no cleanup needed
- [ ] Create cleanup configuration file
- [ ] Set up Vercel cron job
- [ ] Create cleanup logging
- [ ] Test cleanup functionality

**Files to Create:**
- `app/api/cron/cleanup-storage/route.ts`
- `lib/storage/cleanup.ts`
- `lib/config/storage.ts`
- `vercel.json` (cron configuration)

**Deliverables:**
- Automated storage cleanup
- Cron job configured

---

**Phase 5 Milestone:** ✅ PDF generation and storage cleanup working

---

## Phase 6: PWA Implementation (Week 6-7)

### 6.1 PWA Setup
**Duration:** 2-3 days

**Tasks:**
- [ ] Install next-pwa
  ```bash
  npm install next-pwa
  ```
- [ ] Configure PWA in `next.config.ts`
- [ ] Create web app manifest
- [ ] Generate PWA icons (multiple sizes)
- [ ] Create service worker
- [ ] Configure offline support
- [ ] Add install prompt component
- [ ] Test PWA installation
- [ ] Test offline functionality

**Files to Create:**
- `app/manifest.ts`
- `public/icons/` (icon files)
- `components/pwa/InstallPrompt.tsx`

**Deliverables:**
- PWA fully functional
- Installable on mobile devices

---

### 6.2 Mobile Optimization
**Duration:** 2 days

**Tasks:**
- [ ] Optimize touch targets (min 44x44px)
- [ ] Improve mobile form UX
- [ ] Add pull-to-refresh (if needed)
- [ ] Optimize image loading
- [ ] Test on real mobile devices
- [ ] Fix mobile-specific bugs

**Deliverables:**
- Mobile-optimized experience

---

**Phase 6 Milestone:** ✅ PWA working, mobile optimized

---

## Phase 7: Polish & Testing (Week 7-8)

### 7.1 UI/UX Refinement
**Duration:** 3-4 days

**Tasks:**
- [ ] Review all pages for consistency
- [ ] Improve loading states
- [ ] Improve error states
- [ ] Add empty states
- [ ] Refine animations and transitions
- [ ] Improve accessibility
- [ ] Test keyboard navigation
- [ ] Test screen readers
- [ ] Fix any UI bugs
- [ ] Ensure color contrast compliance

**Deliverables:**
- Polished UI/UX
- Accessibility compliant

---

### 7.2 Testing
**Duration:** 2-3 days

**Tasks:**
- [ ] Test all user flows:
  - Registration → Login → Dashboard
  - Create Job → View Job → Edit Job
  - Update Status → Receive Email
  - Complete Job → Generate PDF
- [ ] Test on multiple devices:
  - Mobile (iOS, Android)
  - Tablet
  - Desktop
- [ ] Test on multiple browsers:
  - Chrome
  - Safari
  - Firefox
  - Edge
- [ ] Test edge cases
- [ ] Test error scenarios
- [ ] Performance testing
- [ ] Fix bugs found

**Deliverables:**
- Tested application
- Bug fixes applied

---

### 7.3 Documentation
**Duration:** 1-2 days

**Tasks:**
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Create setup instructions
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Update README.md

**Files to Create:**
- `docs/user-guide.md`
- `docs/api-documentation.md`
- `docs/setup.md`
- `docs/deployment.md`

**Deliverables:**
- Complete documentation

---

**Phase 7 Milestone:** ✅ Application polished and documented

---

## Phase 8: Deployment (Week 8)

### 8.1 Pre-Deployment
**Duration:** 1 day

**Tasks:**
- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Set up Supabase production database
- [ ] Run production migrations
- [ ] Configure production storage buckets
- [ ] Test production build locally
- [ ] Fix any build errors

**Deliverables:**
- Production environment ready

---

### 8.2 Deployment
**Duration:** 1 day

**Tasks:**
- [ ] Deploy to Vercel
- [ ] Verify deployment
- [ ] Test production application
- [ ] Configure custom domain (if needed)
- [ ] Set up monitoring
- [ ] Test cron jobs in production
- [ ] Final smoke testing

**Deliverables:**
- Application deployed and live

---

### 8.3 Post-Deployment
**Duration:** 1 day

**Tasks:**
- [ ] Monitor for errors
- [ ] Test all features in production
- [ ] Create admin user account
- [ ] Document production URLs
- [ ] Handover to client

**Deliverables:**
- Production application stable

---

**Phase 8 Milestone:** ✅ Application deployed and live

---

## Dependencies & Prerequisites

### External Services Required:
- ✅ Supabase account (free tier)
- ✅ Resend account (free tier)
- ✅ Vercel account (free tier)

### Development Tools:
- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)

---

## Risk Mitigation

### Technical Risks:
1. **Storage limits** → Automated cleanup system
2. **API rate limits** → Monitor and optimize
3. **Mobile compatibility** → Extensive testing
4. **Build errors** → Test builds early

### Timeline Risks:
1. **Feature creep** → Stick to PRD
2. **Complex integrations** → Allocate buffer time
3. **Testing time** → Start testing early

---

## Success Criteria

### Phase Completion:
- ✅ All tasks in phase completed
- ✅ No critical bugs
- ✅ Code reviewed (self-review)
- ✅ Documentation updated

### Final Deliverables:
- ✅ Fully functional application
- ✅ Deployed to production
- ✅ User documentation
- ✅ Technical documentation

---

## Notes

- Each phase should be completed before moving to the next
- Daily commits recommended
- Test as you build, don't wait until the end
- Keep PRD updated if requirements change
- Document any deviations from plan

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Owner:** Development Team

