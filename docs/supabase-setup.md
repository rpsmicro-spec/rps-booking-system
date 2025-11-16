# Supabase Site URL and Redirect URIs Setup Guide

This guide explains how to configure your Supabase project's site URL and redirect URIs for authentication flows.

## Overview

Supabase requires specific URL configurations to allow authentication redirects. This includes:
- **Site URL**: The base URL of your application
- **Redirect URIs**: Specific URLs that Supabase can redirect to after authentication actions

## Required Redirect URIs

Based on the application's authentication flows, you need to configure the following redirect URIs:

### Production URLs

If your production URL is `https://yourdomain.com`, add:

```
https://yourdomain.com
https://yourdomain.com/setup-password
https://yourdomain.com/reset-password
https://yourdomain.com/login
```

### Development URLs

For local development, these are already configured in `supabase/config.toml`:

```
http://localhost:3000
http://localhost:3000/setup-password
http://localhost:3000/reset-password
http://localhost:3000/login
http://127.0.0.1:3000
http://127.0.0.1:3000/setup-password
http://127.0.0.1:3000/reset-password
http://127.0.0.1:3000/login
```

## How to Configure in Supabase Dashboard

### Step 1: Set Site URL

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Set the **Site URL** to your production domain:
   - Example: `https://yourdomain.com`
   - This is the base URL used for email links and redirects

### Step 2: Add Redirect URIs

1. In the same **URL Configuration** section
2. Under **Redirect URLs**, click **Add URL**
3. Add each of the following URLs (one at a time):

   ```
   https://yourdomain.com
   https://yourdomain.com/setup-password
   https://yourdomain.com/reset-password
   https://yourdomain.com/login
   ```

4. Click **Save** after adding each URL

### Step 3: Verify Configuration

After adding all URLs, your redirect URLs list should include:
- ✅ Base URL (for general redirects)
- ✅ `/setup-password` (for user invitation emails)
- ✅ `/reset-password` (for password reset emails)
- ✅ `/login` (for login redirects)

## Environment Variables

Make sure your production environment has the correct `NEXT_PUBLIC_APP_URL` set:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

This environment variable is used by:
- `/api/auth/invite` - User invitation emails
- `/api/auth/forgot-password` - Password reset emails

## Authentication Flows

### 1. User Invitation Flow

When an admin invites a user:
- Email sent with link to: `https://yourdomain.com/setup-password#access_token=...&type=invite`
- User clicks link → redirected to `/setup-password`
- User sets their password → redirected to dashboard

**Required Redirect URI**: `https://yourdomain.com/setup-password`

### 2. Password Reset Flow

When a user requests password reset:
- Email sent with link to: `https://yourdomain.com/reset-password#access_token=...&type=recovery`
- User clicks link → redirected to `/reset-password`
- User sets new password → redirected to dashboard

**Required Redirect URI**: `https://yourdomain.com/reset-password`

### 3. Login Flow

After successful login:
- User redirected to `/dashboard`
- If redirected from protected route, returns to original page

**Required Redirect URI**: `https://yourdomain.com/login` (for OAuth flows if enabled)

## Local Development

For local development, the URLs are already configured in `supabase/config.toml`:

```toml
[auth]
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "http://localhost:3000",
  "http://localhost:3000/setup-password",
  "http://localhost:3000/reset-password",
  "http://localhost:3000/login",
  # ... additional localhost variants
]
```

When running locally with `supabase start`, these URLs are automatically configured.

## Troubleshooting

### Issue: "Invalid redirect URL" error

**Solution**: 
- Verify the exact URL is added in Supabase dashboard (including protocol: `https://` or `http://`)
- Check that there are no trailing slashes
- Ensure the URL matches exactly what's in your email links

### Issue: Email links not working

**Solution**:
- Verify `NEXT_PUBLIC_APP_URL` environment variable is set correctly
- Check that the redirect URI is added in Supabase dashboard
- Ensure the site URL matches your production domain

### Issue: Local development redirects not working

**Solution**:
- Make sure `supabase/config.toml` has the correct localhost URLs
- Verify you're using the same port (default: 3000)
- Check that Supabase local instance is running: `supabase status`

## Security Notes

- ⚠️ **Never commit production URLs to git** - Use environment variables
- ⚠️ **Only add URLs you control** - Don't add external domains
- ⚠️ **Use HTTPS in production** - Always use `https://` for production URLs
- ⚠️ **Review redirect URLs regularly** - Remove unused URLs

## Quick Checklist

Before deploying to production, ensure:

- [ ] Site URL is set to your production domain
- [ ] All 4 redirect URIs are added (base, setup-password, reset-password, login)
- [ ] `NEXT_PUBLIC_APP_URL` environment variable is set
- [ ] All URLs use `https://` (not `http://`)
- [ ] No trailing slashes in URLs
- [ ] Test invitation email flow
- [ ] Test password reset email flow

## Additional Resources

- [Supabase Auth Configuration Docs](https://supabase.com/docs/guides/auth/auth-deep-dive/auth-deep-dive-jwts)
- [Supabase Redirect URLs Guide](https://supabase.com/docs/guides/auth/auth-helpers/redirect-urls)

