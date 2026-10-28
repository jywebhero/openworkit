# tooltip

2026-10-28 · transformation engine (legacy `new-york` style: no `base-*` registry pair), classes kept. Verdict: migrated; the positioning model is the structural change (a `Positioner` layer had to be inserted).

## Changed

- [src/renderer/src/components/ui/tooltip.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L1) — `@radix-ui/react-tooltip` → `@base-ui/react/tooltip`; `import * as React` dropped.
- [tooltip.tsx:4-6](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L4) — `Provider` / `Root` / `Trigger` stay bare re-exports (Base UI names them identically).
- [tooltip.tsx:21-39](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L21) — radix's `Portal > Content` (Content positioned itself) became `Portal > Positioner > Popup`. The `Positioner` carries `className="isolate z-50"` ([tooltip.tsx:27](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L27)) and the Popup keeps the visual classes, so the stacking order matches the old output.
- [tooltip.tsx:8-19](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L8) — `side` / `sideOffset` / `align` / `alignOffset` were radix `Content` props; they are now declared on the wrapper (`Pick<Positioner.Props, …>`) and **forwarded down to the Positioner**, so consumer call sites that pass them keep working untouched. Defaults chosen to match the old behaviour: `side='top'`, `sideOffset=6`, `align='center'`, `alignOffset=0`.
- [tooltip.tsx:32-33](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tooltip.tsx#L32) — the enter animation was previously unconditional (`animate-in fade-in-0 zoom-in-95`, per [the pre-migration file](file:///tmp/openworkit-pre-baseui/ui/tooltip.tsx)); it is now gated on `data-open:` / `data-closed:`. `tw-animate-css` stays in `package.json` for this reason. Tailwind 4.3.3 compiles the bare `data-open:` shorthand — verified in the built CSS, not assumed.
- Consumer sweep — 5 files import tooltip primitives; each `TooltipTrigger asChild` became `render={…}`:
  - [App.tsx:10](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/App.tsx#L10) — `<TooltipProvider delay={300} timeout={200}>` (was `delayDuration` / `skipDelayDuration`).
  - [components/app/topbar.tsx:48](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/topbar.tsx#L48) and [components/app/symlink-mark.tsx:11](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/symlink-mark.tsx#L11).
  - [pages/market-page.tsx:529](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/market-page.tsx#L529) (`render={<BadgeCheck …/>}`), :540 (`render={<button … onClick=… />}` — the install `+` button, whose `event.stopPropagation()` handler survived), :595 and :605 (`render={<span className="flex items-center gap-1.5" />}`).
  - [pages/installed-page.tsx:221](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L221) (`render={<Button … onClick=… />}`).
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|asChild\|data-\[state" src/renderer/src/components/ui/tooltip.tsx` → no matches; same grep across `src/renderer/src` → no matches.

## Left alone

- `components/ui/sonner.tsx` — toast, its own library.
- Native `title="…"` attributes (e.g. on the tabs at [installed-page.tsx:272](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L272)) are browser tooltips, unrelated to the primitive.

## Behavior changes

- **The tooltip popup carries no `role="tooltip"`, and no `aria-describedby` is emitted either.** `grep -rl "aria-describedby" @base-ui/react` hits Dialog/Popover/Drawer/Toast/Slider, but nothing under `tooltip/`, and a DOM dump of the portal in the running app confirmed the Popup has no role attribute (radix set `role="tooltip"` + `aria-describedby` on the trigger). So a screen reader no longer announces these hints — `getByRole('tooltip')` times out, which is why `scripts/smoke.mjs` asserts on `[data-base-ui-portal]` + text instead. Flagged, not patched: the fix would be passing an explicit `aria-label`/`id` pair at each trigger.
- `skipDelayDuration` → `timeout`, and the values are not equivalent: Base UI documents `timeout` as "another tooltip opens instantly if the previous one closed within this window" with a **default of 400ms** (`TooltipProvider.d.ts:22-25`), whereas the project's radix value was `skipDelayDuration={200}`. The 200 was carried over by naming, which makes the skip window *shorter* than it was before — hover-then-hover-again feels slightly slower to group. Judge it by hand.
- `delay` precedence is trigger → provider → `OPEN_DELAY` (600ms, `tooltip/utils/constants.js:7`). `App.tsx` sets `delay={300}` on the Provider and no trigger overrides it, so the open delay is genuinely 300ms, same as radix's `delayDuration={300}`.
- `TooltipTrigger` has `closeOnClick` defaulting to `true` (`TooltipTrigger.d.ts`), so clicking a tooltip's own trigger dismisses it. The market page's `+` install button is a tooltip trigger, so clicking it now also hides its tooltip — harmless, but new.

## Verify by hand

Thirty seconds: 已安装 → hover the header refresh icon → the dark tooltip appears after roughly 300ms and disappears on mouse-leave with the zoom-out; move quickly to a neighbouring icon and confirm the second tooltip shows with no delay (skip window). Then 市场 → hover a row's star/download spans (the two `<span>` triggers) and confirm the tooltip anchors above and does not clip at the card edge; hover the `+` button on an installed card — tooltip must say "已安装" and clicking must do nothing.
