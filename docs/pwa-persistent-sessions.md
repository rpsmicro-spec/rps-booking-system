# PWA Persistent Sessions Configuration

## Overview
This document describes the changes made to ensure users remain logged in to the PWA until they manually log out.

## Changes Made

### 1. Browser Client Configuration (`src/lib/supabase/client.ts`)
- Added persistent storage configuration using `localStorage`
- Enabled `persistSession: true` to maintain sessions across browser restarts
- Enabled `autoRefreshToken: true` for automatic token refresh
- Sessions are now stored persistently in browser localStorage

### 2. Server Client Configuration (`src/lib/supabase/server.ts`)
- Removed "Remember Me" cookie dependency
- All auth cookies now use 30-day expiration by default
- Ensures consistent session behavior across the application

### 3. Middleware (`middleware.ts`)
- Created new middleware file (replaced old `proxy.ts`)
- All Supabase auth cookies are set with 30-day expiration
- Removed conditional logic based on "Remember Me" preference
- Uses proper Next.js middleware export pattern

### 4. Login API (`src/app/api/auth/login/route.ts`)
- Removed "Remember Me" parameter from login request
- All sessions now use persistent cookies by default
- Simplified cookie handling logic

### 5. Logout API (`src/app/api/auth/logout/route.ts`)
- Removed "Remember Me" cookie cleanup
- Maintains existing logout functionality (local vs global scope)

### 6. Login Form (`src/features/auth/components/LoginForm.tsx`)
- Removed "Remember Me" checkbox from UI
- Simplified form schema and validation
- Removed unused imports (Controller, Checkbox)

## Session Behavior

### Before Changes
- Without "Remember Me": Session expired when browser closed
- With "Remember Me": Session persisted for 30 days
- PWA users could be logged out unexpectedly

### After Changes
- All sessions persist for 30 days
- Sessions survive browser restarts and PWA reopening
- Users only log out when they explicitly use the logout button
- Session tokens automatically refresh before expiration

## Technical Details

### Cookie Configuration
- **maxAge**: 60 * 60 * 24 * 30 (30 days in seconds)
- **expires**: 30 days from creation
- **path**: '/' (site-wide availability)
- **sameSite**: 'lax' (CSRF protection)
- **secure**: true (in production only)

### Storage Strategy
- **Client-side**: localStorage (persistent)
- **Server-side**: HTTP-only cookies with 30-day expiration
- **Auto-refresh**: Tokens refresh automatically before expiration

## Benefits for PWA Users

1. **Seamless Experience**: Users remain logged in across app launches
2. **No Unexpected Logouts**: Only manual logout will end the session
3. **Improved Usability**: No need to remember to check "Remember Me"
4. **Consistent Behavior**: Same experience whether using PWA or browser

## Security Considerations

- Sessions still expire after 30 days of inactivity
- Users can manually log out at any time
- Logout can be scoped to current device or all devices
- Tokens are automatically refreshed using secure refresh tokens
- All cookies use secure flags in production

## Testing

To verify the changes:

1. **Login Test**: Log in without "Remember Me" checkbox (removed)
2. **Persistence Test**: Close and reopen the PWA - should remain logged in
3. **Browser Restart**: Restart browser and open PWA - should remain logged in
4. **Manual Logout**: Use logout button - should properly clear session
5. **Token Refresh**: Wait for token to expire (should auto-refresh in background)

## Migration Notes

- Existing sessions will continue to work
- Users with active sessions will automatically get persistent cookies on next request
- No database migrations required
- No user action required

