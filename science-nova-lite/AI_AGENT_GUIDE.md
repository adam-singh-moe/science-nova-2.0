# AI Agent Handoff Guide — science-nova-lite

Purpose: Enable a future AI agent to extend this project without breaking existing behavior. This guide captures architecture, invariants, workflows, and guardrails.

Last updated: 2025-08-16

---

## 1) Project overview
- App: Next.js (15.2.4) App Router, React 18, TypeScript, Tailwind.
- Folder: All app code relevant here lives in `science-nova-lite/`.
- Start location: Always run scripts from `science-nova-lite/` (not repo root).
- Dependencies: Uses some Radix UI, lucide-react, framer-motion, recharts.
- Backgrounds: Vanta is used only on preview/student pages, not in the builder.

Key routes/files (relative to `science-nova-lite/`):
- Builder (authoring): `app/admin/lessons/builder/page.tsx`
- Admin list: `app/admin/lessons/page.tsx`
- Preview (author): `app/lessons/preview/page.tsx`
- Student (published): `app/lessons/[id]/page.tsx`
- Lessons API: `app/api/lessons/route.ts`, publish: `app/api/lessons/publish/route.ts`
- AI helper API: `app/api/ai-helper/route.ts`
- Supabase server helpers: `lib/server-supabase.ts`

RBAC:
- Roles: `ADMIN`, `DEVELOPER`, `TEACHER`, `STUDENT` (and unauthenticated). Admin area is gated by role.

Data model (Option A):
- Table: `public.lessons` (see repo root `create-lessons-table.sql`). RLS enforces author ownership and admin/developer overrides.
- `layout_json` stores `meta` and `items`. Meta includes:
  - designWidth: 1280 (canonical student width)
  - designHeight: 800 (baseline reference)
  - canvasHeight: number — persisted, dynamic height for builder/preview/student
  - vanta_effect: string — used in preview/student, NOT in builder

---

## 2) Critical invariants — DO NOT BREAK
1) Builder width is fixed to 1280px; height can auto-grow only
   - The builder canvas clamps horizontal movement/resizing within [0, 1280].
   - Vertical drag/resize can increase `canvasHeight`. There’s no auto-shrink (yet).
2) Vanta background is NOT shown in the builder
   - Vanta appears on preview and student pages only.
3) Zoom behavior
   - “Fit” is width-based; minimum zoom is anchored to fit-to-width; 100% equals the true student scale.
4) Persistence contract
   - Save persists `meta.canvasHeight` (width is constant 1280). Preview and student must respect it.
5) Student/preview layout parity
   - Both render the fixed width (1280) and use `min-height = meta.canvasHeight` (fallback to `designHeight`).
6) RBAC and API constraints
   - Admin/Teacher permissions and RLS policies must not be weakened.
7) Data shapes for AI helpers and tools
   - Don’t change payload/response shapes without updating all callsites.

---

## 3) Safe-change workflow (checklist)
Before coding
- Clarify the requirement in 1–3 bullets (inputs/outputs, success criteria).
- Locate affected files via search; read enough surrounding code to avoid regressions.
- Identify which invariants (above) could be impacted; plan to preserve them.

During implementation
- Prefer minimal, localized changes. Avoid broad refactors in shared code.
- Preserve public APIs and data shapes (`layout_json.meta` and `items`).
- For new features, add flags/props that default to current behavior.

Validation (quality gates)
- Typecheck: ensure there are no TS/compile errors.
- Lint: run linter and address new issues.
- Build: ensure `next build` passes.
- Smoke test:
  - Builder: fixed width 1280; dragging past bottom grows height; no Vanta visible.
  - Preview/Student: width=1280, min-height=canvasHeight; Vanta visible.
  - Save/Publish/Load flows work with RBAC.

---

## 4) Run/lint/build (Windows PowerShell)
```powershell
# From repo root, install for the lite app
npm --prefix "c:\Users\Exams003\VScode\science-nova-2.0\science-nova-lite" install

# Or from the app folder
cd "c:\Users\Exams003\VScode\science-nova-2.0\science-nova-lite"

# Dev server
npm run dev

# Lint
npm run lint

# Build
npm run build
```
Notes:
- Ensure Node.js version compatible with Next 15 (Node 18.17+ or 20+ recommended). Node 22 also works at time of writing.
- Environment variables are loaded from `.env.local` if present.

---

## 5) How to extend safely (patterns)
- Adding a new tool/block type:
  - Define its data shape; update builder palette, drag/resize handlers, and student/preview renderers.
  - Keep absolute positioning contract: `x/y/w/h` with sensible clamps.
  - Don’t alter existing types’ shapes.
- Builder UX tweaks:
  - Keep width=1280 invariant and height auto-grow logic.
  - If adding auto-shrink, guard it behind a setting and test thoroughly.
- Preview/Student visuals:
  - Keep Vanta here; do not render it in the builder.
  - Respect `meta.canvasHeight` consistently.
- APIs and RBAC:
  - Validate inputs; enforce teacher-ownership on updates; preserve published-only access for public routes.

---

## 6) Common pitfalls to avoid
- Re-introducing Vanta in the builder view.
- Changing builder width or allowing horizontal overflow beyond 1280.
- Modifying `meta` schema without updating preview/student and migrations.
- Breaking save/publish flow by changing endpoint contracts.
- Weakening role checks or RLS.
- Over-scaling the toolbar; it must not scale with canvas zoom.

---

## 7) Quick architecture map
- Builder (`app/admin/lessons/builder/page.tsx`):
  - Canvas state: width=1280, height dynamic; pan/zoom with min=fit-width.
  - Draggable/resizable blocks; grid and snap toggles; layers/z-order.
  - Save/Preview/Publish wired to lessons API.
- Preview (`app/lessons/preview/page.tsx`):
  - Reads lesson (by id); renders with width 1280, min-height=canvasHeight; Vanta visible.
- Student (`app/lessons/[id]/page.tsx`):
  - Published-only (public); same layout rules as preview; Vanta visible.
- API (`app/api/lessons/…`):
  - GET/POST for create/update; publish endpoint; role-aware filters and ownership checks.
- Supabase helpers (`lib/server-supabase.ts`):
  - Service client, auth header decode, `getProfileRole`.

---

## 8) Minimal smoke checklist (post-change)
- [ ] Compile with zero errors.
- [ ] Builder: width is 1280; drag/resize past bottom increases height.
- [ ] Builder: toolbar does not scale; Vanta not visible.
- [ ] Preview/Student: Vanta visible; min-height equals saved `canvasHeight`.
- [ ] Save → Preview → Student parity confirmed for new/edited lessons.
- [ ] RBAC: Admin/Teacher access to admin routes; public can view only published lessons.

---

## 9) Change request template (for future tasks)
- Context/Goal:
- Files likely involved:
- Invariants to preserve:
- Risks and mitigations:
- Validation plan (steps + expected results):

---

## 10) References
- Implementation history: `IMPLEMENTATION_PHASES.md` (kept up to date; see Phase 14 for builder width/height decisions).
- DB schema: `../create-lessons-table.sql` (relative to repo root).
- Role guard: `components/layout/role-guard.tsx`.

If a change requires relaxing any invariant above, propose it explicitly and update preview/student in the same change, with thorough validation.
