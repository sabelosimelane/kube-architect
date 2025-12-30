# Pull Request: Fix Visual Preview UI Issues

## Title
Fix: Eliminate nested scrollbars and service account hydration issue in visual preview

## Description

### Summary

Fixed two critical UI bugs in the Kube Composer visual preview that were significantly impacting user experience:

1. **Nested Scrollbars**: Eliminated unsightly double scrollbars in the visual preview content area
2. **Service Account Hydration**: Fixed issue where newly created service accounts wouldn't appear until page refresh

### Changes Made

#### `client/src/components/VisualPreview.tsx`

**1. Removed Nested Scrollbar (Line 1730)**

**Before**:
```tsx
className="relative min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 p-8 overflow-auto dark:from-gray-900 dark:to-gray-800"
```

**After**:
```tsx
className="relative min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 p-8 dark:from-gray-900 dark:to-gray-800"
```

**Rationale**: The parent container in `App.tsx:2137` already manages scrolling with `overflow-auto`. Having it on both parent and child created conflicting scroll contexts, resulting in double scrollbars.

---

**2. Fixed Service Account Hydration (Line 1409)**

**Before**:
```typescript
}, [deployments, daemonSets, namespaces, configMaps, secrets, roles, clusterRoles, jobs, roleBindings, filterType]);
```

**After**:
```typescript
}, [deployments, daemonSets, namespaces, configMaps, secrets, serviceAccounts, roles, clusterRoles, jobs, roleBindings, filterType]);
```

**Rationale**: The useMemo processes `group.serviceAccounts` in lines 403-519 but wasn't recalculating when the array changed. This caused newly created service accounts to not appear until a full page refresh.

### Root Cause Analysis

**Scrollbar Issue**
- **Conflicting overflow management**: Both parent (`App.tsx`) and child (`VisualPreview.tsx`) had `overflow-auto`
- When content exceeded viewport, both containers tried to manage scrolling independently
- Result: Two separate scroll contexts visible to the user

**Hydration Issue**
- **React optimization miss**: The `rawFlowNodes` useMemo was missing `serviceAccounts` in its dependency array
- When `setServiceAccounts` updated state, the useMemo didn't recalculate
- Layout only updated on next full component re-render (e.g., page refresh)

### Testing

**Build Verification**
- ✅ TypeScript compilation passes without errors
- ✅ Production build completes successfully (2.38s)

**Manual Testing Required**

Please verify both fixes work as expected:

**Test 1: Scrollbar Fix**
1. Create multiple resources to exceed viewport height
2. Verify only ONE scrollbar appears (right side of preview pane)
3. Confirm no nested/double scrollbars visible

**Test 2: Service Account Hydration**
1. Navigate to Security → Service Accounts
2. Create a new service account
3. Verify it appears IMMEDIATELY in visual preview without refresh
4. Repeat to confirm consistent behavior

### Files Changed
- `client/src/components/VisualPreview.tsx` - Main visual preview component (2 critical fixes)

### Checklist
- [x] Code changes implemented
- [x] TypeScript compilation passes
- [x] Production build succeeds
- [x] Changes documented
- [ ] Manual testing completed (awaiting verification)
- [ ] Ready for merge

---

## How to Create the PR on GitHub

1. Go to: https://github.com/sabelosimelane/kube-architect/pulls
2. Click "New pull request"
3. Set base branch: `main`
4. Set compare branch: `refactor/monorepo-migration`
5. Copy the description above into the PR description
6. Click "Create pull request"
