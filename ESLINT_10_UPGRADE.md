# ESLint 10 Upgrade Blocking Issue

## Status: BLOCKED

The upgrade to ESLint 10 (PR #41) is currently **blocked** due to incompatibility with `eslint-config-next`.

## Problem

ESLint 10 removed deprecated rule context methods like `context.getFilename()`, but `eslint-plugin-react` (bundled with `eslint-config-next@16.3.1`) still uses these removed APIs, causing the following crash:

```
TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function
Occurred while linting /home/runner/work/rps-booking-system/rps-booking-system/emails/completion.tsx
```

## Root Cause

- `eslint-config-next@16.3.1` bundles `eslint-plugin-react@7.37.5`
- `eslint-plugin-react@7.37.5` only supports ESLint up to v9.7, not v10
- ESLint 10 removed legacy context methods that the plugin relies on

## Upstream Issues

- [vercel/next.js#91702](https://github.com/vercel/next.js/issues/91702) - Add support for eslint v10 in eslint-config-next
- [vercel/next.js#89764](https://github.com/vercel/next.js/issues/89764) - Tracking issue for ESLint 10 support

## Workaround (Not Recommended)

A workaround exists using `@eslint/compat` with `fixupConfigRules`, but it requires:
1. Migrating to ESLint flat config
2. Adding `@eslint/compat` dependency
3. Wrapping all `eslint-config-next` presets with `fixupConfigRules()`

This is a significant configuration change that should wait for official support.

## Recommendation

**DO NOT MERGE PR #41** until one of the following occurs:

1. ✅ `eslint-config-next` officially supports ESLint 10 (check release notes)
2. ✅ Vercel releases an updated version that bundles ESLint 10-compatible plugins
3. ✅ The upstream `eslint-plugin-react` adds ESLint 10 support and Next.js updates its bundled version

## How to Monitor

- Watch [vercel/next.js releases](https://github.com/vercel/next.js/releases) for ESLint 10 support announcements
- Check the [ESLint 10 tracking issue](https://github.com/vercel/next.js/issues/89764)
- Run `npm view eslint-config-next peerDependencies.eslint` to see supported ESLint versions

## Alternative: Stay on ESLint 9

The current `eslint@^9` setup works perfectly. Consider:
- Keeping ESLint 9 until official ESLint 10 support lands
- Configuring Dependabot to ignore ESLint 10 major bumps temporarily
- Manually upgrading when `eslint-config-next` announces ESLint 10 support

---

**Last Updated:** 2026-08-26  
**Blocking PR:** #41  
**Current ESLint Version:** 9.x  
**Target ESLint Version:** 10.8.1 (blocked)
