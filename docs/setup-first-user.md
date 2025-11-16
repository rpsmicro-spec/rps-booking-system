# Setting Up the First Admin User

Since this is an internal app with invite-only access, you need to create the first admin user manually.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create New User**
4. Enter:
   - Email: `admin@yourcompany.com` (or your admin email)
   - Password: (set a secure password)
   - Auto Confirm User: ✅ (check this)
   - User Metadata: Add `{"role": "owner", "name": "Admin"}` in the JSON field
5. Click **Create User**

The user will be automatically created in the `users` table with owner role via database trigger.

**Note:** After creating the user, you can verify the role in the `users` table:

- Go to **Table Editor** → **users**
- Check that the user has `role = 'owner'`

## Option 2: Using Supabase CLI (Local Development)

1. Open Supabase Studio: `http://127.0.0.1:54323`
2. Go to **Authentication** → **Users**
3. Click **Add User** → **Create New User**
4. Enter email and password
5. Check **Auto Confirm User**
6. Click **Create User**

## Option 3: Using SQL (Advanced)

```sql
-- Insert user directly into auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@yourcompany.com',
  crypt('your-secure-password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  ''
);
```

## After Creating First User

1. Log in with the admin credentials
2. Navigate to **Invite User** in the sidebar
3. Invite other team members by entering their emails
4. They will receive an invitation email
5. They click the link, set their password, and can start using the app

## Notes

- The first user should be an admin/owner
- All subsequent users are added via the invite system
- Invited users receive an email with a link to set their password
- No public registration is available (registration page removed)
