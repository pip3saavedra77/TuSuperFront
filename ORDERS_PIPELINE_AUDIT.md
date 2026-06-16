# Orders Pipeline Reliability Audit & Implementation Plan

**Date:** 2026-06-16
**Status:** In Progress
**Branch:** main (frontend) / dev (backend)

---

## Executive Summary

Two critical UX issues identified:
1. **Blank screen delay (2-5s)** on cold start / browser reopen
2. **Unexpected session expiry** when closing Safari/Brave

Root causes:
- Auth bootstrap race condition (duplicate checks, no loading UI)
- Cookie/token sync mismatch (15min cookie vs 1h JWT)
- Backend cold start on Render free tier (10-30s first request)

---

## Current Architecture Analysis

### Auth Flow (Current)
```
bootstrapApplication
  → App.ngOnInit()
      → idleService.startWatching()
      → checkAuthStatus()           ← NETWORK REQUEST (blocks UI)
          → HTTP /auth/check-status
              → Backend validates JWT + blacklist + DB fetch + new tokens + cookie set
          → If fail → refreshToken()  ← SECOND NETWORK REQUEST
  → Router activates
      → authGuard runs AGAIN         ← DUPLICATE CHECK (5min cache)
  → Home component loads
      → UserDashboard loads
          → 3 parallel HTTP requests
              → loading.set(false) BUG - shows nothing until complete
```

### Token Storage Mismatch
| Layer | Storage | TTL |
|-------|---------|-----|
| Backend cookie (access_token) | HttpOnly cookie | 15 min (JWT_EXPIRES_IN=900) |
| Backend cookie (refresh_token) | HttpOnly cookie | 7 days |
| Frontend (access_token) | localStorage | Until logout |
| Frontend (refresh_token) | localStorage | Until logout |

**Problem:** Two sources of truth diverge on browser close (Safari/Brave clear cookies).

---

## Implementation Plan

### Phase 1: Backend - Token Cookie Alignment (P0)

**File:** `tusuper-backend/src/auth/controllers/auth.controller.ts`

**Changes:**
1. Increase `access_token` cookie `maxAge` to 1 hour (3600s) matching JWT
2. Implement sliding refresh: on each `check-status` or `refresh`, reset cookie maxAge
3. Keep `refresh_token` at 7 days

**Rationale:** Cookie survives browser close; matches JWT expiry; sliding window extends on activity.

---

### Phase 2: Frontend - Standardize on localStorage (P0)

**Files:**
- `src/app/core/services/auth.ts` - Remove cookie dependency
- `src/app/core/interceptors/auth-interceptor.ts` - Use localStorage only
- `src/app/core/services/token.service.ts` - Already uses localStorage ✓

**Changes:**
1. Remove `withCredentials: true` from interceptor (not needed for Bearer tokens)
2. `checkAuthStatus()` and `refreshToken()` use localStorage tokens only
3. Backend still sets cookies for legacy/SSR but frontend ignores them

**Rationale:** Single source of truth; survives browser close; works offline-first.

---

### Phase 3: Frontend - APP_INITIALIZER with Loading Screen (P0)

**Files:**
- `src/app/app.config.ts` - Add APP_INITIALIZER provider
- `src/app/core/services/auth.ts` - Add `initializeAuth()` method
- `src/app/app.ts` - Remove bootstrap auth logic
- `src/app/shared/components/loading-screen/loading-screen.ts` - Already exists ✓

**Flow:**
```
bootstrapApplication
  → APP_INITIALIZER (initializeAuth)
      → Show LoadingScreen component
      → checkAuthStatus() or refreshToken()
      → On complete → hide LoadingScreen
  → App.ngOnInit() - only idleService.startWatching()
  → Router activates
      → authGuard uses cached auth (5min TTL)
  → Home loads instantly with skeleton
```

**Loading Screen:** Reuse existing `LoadingScreenComponent` with "Waking Up..." message for cold starts.

---

### Phase 4: Frontend - Skeleton Loaders (P0)

**File:** `src/app/home/components/user-dashboard/user-dashboard.component.ts`

**Changes:**
1. Fix `loading.set(false)` → `loading.set(true)` at start of `loadDashboard()`
2. Add skeleton placeholders for:
   - Featured products grid (4 cards)
   - Categories strip (chips)
   - Recent orders (2 cards)
   - Stats cards (4 items)
3. Use `MatProgressBar` or custom minimalist skeleton matching app design
4. Set `loading.set(false)` after all 3 requests complete

**Design:** Minimalist, using existing color scheme (`#fbf9f8` background, `#00c853` accent).

---

### Phase 5: Frontend - Cold Start "Waking Up..." UI (P0)

**Files:**
- `src/app/core/services/auth.ts` - Detect cold start (first request > 5s)
- `src/app/shared/components/loading-screen/loading-screen.ts` - Add cold start message
- `src/app/app.config.ts` - Pass cold start state to loading screen

**Implementation:**
- Track time from `initializeAuth()` start
- If > 5000ms, switch message to "Despertando el servidor..."
- Backend cold start typically 10-30s on Render free tier

---

### Phase 6: Auth Guard Optimization (P1)

**File:** `src/app/core/guards/auth.guard.ts`

**Changes:**
- Trust `AuthService.isAuthenticated()` signal (synced by APP_INITIALIZER)
- Only call `checkAuthStatus()` if signal is null/false
- Reduce cache TTL to 1min (since bootstrap already validated)

---

## File Change Summary

### Backend (1 file)
| File | Lines | Change |
|------|-------|--------|
| `auth.controller.ts` | 53-66 | Cookie maxAge = 3600s, sliding refresh |

### Frontend (6 files)
| File | Lines | Change |
|------|-------|--------|
| `app.config.ts` | +15 | APP_INITIALIZER provider |
| `auth.ts` | +30 | `initializeAuth()`, remove cookie logic |
| `auth-interceptor.ts` | -10 | Remove `withCredentials`, use localStorage |
| `app.ts` | -15 | Remove bootstrap auth, only idleService |
| `user-dashboard.component.ts` | +40 | Skeleton loaders, fix loading signal |
| `loading-screen.ts` | +10 | Cold start message support |

---

## Testing Checklist

### Session Persistence
- [ ] Login → Close Safari completely → Reopen → Still logged in
- [ ] Login → Close Brave completely → Reopen → Still logged in
- [ ] Login → Wait 20 min (token refresh) → Still logged in
- [ ] Login → Wait 1h 10min (token expiry) → Auto-refresh works

### Loading Performance
- [ ] Cold start (after 15min idle): Shows "Waking Up..." → Loads in <2s after backend ready
- [ ] Warm start: Shows skeleton immediately → Data pops in
- [ ] No blank white screen at any point

### Dashboard UX
- [ ] Stats cards show skeleton → real data
- [ ] Featured products show skeleton cards → real products
- [ ] Categories show skeleton chips → real categories
- [ ] Recent orders show skeleton → real orders

### Regression
- [ ] Login/logout still works
- [ ] Token refresh still works
- [ ] Protected routes still guarded
- [ ] Push notifications still work
- [ ] Cart persistence still works

---

## Rollback Plan

If issues arise:
1. Backend: Revert `auth.controller.ts` cookie maxAge
2. Frontend: Revert `app.config.ts` APP_INITIALIZER, restore `app.ts` bootstrap logic
3. Frontend: Revert `auth-interceptor.ts` to use `withCredentials: true`

---

## Notes for Support Team

- **Render Free Tier:** Backend spins down after 15min inactivity. First request 10-30s.
- **Safari/Brave:** Aggressive cookie clearing on close. localStorage is reliable.
- **JWT_EXPIRES_IN:** Currently 3600s (1h) in backend config. Cookie now matches.
- **Sliding Refresh:** Cookie maxAge resets on each `check-status`/`refresh` call.

---

## Next Steps (Post-P0)

1. Client-side order cache (stale-while-revalidate)
2. Optimistic UI for cart/order actions
3. Background sync for offline orders
4. Push notification reliability improvements (already done)