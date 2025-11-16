# Email Templates Configuration

This project uses Supabase's built-in email system for authentication emails. The templates are configured in `supabase/config.toml` and stored in `supabase/templates/`.

## Templates

### Password Reset (`reset_password.html`)

- **Trigger:** When user requests password reset
- **Subject:** "Reset your password"
- **Template:** `supabase/templates/reset_password.html`

### Email Confirmation (`confirmation.html`)

- **Trigger:** When user signs up (if email confirmation is enabled)
- **Subject:** "Confirm your email address"
- **Template:** `supabase/templates/confirmation.html`

## Configuration

Templates are configured in `supabase/config.toml`:

```toml
[auth.email.template.confirmation]
subject = "Confirm your email address"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.recovery]
subject = "Reset your password"
content_path = "./supabase/templates/reset_password.html"
```

## Template Variables

Supabase provides these variables in templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link URL
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Your site URL from config

## Production Setup

For production (Supabase Cloud):

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Customize the templates there
4. Or use the same template files and configure via Supabase CLI

## Local Development

For local development:

1. Templates are automatically loaded from `supabase/templates/`
2. Make sure `supabase/config.toml` points to the correct paths
3. Restart Supabase: `supabase stop && supabase start`

## Testing

To test email templates locally:

1. Use the forgot password flow
2. Check the Supabase logs: `supabase logs auth`
3. Or use Inbucket (local email testing): `http://127.0.0.1:54324`
