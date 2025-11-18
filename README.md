# RPS Micro Electronics - Job Management System

A Progressive Web App (PWA) for managing CNC machine parts repair business operations. The system allows internal staff to track customer jobs from collection to delivery, manage customer information, upload photos, generate invoices, and automatically notify customers via email.

## 🚀 Features

- **Job Management**: Full CRUD operations for tracking repair jobs
- **Customer Management**: Store and manage customer information
- **Status Tracking**: Track jobs through workflow stages (Collected → In Progress → Completed → Delivered)
- **Photo Management**: Upload before/after photos with automatic compression
- **Invoice Management**: Upload and view PDF invoices
- **Public Job View**: Customers can view their job details via secure token-based links
- **Email Notifications**: Automatic email notifications on status changes
- **PWA Support**: Installable mobile app with offline capabilities
- **Role-Based Access**: Owner, Admin, and Staff roles with different permissions
- **Audit Logging**: Comprehensive logging of all system actions
- **Dark Mode**: Light/Dark theme support

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Email**: Resend API
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Resend API account (for email notifications)

## 🔧 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd rps-micro-electronics
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your_cron_secret
```

### 4. Set up Supabase

#### Run migrations

```bash
# Using Supabase CLI (if using local development)
supabase migration up

# Or apply migrations manually in Supabase dashboard
```

#### Create storage buckets

1. Go to Supabase Dashboard → Storage
2. Create the following buckets:
   - `job-photos` (public, max 5MB per file)
   - `invoices` (private, max 5MB per file)
   - `temp-uploads` (private, max 5MB per file)

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
rps-micro-electronics/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages (protected)
│   │   ├── api/                # API routes
│   │   └── jobs/view/          # Public job view pages
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   └── jobs/               # Job-specific components
│   ├── features/               # Feature-based modules
│   │   ├── auth/               # Authentication features
│   │   ├── jobs/               # Job management features
│   │   ├── customers/          # Customer management features
│   │   └── users/              # User management features
│   ├── lib/                    # Utility libraries
│   │   ├── supabase/           # Supabase client setup
│   │   ├── auth/               # Authentication helpers
│   │   ├── email/              # Email templates and utilities
│   │   └── storage/            # Storage utilities
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── migrations/             # Database migrations
└── public/                     # Static assets
```

## 🗄️ Database Schema

The system uses the following main tables:

- `jobs` - Job records with customer info, photos, invoices
- `job_status_history` - Status change history
- `users` - User accounts with roles
- `audit_log` - System action logging
- `job_number_settings` - Job number generation configuration
- `cleanup_log` - Storage cleanup tracking

See `docs/prd.md` for detailed schema information.

## 🔐 Authentication

- **Invite-Only System**: No public registration. Users must be invited by admins/owners
- **Password Setup**: Invited users receive email link to set their password
- **Password Reset**: Forgot password flow with email reset link
- **Roles**: Owner, Admin, and Staff with different permission levels

## 📧 Email Notifications

The system automatically sends email notifications when:

- Job status changes (if job has email and public_token)
- Job is completed

Emails include a link to the public job view page where customers can see their job details.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Set up Cron Jobs

Add a cron job in Vercel for automated storage cleanup:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-storage",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Storage Cleanup Retention Periods:**
- **Photos (images)**: 1 month after job completion
- **Videos**: 3 days after job completion
- **Invoices**: 1 week after job completion
- **Temp files**: 3 days after upload

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run types:generate` - Generate TypeScript types from Supabase schema (local)
- `npm run migration:new` - Create a new database migration
- `npm run migration:list` - List all migrations

## 🔒 Security

- Row Level Security (RLS) enabled on all Supabase tables
- Role-based access control (RBAC)
- Secure token-based public job access
- Input validation and sanitization
- Audit logging for all actions

## 📱 PWA Features

- Installable on mobile devices
- Offline viewing support
- Custom app icons and splash screen
- Service worker for caching

## 📚 Documentation

For detailed documentation, see:

- [Product Requirements Document](./docs/prd.md) - Complete feature specifications

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

## 📄 License

Private - All rights reserved

---

**Version**: 0.1.0  
**Last Updated**: November 2024
