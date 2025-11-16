# Supabase Migration Workflow

## Creating New Migrations

Always use the Supabase CLI to create new migrations:

```bash
npm run migration:new <migration-name>
```

Or directly:
```bash
supabase migration new <migration-name>
```

This will create a new migration file in `supabase/migrations/` with the proper timestamp format: `YYYYMMDDHHMMSS_migration_name.sql`

## Example

```bash
# Create a new migration for storage buckets
npm run migration:new create_storage_buckets

# This creates: supabase/migrations/20251115130000_create_storage_buckets.sql
```

## Applying Migrations

### Local Development
```bash
supabase db reset  # Resets and applies all migrations
```

### Remote (Production)
```bash
supabase db push  # Pushes local migrations to remote
```

## Best Practices

1. **Always use `supabase migration new`** - Never manually create migration files
2. **Use descriptive names** - Migration names should clearly describe what they do
3. **One change per migration** - Keep migrations focused and atomic
4. **Test locally first** - Always test migrations with `supabase db reset` before pushing
5. **Generate types after migrations** - Run `npm run types:generate` after creating/updating migrations

## Migration File Naming Convention

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
- `20251115115924_initial_schema.sql`
- `20251115115934_rls_policies.sql`
- `20251115124954_create_users_table.sql`

## Available Scripts

- `npm run migration:new <name>` - Create a new migration
- `npm run migration:list` - List all migrations
- `npm run types:generate` - Generate TypeScript types from database schema

