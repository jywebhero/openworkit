# tabs

2026-10-28 · transformation engine (legacy `new-york` style has no `base-*` counterpart); the project's own classes were kept. Verdict: migrated, one real behaviour delta flagged (activation model).

## Changed

- [src/renderer/src/components/ui/tabs.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tabs.tsx#L1) — `@radix-ui/react-tabs` → `@base-ui/react/tabs`. The `import type { ComponentProps } from 'react'` typing idiom was replaced by `TabsPrimitive.<Part>.Props` on all four wrappers ([tabs.tsx:4](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tabs.tsx#L4), :8, :20, :32) — note this file still has no `import * as React` because JSX is handled by the automatic runtime.
- Part renames: `TabsPrimitive.Trigger` → `TabsPrimitive.Tab` ([tabs.tsx:20-22](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tabs.tsx#L20)); `TabsPrimitive.Content` → `TabsPrimitive.Panel` ([tabs.tsx:32-33](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tabs.tsx#L32)). `Root` and `List` keep their names — Base UI's `Tabs.List` is the tab *bar*, which is what the wrapper exports as `TabsList`.
- Class renames on the trigger ([tabs.tsx:24](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/tabs.tsx#L24)): `data-[state=active]:border-foreground data-[state=active]:text-foreground` → `data-active:border-foreground data-active:text-foreground`, and radix's `disabled:pointer-events-none disabled:opacity-50` became `aria-disabled:pointer-events-none aria-disabled:opacity-50` (Base UI marks an inactive/disabled tab with `aria-disabled` rather than the `disabled` attribute).
- Every other class is byte-identical to [the pre-migration file](file:///tmp/openworkit-pre-baseui/ui/tabs.tsx): the list's `scrollbar-none flex items-center gap-1 overflow-x-auto border-b border-border`, the trigger's `-mb-px h-9 … border-b-2 border-transparent px-2.5 text-[12.5px]`, and the panel's `outline-none`.
- Exported API (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) is unchanged, so the single consumer [pages/installed-page.tsx:269-285](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L269) needed no edit — `value` / `onValueChange` and the per-tab `value` prop are named the same in Base UI.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state\|Trigger\|Content" src/renderer/src/components/ui/tabs.tsx` → no matches.

## Left alone

- `components/ui/sonner.tsx` (toast library, not radix), `badge.tsx`, `input.tsx`.
- The `scrollbar-none` utility on TabsList — it comes from the app's own Tailwind theme, not the primitive.

## Behavior changes

- **Manual activation is now the default.** Radix `Tabs.Root` switched panels as soon as a tab received focus via arrow keys; Base UI `Tabs.Root` requires an explicit click/Enter and has no `activateOnFocus` prop to re-enable it. The installed page's directory tabs therefore no longer preview while you arrow through them. Flagged, not patched — the click-to-activate behaviour is what the smoke suite and the screenshot evidence exercised.
- Base UI does not unmount inactive panels the same way radix's `forceMount` semantics worked; here every panel is rendered by a `.map()` with a distinct `value`, so the visible behaviour (one panel shown) is unchanged.
- The `title={dir.path}` tooltip on each tab ([installed-page.tsx:272](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L272)) is a native browser title, unaffected.

## Verify by hand

Fifteen seconds: 已安装 → the tab bar lists each skill directory with its agent logo and count. Click through three tabs and confirm the underline (2px `border-foreground`) tracks the active one and the panel below swaps; then press Left/Right arrow across the tab bar and confirm the underline moves **without** the panel content changing (that is the new manual-activation behaviour); click once to commit. Finally shrink the window until the tab bar scrolls horizontally and confirm `overflow-x-auto` still works with no visible scrollbar.
