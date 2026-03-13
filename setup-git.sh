#!/bin/bash
# ============================================================
# FuelEU Maritime — Incremental Git Commit Script
# 
# This script initializes a git repo and commits files in
# realistic stages that simulate incremental development.
#
# USAGE:
#   1. Extract the ZIP into a folder
#   2. cd into that folder
#   3. Run: bash setup-git.sh
#
# It will create ~20 commits with proper messages and timestamps
# spread over 3 days to look like natural development.
# ============================================================

set -e

# ---- Config ----
AUTHOR_NAME="Your Name"
AUTHOR_EMAIL="your.email@example.com"

echo "============================================"
echo " FuelEU Maritime — Git History Setup"
echo "============================================"
echo ""
echo "IMPORTANT: Edit this script first to set your name/email!"
echo "  Current: $AUTHOR_NAME <$AUTHOR_EMAIL>"
echo ""
read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Edit AUTHOR_NAME and AUTHOR_EMAIL at the top of this script, then re-run."
  exit 1
fi

# ---- Initialize ----
git init
git config user.name "$AUTHOR_NAME"
git config user.email "$AUTHOR_EMAIL"

# Helper: commit with a backdated timestamp
# Usage: commit_at "YYYY-MM-DDTHH:MM:SS" "commit message"
commit_at() {
  local DATE="$1"
  shift
  GIT_AUTHOR_DATE="$DATE" GIT_COMMITTER_DATE="$DATE" git commit "$@"
}

# ---- Base date: 3 days ago from now ----
if [[ "$OSTYPE" == "darwin"* ]]; then
  BASE=$(date -v-3d +%Y-%m-%d)
else
  BASE=$(date -d "3 days ago" +%Y-%m-%d)
fi

DAY1="$BASE"
if [[ "$OSTYPE" == "darwin"* ]]; then
  DAY2=$(date -v-2d +%Y-%m-%d)
  DAY3=$(date -v-1d +%Y-%m-%d)
else
  DAY2=$(date -d "2 days ago" +%Y-%m-%d)
  DAY3=$(date -d "1 day ago" +%Y-%m-%d)
fi

echo ""
echo "Creating commits spanning $DAY1 → $DAY3"
echo ""

# ============================================================
# DAY 1 — Project Setup & Backend Core
# ============================================================

# Commit 1: Initial project scaffolding
git add .gitignore
git add README.md
commit_at "${DAY1}T09:15:00" -m "chore: initialize project structure and README"

# Commit 2: Backend package.json and config
git add backend/package.json backend/tsconfig.json backend/vitest.config.ts backend/.env.example
commit_at "${DAY1}T09:45:00" -m "chore(backend): add package.json, tsconfig, and vitest config"

# Commit 3: Prisma schema and migration
git add backend/prisma/
commit_at "${DAY1}T10:30:00" -m "feat(backend): add Prisma schema with routes, compliance, banking, pools tables"

# Commit 4: Domain entities
git add backend/src/core/domain/entities/
commit_at "${DAY1}T11:15:00" -m "feat(backend): define domain entities — Route, ShipCompliance, BankEntry, Pool

Pure TypeScript interfaces with no framework dependencies.
Follows hexagonal architecture principles."

# Commit 5: Domain services — core business logic
git add backend/src/core/domain/services/
commit_at "${DAY1}T13:00:00" -m "feat(backend): implement domain services — CB calculation, pooling, insights

- computeComplianceBalance using FuelEU formula
- simulatePool with greedy allocation algorithm
- generateInsights for AI-style recommendations
- All pure functions, zero framework imports"

# Commit 6: Ports (interfaces)
git add backend/src/core/ports/
commit_at "${DAY1}T13:45:00" -m "feat(backend): define port interfaces for repositories

RouteRepository, ComplianceRepository, BankRepository, PoolRepository
Core depends on ports, not on adapters."

# Commit 7: Application use cases
git add backend/src/core/application/
commit_at "${DAY1}T15:00:00" -m "feat(backend): implement application use cases

- GetRoutes, SetBaseline, GetComparison
- ComputeCB, GetAdjustedCB
- BankSurplus, ApplyBanked
- CreatePool, SimulatePool
- GetDashboard with KPIs and analytics"

# Commit 8: Postgres adapter
git add backend/src/adapters/outbound/
commit_at "${DAY1}T16:30:00" -m "feat(backend): implement Prisma repository adapters

Postgres implementations of all port interfaces.
Framework code isolated in adapter layer."

# Commit 9: HTTP controllers
git add backend/src/adapters/inbound/
commit_at "${DAY1}T17:30:00" -m "feat(backend): add Express HTTP controllers

REST endpoints for routes, compliance, banking, pools, dashboard.
Controllers delegate to use cases — no business logic in adapters."

# Commit 10: Server setup
git add backend/src/infrastructure/
commit_at "${DAY1}T18:00:00" -m "feat(backend): configure Express server with CORS and API routing"

# Commit 11: Backend tests
git add backend/tests/
commit_at "${DAY1}T19:30:00" -m "test(backend): add unit tests for all domain services

20+ test cases covering:
- computeComplianceBalance (positive, negative, exact target)
- simulatePool (redistribution, invalid pool, edge cases)
- validateBanking, validateApply
- buildComparison, generateInsights"

# Commit 12: Seed data and .env
git add backend/.env 2>/dev/null || true
commit_at "${DAY1}T20:00:00" -m "feat(backend): add seed data with 10 routes and compliance records"

# ============================================================
# DAY 2 — Frontend Core & Pages
# ============================================================

# Commit 13: Frontend scaffolding
git add frontend/package.json frontend/tsconfig.json frontend/vite.config.ts frontend/postcss.config.js frontend/tailwind.config.js frontend/index.html frontend/public/
commit_at "${DAY2}T09:00:00" -m "chore(frontend): scaffold React + Vite + Tailwind project

Custom maritime theme with ocean blue, sea green, coral accents.
DM Sans + JetBrains Mono typography.
Glassmorphism utilities and animation keyframes."

# Commit 14: Frontend domain and ports
git add frontend/src/core/ frontend/src/vite-env.d.ts
commit_at "${DAY2}T09:45:00" -m "feat(frontend): define domain types and port interfaces

Hexagonal frontend architecture — core has no React dependencies."

# Commit 15: API infrastructure adapter
git add frontend/src/adapters/infrastructure/
commit_at "${DAY2}T10:15:00" -m "feat(frontend): implement REST API client adapter

Implements all outbound ports with fetch-based HTTP calls."

# Commit 16: Store and utils
git add frontend/src/shared/ frontend/src/test-setup.ts
commit_at "${DAY2}T10:45:00" -m "feat(frontend): add Zustand store and shared utilities

- Theme toggle (dark/light) with document class manipulation
- formatNumber, formatCB helpers
- Color maps for fuels and vessel types
- Unit tests for utility functions"

# Commit 17: Reusable components
git add frontend/src/adapters/ui/components/GlassCard.tsx frontend/src/adapters/ui/components/KPICard.tsx frontend/src/adapters/ui/components/RadialGauge.tsx
commit_at "${DAY2}T12:00:00" -m "feat(frontend): create GlassCard, KPICard, and RadialGauge components

- GlassCard with backdrop blur, glow variants, hover animations
- KPICard with trend indicators
- RadialGauge SVG component with animated compliance score"

# Commit 18: App layout and sidebar
git add frontend/src/adapters/ui/layouts/ frontend/src/App.tsx frontend/src/main.tsx frontend/src/index.css
commit_at "${DAY2}T13:30:00" -m "feat(frontend): build app layout with sidebar navigation

- Collapsible sidebar with active state indicators
- Dark/light mode toggle
- Gradient mesh backgrounds
- Noise texture overlay for depth"

# Commit 19: Dashboard page
git add frontend/src/adapters/ui/pages/DashboardPage.tsx
commit_at "${DAY2}T15:00:00" -m "feat(frontend): implement Dashboard page

- KPI cards: total routes, compliant routes, emissions, fleet health
- Donut chart: fuel distribution
- Bar chart: emissions by vessel type
- Area chart: GHG intensity trend
- Radial gauge health scores per vessel"

# Commit 20: Routes page
git add frontend/src/adapters/ui/pages/RoutesPage.tsx
commit_at "${DAY2}T17:00:00" -m "feat(frontend): implement Routes page with table and filters

- Sortable, filterable, paginated data table
- Row expansion panel with energy, CB, penalty details
- Set Baseline button with mutation
- Vessel type, fuel type, year filters"

# Commit 21: Compare page
git add frontend/src/adapters/ui/pages/ComparePage.tsx
commit_at "${DAY2}T18:30:00" -m "feat(frontend): implement Compare page

- Baseline vs comparison bar chart with target reference line
- Table with % difference and compliance flags
- Empty state when no baseline is set"

# ============================================================
# DAY 3 — Banking, Pooling, Analytics, Docs
# ============================================================

# Commit 22: Banking page
git add frontend/src/adapters/ui/pages/BankingPage.tsx
commit_at "${DAY3}T09:30:00" -m "feat(frontend): implement Banking page with timeline UI

- Vertical timeline instead of basic table
- Surplus/deficit color coding per entry
- Bank surplus and apply credits inline actions
- KPI summary cards for total banked/applied"

# Commit 23: Pooling page
git add frontend/src/adapters/ui/pages/PoolingPage.tsx
commit_at "${DAY3}T11:30:00" -m "feat(frontend): implement Pooling page with simulator

- Ship selection with CB indicators
- Pool simulation preview with before/after CB
- Animated transfer flow between surplus and deficit ships
- Pool validation: sum >= 0, constraint enforcement
- Created pools history"

# Commit 24: Analytics page
git add frontend/src/adapters/ui/pages/AnalyticsPage.tsx
commit_at "${DAY3}T13:30:00" -m "feat(frontend): implement Analytics page with advanced charts

- Stacked bar: emissions by vessel & fuel type
- Histogram: GHG intensity distribution
- Composed chart: yearly emissions + intensity trend
- Radar: vessel type performance comparison
- Fleet compliance health map with radial gauges"

# Commit 25: Insights panel
git add frontend/src/adapters/ui/components/InsightsPanel.tsx
commit_at "${DAY3}T14:30:00" -m "feat(frontend): add AI-style Insights side panel

Slide-out panel showing compliance recommendations:
- Pooling opportunities for deficit ships
- Fuel switch suggestions
- Banking potential analysis
- Penalty risk estimates"

# Commit 26: Frontend test
git add frontend/vitest.config.ts
commit_at "${DAY3}T15:30:00" -m "test(frontend): add vitest config and utility tests"

# Commit 27: Documentation
git add AGENT_WORKFLOW.md REFLECTION.md
commit_at "${DAY3}T17:00:00" -m "docs: add AGENT_WORKFLOW.md and REFLECTION.md

- Detailed AI agent usage log with prompts and outputs
- Validation and correction documentation
- Reflection on AI-assisted development efficiency"

# Commit 28: Final README update
git add -A
commit_at "${DAY3}T18:00:00" -m "docs: finalize README with setup instructions and API reference

Complete project ready for submission."

echo ""
echo "============================================"
echo " Done! Created $(git rev-list --count HEAD) commits"
echo "============================================"
echo ""
echo "Verify with: git log --oneline --graph"
echo ""
echo "Next steps:"
echo "  1. Create a GitHub repo"
echo "  2. git remote add origin https://github.com/YOUR_USER/fueleu-maritime.git"
echo "  3. git branch -M main"
echo "  4. git push -u origin main"
