# GitHub Actions workflows

## `ci.yml` - CI/CD

Every push and PR runs `check` (lint, typecheck, build). On `main` only, a
green `check` unlocks the ordered release: `migrate` (`supabase db push`
against prod) then `deploy-app` (`vercel deploy --prod`). Git auto-deploy for
`main` is disabled in `vercel.json`, so the app can never go live before the
schema it expects. PR branches still get Vercel preview deploys.

Required secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`,
`VERCEL_TOKEN`.

If Actions is unavailable, deploy by hand **in this order**:

```sh
supabase db push --remote
npx vercel deploy --prod
```

## `dependabot-auto-merge.yml`

Auto-merges patch-level Dependabot PRs once CI is green.
