## Science Nova 2.0 – AI Continuation Guide

Purpose: Hand-off summary so a new AI assistant can seamlessly continue feature work, testing, and refinements without re-discovering prior context.

### 1. High-Level Scope Completed
- Admin content creation with AI for DISCOVERY (FACT/INFO) and ARCADE (QUIZ, FLASHCARDS, GAME subtypes).
- GAME subtypes: matching, ordering, truefalse, crossword (auto placement, max 12 words).
- Bulk ops: regenerate with diff preview, publish, delete with undo, multi-select progress UI.
- Layout refactor: dual-pane `/admin/content` with sidebar.
- CRUD routes implemented & adjusted for Next.js param awaiting.
- Crossword layout validator added (bounds, overlap, duplicates).
- Test layers: schema validation, crossword validation, route handler presence, integration scaffold.

### 2. Key Files
- components/admin/builders/GameBuilder.tsx – GAME payload builder & crossword auto layout.
- lib/schemas/content.ts – Core Zod schemas (UpdateContentEntrySchema allows deleted_at restore).
- app/api/admin/content/route.ts – List/create content entries.
- app/api/admin/content/[id]/route.ts – GET/PATCH/DELETE (soft delete) awaiting params.
- app/api/admin/discovery/route.ts & arcade/route.ts – Listing with filters.
- app/api/topics/route.ts – Derives topics from lessons; inserts missing ones.
- lib/crossword/validate.ts – Layout validator.
- tests/*.test.ts – See section 4.
- tools/find-test-ids.mjs – Prints TEST_TOPIC_ID & TEST_USER_ID.

### 3. Environment & Auth
- Supabase via NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
- Unsigned JWT accepted; only `sub` is parsed.
- Roles required for mutations: TEACHER, ADMIN, DEVELOPER.
- Integration vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_TOPIC_ID, TEST_USER_ID.

### 4. Test Suite
- payload-validation: positive & negative for QUIZ/FLASHCARDS/GAME/FACT.
- crossword-validation: bounds, conflict, valid intersection.
- content-routes: ensures handlers exported.
- integration: FACT + crossword game full lifecycle (skips without env).

### 5. Gaps / TODO
- Tighten GAME schema (per-type discriminated union) – current `data` is loosely typed.
- Add server-side crossword-specific validation (words array shape, limit enforcement).
- Integration: add payload mutation for crossword & negative auth tests.
- Topics route concurrency (potential duplicate inserts) – consider upsert.
- Soft delete restore explicit branch if logic expands.
- Add prompt snapshot tests for AI helper endpoints (optional).

### 6. Edge Cases
- Crossword >12 words not blocked server-side.
- Duplicate crossword words only caught if validator run manually.
- Unsigned tokens accepted (security tradeoff for dev).
- Soft deleted entries may appear if listing queries don’t filter deleted_at (verify behavior as needed).

### 7. Recommended Next Steps
1. Implement subtype-specific schemas for GAME (matching, ordering, truefalse, crossword).
2. Integrate crosswordWordsSchema + validation in validatePayload.
3. Expand integration test: modify crossword payload, then re-fetch & assert.
4. Add 401/403 negative integration tests.
5. Guard server against >12 crossword words & invalid coordinates.
6. Add deterministic layout (seed ordering) for reproducible tests.

### 8. Troubleshooting
- Deletion route error: fixed by awaiting params; revert only if Next.js API changes again.
- Skipped integration tests: ensure all four env vars exported in the same test shell.
- Missing IDs: run `npm run test:ids` after exporting Supabase vars.

### 9. Commands (PowerShell)
Install: npm install
Run unit tests: npm test
Discover IDs: npm run test:ids (with Supabase env exported)
Run dev server: npm run dev

### 10. Security Notes
- Service role key used server-side; ensure not exposed client-side.
- Consider switching to verified JWT before production.

### 11. Summary
CRUD + AI-assisted creation + crossword feature set are in place with foundational tests. Remaining work centers on schema hardening, broader integration coverage (including negative paths), and stricter server-side Crossword validation.
