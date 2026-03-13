# AI Agent Workflow Log

## Agents Used

- **Claude (Anthropic)** — Primary agent for architecture design, code generation, domain modeling, and documentation
- **GitHub Copilot** — Used for inline completions, boilerplate generation, and type definitions
- **Cursor Agent** — Used for refactoring passes and test generation

## Prompts & Outputs

### Prompt 1: Domain Service Design

**Prompt:**
```
Design pure TypeScript domain services for FuelEU Maritime compliance calculations.
Functions must have zero framework dependencies.
Include: computeComplianceBalance, simulatePool (greedy allocation), generateInsights.
Use constants: TARGET_INTENSITY = 89.3368 gCO₂e/MJ, MJ_PER_TON = 41000.
```

**Output:** Generated `complianceService.ts` with all pure functions. Key snippet:

```typescript
export function computeComplianceBalance(
  actualIntensity: number,
  fuelConsumptionTons: number,
  targetIntensity: number = TARGET_INTENSITY_2025
): number {
  const energy = computeEnergy(fuelConsumptionTons);
  return (targetIntensity - actualIntensity) * energy;
}
```

**Validation:** Verified formula matches EU Regulation 2023/1805 Annex IV. Tested with R001 HFO data:
- Input: intensity=91.0, fuel=5000t
- Expected: (89.3368 - 91.0) × 5000 × 41000 = -340,956,000 gCO₂eq
- Result: ✅ Matches

### Prompt 2: Pool Simulation Algorithm

**Prompt:**
```
Implement a greedy pool allocation algorithm that:
1. Sorts members descending by CB
2. Transfers surplus to deficit ships
3. Validates: sum(CB) >= 0, deficit ship cannot exit worse, surplus ship cannot go negative
4. Returns transfers array showing flow between ships
```

**Output:** Generated `simulatePool()` function with two-pointer approach.

**Correction needed:** Initial output didn't properly handle the edge case where a surplus ship's remaining CB was less than a deficit ship's need. Added continue guard:
```typescript
if (surplus.cbAfter - transferAmount < 0) {
  surplusIdx++;
  continue;
}
```

### Prompt 3: Hexagonal Architecture Setup

**Prompt:**
```
Set up hexagonal architecture for a Node.js Express backend.
Core layer must not import Express, Prisma, or any framework.
Use cases depend on port interfaces. Adapters implement ports.
```

**Output:** Generated folder structure with clean dependency flow:
- `core/domain/entities` — Pure TypeScript interfaces
- `core/ports` — Repository interfaces
- `core/application/usecases` — Business logic orchestration
- `adapters/outbound/postgres` — Prisma implementations
- `adapters/inbound/http` — Express controllers

**Validation:** Verified no `import` from `express` or `@prisma/client` exists in core layer. ✅

### Prompt 4: React Dashboard with Glassmorphism

**Prompt:**
```
Create a maritime-themed dashboard with glassmorphism cards,
radial compliance gauges, and recharts visualizations.
Use dark theme with ocean blue (#0f3d5e) and sea green (#2ec4b6).
Include animated micro-interactions.
```

**Output:** Generated complete dashboard page with:
- KPI cards with gradient glows
- Responsive PieChart, BarChart, AreaChart
- RadialGauge SVG component with animated stroke-dashoffset
- Dark/light mode support via Zustand store

**Refinement:** Adjusted tooltip styling and chart axis colors for dark mode readability.

### Prompt 5: Banking Timeline UI

**Prompt:**
```
Instead of a basic table, create a vertical timeline UI for banking records.
Each node shows ship ID, year, CB before/after, banked amount, applied amount.
Color-code surplus (green) vs deficit (red). Include bank/apply action buttons.
```

**Output:** Generated timeline with connected dots and content cards. Added inline apply amount input.

### Prompt 6: Test Generation

**Prompt:**
```
Generate comprehensive Vitest unit tests for all domain service functions.
Test edge cases: zero values, negative CB, over-apply, empty pool members.
```

**Output:** Generated 20+ test cases covering all domain functions.

**Correction:** Added missing test for `buildComparison` excluding baseline from results.

## Validation / Corrections

| Area | Agent Output | Manual Correction |
|------|-------------|-------------------|
| CB Formula | Correct | None needed |
| Pool greedy algo | Missing edge case | Added surplus guard clause |
| Prisma schema | Missing unique constraint | Added `@@unique([shipId, year])` |
| React imports | Used class components | Converted to functional + hooks |
| Tailwind classes | Some invalid classes | Replaced with correct utilities |
| API error handling | Missing try/catch | Added comprehensive error handling |
| Dark mode | Incomplete toggle | Added document class manipulation |

## Observations

### Where Agent Saved Time
- **Boilerplate generation**: Express router setup, Prisma schema, React Query hooks — ~70% faster
- **Type definitions**: Agent generated all TypeScript interfaces from the spec in one pass
- **Test scaffolding**: Generated test structure and assertions much faster than manual
- **Chart configuration**: Recharts configuration is verbose; agent handled it well

### Where Agent Failed or Hallucinated
- **Tailwind dark mode**: Initially generated non-existent `dark:` variants; needed correction
- **Prisma relations**: First attempt had incorrect relation fields; required manual fix
- **Pool algorithm edge case**: Greedy allocation didn't handle partial transfers correctly
- **Import paths**: Occasionally generated wrong relative import paths

### How Tools Were Combined Effectively
1. **Claude** for architecture decisions and complex logic (pool simulation, insight generation)
2. **Copilot** for rapid inline completions (type definitions, repetitive JSX patterns)
3. **Cursor Agent** for refactoring (extracting components, reorganizing imports)
4. Iterative approach: generate → review → correct → test → refine

## Best Practices Followed

1. **Architecture-first**: Defined domain entities and ports before any framework code
2. **Test alongside code**: Generated tests for each domain function as it was written
3. **Incremental verification**: Tested each use case independently before integration
4. **Prompt specificity**: More specific prompts yielded better results (include types, constraints, examples)
5. **Manual review**: Every generated file was reviewed and corrected before committing
6. **Separation of concerns**: Enforced hexagonal boundaries by checking imports
