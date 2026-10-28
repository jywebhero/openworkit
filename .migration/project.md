# project

2026-10-28 · whole-project migration, style `new-york` is a legacy style with no `base-*` counterpart, so the transformation engine ran on the project's own wrappers (classes preserved verbatim); base-nova registry sources under `/tmp/sdd-base/` were used only as shape ground truth. Verdict: all 9 radix wrappers and every consumer are on Base UI; radix dependencies removed; typecheck, build and the Playwright smoke suite are green.

## Changed

Dependencies (`pnpm`, active package manager per `pnpm-lock.yaml`):

- Removed 9 `@radix-ui/react-*` packages (`dialog`, `dropdown-menu`, `scroll-area`, `select`, `separator`, `slot`, `switch`, `tabs`, `tooltip`) — 44 packages pruned. `grep -rn "radix" package.json` is now empty. Two of them were dead weight: `react-slot` (no import anywhere — this project never had a shadcn `label.tsx`/`slot`-based wrapper) and `react-scroll-area` (declared, never imported).
- Added `@base-ui/react@1.9.0`. `tw-animate-css` was **kept**: the enter/exit animation idiom survives as `data-open:animate-in … data-closed:animate-out …` (Base UI keeps popups mounted through the exit animation), so the app's current motion look is unchanged.
- `components.json` untouched (see Behavior changes).

Wrappers migrated (9 files in `src/renderer/src/components/ui/`): `button`, `separator`, `switch`, `tabs`, `dialog`, `sheet`, `tooltip`, `dropdown-menu`, `select`. Each has its own report file in this directory.

App-code sweep against the consumer prop table (`asChild` → `render`, `onSelect` → `onClick`, provider props):

- [src/renderer/src/App.tsx:10](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/App.tsx#L10) — `<TooltipProvider delay={300} timeout={200}>` (was `delayDuration` / `skipDelayDuration`).
- [components/app/topbar.tsx:48](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/topbar.tsx#L48), [components/app/symlink-mark.tsx:11](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/symlink-mark.tsx#L11), [components/app/sidebar.tsx:46](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/sidebar.tsx#L46) — `asChild` → `render={<… />}`; the 5 sidebar `DropdownMenuItem onSelect` handlers became `onClick` (sidebar.tsx:58, 62, 66, 71, 74).
- [pages/settings/dirs.tsx:119](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/dirs.tsx#L119) — trigger `render={<Button …/>}` plus 3 `onSelect` → `onClick`.
- [pages/market-page.tsx:529](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/market-page.tsx#L529) — 4 tooltip triggers (icon element, plain `<button>`, two `<span className="flex items-center gap-1.5">` at :595 and :605).
- [pages/installed-page.tsx:221](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L221) — 4 tooltip/menu triggers + 4 `onSelect` → `onClick`.
- [pages/settings/preferences.tsx:31](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/preferences.tsx#L31) — `Select` now supplies `items` so the trigger renders the selected label; value coerced with `String(value ?? '')`.

Verification: `npm run typecheck` exit 0, `npm run build` exit 0, `npm run smoke` 20/20 checks pass (`scripts/smoke.mjs` gained dialog / tooltip / menu + sheet / select sections). Leftover scan `grep -rn "radix-ui\|@radix-ui\|asChild\|data-\[state\|IconPlaceholder" src/ scripts/` → clean.

## Left alone

- `components/ui/sonner.tsx`, `components/ui/badge.tsx`, `components/ui/input.tsx` — not radix (sonner is its own library; badge/input are plain elements).
- `components.json` — deliberately not flipped; there is no `base-new-york` style and retargeting would restyle the app.
- Throwaway probes created during the migration (`src/renderer/src/lib/_twprobe.ts`, `scripts/_baseui-probe.mjs`, `scripts/_select-probe.mjs`) were deleted; `scripts/` now holds only `screenshot.mjs` and `smoke.mjs`.
- The repo has no commits yet (`git log` → "does not have any commits yet"), so the usual per-component commit safety net was unavailable. Instead the files in scope were copied to `/tmp/openworkit-pre-baseui/` before editing — that snapshot holds the 12 `components/ui/*.tsx` wrappers, `App.tsx`, `package.json` and `components.json`. It is **not** a full-tree snapshot; consumer pages were reverted by hand from this report when needed.

## Behavior changes

- **`components.json` style is still `new-york`** — flagged, not fixed. The shadcn CLI reads that name as a radix style, so any future `shadcn add <component>` will deliver **radix** variants into a now-Base-UI project. Either switch the style to a `base-*` one (which also restyles) or add components manually and port them with the same engine.
- **Tabs activation**: Base UI `Tabs` defaults to manual activation — no `activateOnFocus` prop exists. Moving focus across `TabsList` no longer switches panels. The app navigates by click, so this is invisible here, but it is a real delta.
- **TooltipProvider**: `skipDelayDuration` → `timeout`; semantics are close but not identical (timeout is the max wait before the tooltip is considered "skipped"), so the 200ms feel was kept by naming.
- **Tooltip popup has no `role="tooltip"`** in Base UI 1.9 (it sets `aria-describedby` on the trigger instead) — any test or a11y query targeting the role must use `[data-base-ui-portal]`/text instead.
- **Select**: `alignItemWithTrigger` is set to `false` and `side='bottom' sideOffset=6 align='start'` were chosen to reproduce the old radix `position="popper"` look. Base UI `Select` renders the trigger label from the `items` collection, so every `Select` must pass `items` (or a `Value` child) or the trigger shows empty. `onValueChange` can receive `null` when cleared.
- **DropdownMenuLabel** is wrapped in `MenuPrimitive.Group` because Base UI's `GroupLabel` only renders inside a group context.
- **Menu items no longer auto-close by default in all cases** — Base UI `Menu.Item` exposes `closeOnClick`; the project's items close as expected for plain clicks, but this is worth hand-checking for nested/custom handlers.
- **Separator** wrapper lost the radix `decorative` prop (Base UI infers it); the wrapper is currently unused by app code — only `DropdownMenuSeparator` is.
- **Switch root renders a `<span>`, not a `<button>`**, so `disabled:*` Tailwind variants do not apply; the wrapper uses `data-disabled:*` instead.
- `@radix-ui/react-scroll-area` was a declared dependency with no import anywhere — removed as unused, nothing lost.

## Verify by hand

One minute of clicking in the dev app (`env -u ELECTRON_RUN_AS_NODE npm run dev`):

1. Tooltip: hover the refresh icon on 已安装 → appears after ~300ms, follows on mouse leave; no flash when moving between the market card's two icon rows.
2. Menu: open the row `⋯` menu → arrow keys move highlight, Enter fires the action **and** closes the menu, Escape closes without action; 查看 SKILL.md opens the sheet and Escape closes it back to the page.
3. Dialog: 市场 → 添加 → confirm the open animation, click the backdrop and the X, then Escape; focus returns to the trigger.
4. Select: 设置 → 偏好 → open 安装目录, check the popup width matches the trigger, typeahead a label, confirm the trigger text updates and the store persists after restart.
5. Switch + Tabs: toggle a skill, then flip the 已安装 agent tabs by click; Tab through the tab list and confirm panels do **not** switch on focus (manual activation, by design).
