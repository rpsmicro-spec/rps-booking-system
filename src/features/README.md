# Feature-Based Directory Structure

This project uses a feature-based architecture where code is organized by domain/feature rather than by technical layer.

## Structure

```
src/
├── features/              # Feature modules
│   ├── auth/             # Authentication feature
│   │   ├── components/   # Auth-specific components
│   │   ├── hooks/        # Auth-specific hooks
│   │   ├── types/         # Auth-specific types
│   │   └── utils/         # Auth-specific utilities
│   │
│   ├── jobs/              # Job management feature
│   │   ├── components/    # Job-specific components
│   │   ├── hooks/         # Job-specific hooks
│   │   ├── types/         # Job-specific types
│   │   ├── utils/         # Job-specific utilities
│   │   └── api/           # Job API routes (if needed)
│   │
│   └── dashboard/         # Dashboard feature
│       ├── components/    # Dashboard-specific components
│       └── hooks/         # Dashboard-specific hooks
│
├── app/                   # Next.js App Router pages
│   ├── (auth)/           # Auth route group
│   ├── (dashboard)/      # Dashboard route group
│   └── api/              # API routes
│
├── components/            # Shared components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components (MobileNav, Sidebar, etc.)
│
├── lib/                   # Core libraries & configs
│   ├── supabase/         # Supabase clients
│   ├── constants/        # App-wide constants
│   └── utils/            # Core utilities
│
└── types/                 # Global types (if any)
```

## Principles

1. **Feature Isolation**: Each feature is self-contained with its own components, hooks, types, and utilities
2. **Shared Components**: Layout and UI components go in `components/` (ui for shadcn, layout for app layouts)
3. **Core Libraries**: Infrastructure code (Supabase, utilities) stays in `lib/`
4. **App Router**: Next.js pages and API routes in `app/`

## Import Paths

- `@/features/auth/*` - Auth feature
- `@/features/jobs/*` - Jobs feature
- `@/features/dashboard/*` - Dashboard feature
- `@/components/ui/*` - shadcn/ui components
- `@/components/layout/*` - Layout components
- `@/lib/*` - Core libraries
- `@/app/*` - App Router

## Example Usage

```typescript
// Import from feature
import { Job } from "@/features/jobs/types";
import { useJobs } from "@/features/jobs/hooks/useJobs";
import { JobCard } from "@/features/jobs/components/JobCard";

// Import UI components
import { Button } from "@/components/ui/button";

// Import layout components
import { Sidebar } from "@/components/layout/Sidebar";

// Import core
import { createClient } from "@/lib/supabase/client";
import { JOB_STATUS } from "@/lib/constants";
```
