## [2025-12-30] - Namespace-First UI Redesign
### ✨ Features
- **Namespace-First Hierarchy**: Completely redesigned UI to make namespaces the top-level organizing concept
- **Context-Aware Sidebar**: Sidebar now shows namespace list when no namespace is selected, and resource categories (Workloads/Storage/Security) when a namespace is selected
- **Cluster Resources Section**: Added dedicated section for cluster-scoped resources (ClusterRoles)
- **Namespace Filtering**: All resource list components now support filtering by namespace
- **NamespacePanel Component**: New component for displaying namespace overview with resource counts
- **Breadcrumb Navigation**: Added back button and namespace breadcrumb in preview area

### 🔧 Technical Details
- Modified `App.tsx` with `selectedNamespaceView` state and context-aware sidebar
- Updated `VisualPreview.tsx` with `namespaceFilter` prop for filtering displayed nodes
- Added `namespaceFilter` prop to 8 resource list components
- Created `NamespacePanel.tsx` for namespace overview display

---

## [2025-12-30] - Server Startup Fix
### 🐛 Bug Fixes
- **Backend**: Fixed server startup failure caused by missing dependencies and TypeScript module system incompatibility
- **Dependencies**: Installed missing `ts-node` in server workspace and `concurrently` at root level
- **Module System**: Replaced CommonJS `require.main === module` pattern with direct server initialization for TypeScript compatibility

### 🔧 Technical Details
- Modified `server/src/index.ts` to remove CommonJS conditional that prevented server startup with ts-node
- Ensured both frontend (port 5173) and backend (port 3001) start successfully with `npm run dev`
- Verified API proxy configuration and database connectivity

---

## [2025-12-30] - Release Candidate
### 🚀 Summary
Major refactor to a monorepo structure, separating client and server codebases.

### 🛠️ Changes
- **Architecture**: Split application into `client/` (frontend) and `server/` (backend).
- **Cleanup**: Removed root-level configuration and source files.
- **Dependencies**: Updated `package.json` to reflect the new structure.
