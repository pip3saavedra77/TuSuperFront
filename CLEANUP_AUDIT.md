# Project Cleanup Audit & Implementation Plan

**Date:** 2026-06-16
**Status:** Audit Complete — Ready for Implementation
**Principles:** Clean Code, DRY, KISS, YAGNI, SOLID

---

## Executive Summary

Comprehensive audit of both repositories (frontend: `TuSuperFront`, backend: `tusuper-backend`) to identify and remove:
- Junk/untracked files
- Dead/unused code
- Duplicate interfaces
- Unused assets
- Over-engineered patterns violating KISS/YAGNI
- SOLID violations

---

## Frontend Findings (`TuSuperFront`)

### 🔴 CRITICAL — Untracked Files to Remove

| File | Size | Reason |
|------|------|--------|
| `PWA-PUSH-AUDIT-PROMPT.md` | ~180KB | Audit prompt document, not project documentation |
| `ORDERS_PIPELINE_AUDIT.md` | ~15KB | Implementation audit (keep? but not in repo root) |
| `src/assets/images/IMG_4720.png` | 690KB | Unreferenced image |
| `src/assets/images/fondo.jpg` | 15KB | Unreferenced image |
| `src/app/auth/_auth-shared.scss` | 23KB | Unused partial (no `@use` found) |

### 🟡 WARNING — Duplicate/Dead Code

| Item | Location | Issue |
|------|----------|-------|
| `JwtPayload` interface | `src/auth/interfaces/jwt-payload.interface.ts` vs `src/common/interfaces/authenticated-request.interface.ts` | Duplicate definition |
| `UserHeaderComponent` | `src/app/home/components/user-dashboard/components/user-header/user-header.component.ts` | Defined but never imported/used |
| `modules.spec.ts` (root) | `src/app/modules/modules.spec.ts` | Duplicate of `src/app/modules/services/modules.spec.ts` |
| `modules.spec.ts` (services) | `src/app/modules/services/modules.spec.ts` | Tests for deleted service? |
| `auth.spec.ts` (core/services) | `src/app/core/services/auth.spec.ts` | 373 bytes — likely empty/placeholder |

### 🟢 INFO — Assets to Consolidate

| Asset | Used In | Consolidation |
|-------|---------|---------------|
| `/branding/tusuper-logo.png` | `page-header.html` only | Keep |
| `/branding/tusuper-logo-new.png` | 10+ files | Primary logo |
| `/branding/tusuper-logo-black.png` | `admin-layout.component.html` only | Keep for sidebar |
| `/images/mobile-login-bg.jpg` | Unreferenced | Remove |
| `/images/fondo.jpg` | Unreferenced | Remove |
| `/images/IMG_4720.png` | Unreferenced | Remove |

### 🔵 CODE SMELLS — SOLID/DRY Violations

| Principle | Violation | File |
|-----------|-----------|------|
| **SRP** | `AuthService` = 333 lines: auth + tokens + timers + idle + session + warnings | `auth.ts` |
| **DRY** | `AuthService.checkAuthStatus()` + `AuthGuard` + `AuthInterceptor` all validate tokens | Multiple files |
| **KISS** | `AdminDashboardComponent` injects 3 services but template not checked | `admin-dashboard.component.ts` |
| **YAGNI** | `ModulesHttpService` + `ModulesStore` for simple CRUD | `modules/` |
| **ISP** | `DashboardService` injected only in `AdminDashboardComponent` | `dashboard.service.ts` |

---

## Backend Findings (`tusuper-backend`)

### 🔴 CRITICAL — Untracked Files to Remove

| File | Size | Reason |
|------|------|--------|
| `.playwright-mcp/page-*.yml` | ~3 files | Playwright artifacts |
| `home-*.png`, `stitch-screen.png` | ~4 images | Design artifacts |
| `dist/` folder | N/A | Compiled output (should be gitignored) |

### 🟡 WARNING — Duplicate/Dead Code

| Item | Location | Issue |
|------|----------|-------|
| `JwtPayload` interface | `auth/interfaces/jwt-payload.interface.ts` (8 lines) + `common/interfaces/authenticated-request.interface.ts` (duplicate) | **Duplicate interface** — 2 definitions |
| `NotificationsGateway` | Used in `OrdersService` + `NotificationsService` but gateway does dual duty | SRP violation |
| `seed/` module | `SeedModule` + `SeedController` + guards + data files | Only used in dev/prod bootstrap |
| `scripts/migration-prompt.ts` | 2.28KB | One-off migration script |
| `scripts/seed.ts` | 9.11KB | Duplicate of seed module? |

### 🟢 INFO — Unused Exports

| Export | Defined In | Used In |
|--------|------------|---------|
| `PaginatedResult<T>` | `common/interfaces/paginated-result.interface.ts` | Used? |
| `CategoryDistributionItem` | `dashboard.service.ts` | Only in `DashboardService` |
| `SeedResult`, `BootstrapResult`, `ProductionSeedResult` | `seed/interfaces/seed-result.interface.ts` | Only in seed module |
| `ProviderSeedData`, `CategorySeedData` types | `seed/data/*.ts` | Only in seed |

### 🔵 CODE SMELLS — SOLID/DRY Violations

| Principle | Violation | File |
|-----------|-----------|------|
| **SRP** | `OrdersService` = 566 lines: checkout + status transitions + stock + notifications + push + WebSocket | `orders.service.ts` |
| **SRP** | `AuthController` = 191 lines: login/register/OAuth/password/reset/refresh/check-status/logout | `auth.controller.ts` |
| **DRY** | `JwtPayload` defined 3x (auth, common, notifications.gateway) | Multiple files |
| **ISP** | `NotificationsGateway` implements WebSocket + JWT verification + notification emit | `notifications.gateway.ts` |
| **OCP** | `VALID_TRANSITIONS` map hardcoded in `OrdersService` | `orders.service.ts:27-47` |
| **YAGNI** | `DevOnlyGuard` + `SeedSecretGuard` for seed endpoint only | `seed/guards/` |
| **YAGNI** | `modules/` module: `ModulesModule` + `ModulesHttpService` + `ModulesStore` + controller for simple CRUD | `modules/` |

---

## Consolidation Plan

### Phase 1: Remove Junk Files (Safe, No Code Changes)

**Frontend:**
```bash
rm PWA-PUSH-AUDIT-PROMPT.md
rm ORDERS_PIPELINE_AUDIT.md
rm src/assets/images/IMG_4720.png
rm src/assets/images/fondo.jpg
rm src/app/auth/_auth-shared.scss
rm public/images/mobile-login-bg.jpg
```

**Backend:**
```bash
rm .playwright-mcp/page-2026-06-15T00-46-22-329Z.yml
rm .playwright-mcp/page-2026-06-15T00-50-42-521Z.yml
rm .playwright-mcp/page-2026-06-15T01-04-37-624Z.yml
rm home-current.png home-floating-nav.png home-redesign.png stitch-screen.png
```

### Phase 2: Consolidate Duplicate Interfaces (Breaking Changes — Careful)

**Backend: `JwtPayload`**
1. Keep: `src/auth/interfaces/jwt-payload.interface.ts` (canonical)
2. Remove: `src/common/interfaces/authenticated-request.interface.ts` lines 3-7
3. Update imports in: `notifications.gateway.ts`, `common/interfaces/authenticated-request.interface.ts`
4. Run tests

**Frontend: Remove unused test files**
```bash
rm src/app/modules/modules.spec.ts  # duplicate
rm src/app/core/services/auth.spec.ts  # empty
rm src/app/modules/services/modules.spec.ts  # if service deleted
```

### Phase 3: Remove Dead Components (Verify First)

**Frontend: `UserHeaderComponent`**
- Check if used in any template/route
- If unused: delete component + test

### Phase 4: Extract/Split Large Services (Refactor — Post-Cleanup)

| Service | Current Lines | Target Split |
|---------|--------------|--------------|
| `OrdersService` | 566 | `OrderCheckoutService`, `OrderStatusService`, `OrderQueryService` |
| `AuthService` | 333 | `TokenService` (extract), `SessionService` (extract) |
| `AuthController` | 191 | Split into `AuthLoginController`, `AuthPasswordController`, `AuthTokenController` |

---

## Implementation Order

| Step | Task | Risk | Est. Time |
|------|------|------|-----------|
| 1 | Remove untracked junk files (both repos) | None | 5 min |
| 2 | Remove unused assets (unreferenced images) | None | 5 min |
| 3 | Consolidate `JwtPayload` interface (backend) | Medium | 20 min |
| 4 | Remove duplicate test files (frontend) | Low | 5 min |
| 5 | Remove unused `_auth-shared.scss` | None | 2 min |
| 6 | Verify `UserHeaderComponent` unused → delete | Low | 10 min |
| 7 | Remove unused backend test/interface files | Low | 10 min |
| 8 | Run full test suite + build | Verification | 5 min |

---

## Verification Checklist

After each phase:
- [ ] `ng build --configuration production` passes
- [ ] `tsc --noEmit` passes
- [ ] `npm test` passes (if tests exist)
- [ ] Backend `nest build` passes
- [ ] Backend tests pass
- [ ] No TypeScript errors
- [ ] No broken imports

---

## Post-Cleanup Metrics Target

| Metric | Before | Target |
|--------|--------|--------|
| Frontend untracked files | 3 | 0 |
| Backend untracked files | 7 | 0 |
| Duplicate interfaces | 1 (`JwtPayload`) | 0 |
| Unused assets | 5 | 0 |
| Dead components | 1 (`UserHeaderComponent`) | 0 |
| Empty/placeholder test files | 2+ | 0 |

---

## Notes for Support Team

1. **Never commit** `PWA-PUSH-AUDIT-PROMPT.md` or similar audit prompts
2. **Assets** go in `public/` not `src/assets/` unless processed by build
3. **Test files** must contain actual tests — delete empty placeholders
4. **Interfaces** defined once — use barrel exports or single source
5. **Run `git status`** before committing — clean working tree = clean mind

---

## Rollback Plan

If any removal breaks build:
```bash
git checkout HEAD -- <file>
```
All changes are individual commits for easy bisect.