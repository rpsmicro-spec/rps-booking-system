# GitHub Actions Workflows

## Supabase Migrations

This workflow automatically deploys database migrations to your Supabase project when changes are pushed to the main branch.

### Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

1. **SUPABASE_PROJECT_REF** (Required)
   - Your Supabase project reference ID
   - Find this in your Supabase dashboard: **Project Settings** → **General** → **Reference ID**
   - It's a string like `abcdefghijklmnop`
   - Example: `abcdefghijklmnop`

2. **SUPABASE_ACCESS_TOKEN** (Required)
   - Your Supabase access token for API authentication
   - Generate this in your Supabase dashboard: **Account Settings** → **Access Tokens**
   - Click **Generate new token** and give it a name (e.g., "GitHub Actions")
   - Copy the token and add it as a secret
   - This token allows the CLI to authenticate with your Supabase project and apply migrations

### How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value

### Workflow Behavior

- **Triggers**: Runs on push to `main` or `master` branch when:
  - Files in `supabase/migrations/` are changed
  - The workflow file itself is updated

- **Actions**:
  1. Checks out the code
  2. Sets up Node.js and installs dependencies
  3. Installs Supabase CLI
  4. Links to your Supabase project
  5. Pushes all pending migrations
  6. (Optional) Verifies migration status

### Manual Trigger

You can also manually trigger this workflow:

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy Supabase Migrations**
3. Click **Run workflow**
