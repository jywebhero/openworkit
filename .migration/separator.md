# separator

2026-10-28 · transformation engine (legacy `new-york` style: no `base-*` registry pair, so the project's own file was rewired and its classes kept). Verdict: migrated; the wrapper is a passthrough and, as it happens, has no consumers in this app.

## Changed

- [src/renderer/src/components/ui/separator.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/separator.tsx#L1) — `import * as SeparatorPrimitive from '@radix-ui/react-separator'` → `import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'`; `import * as React` dropped since the typing no longer needs `ComponentProps<typeof …>`.
- [separator.tsx:4-8](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/separator.tsx#L4) — props are now `SeparatorPrimitive.Props`. The radix-only `decorative = true` prop and its pass-through were removed: `Separator.d.ts` exposes only `orientation` (`@default 'horizontal'`) — Base UI has no decorative switch at all, its Separator docstring is literally "A separator element accessible to screen readers" and `Separator.js:32-33` always emits `role: 'separator'` + `aria-orientation`.
- Classes on [separator.tsx:13-14](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/separator.tsx#L13) are unchanged (`shrink-0 bg-border` + the orientation split); `orientation` still defaults to `horizontal` and the split is still computed in the wrapper.
- [separator.tsx:10-11](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/separator.tsx#L10) — Base UI's `Separator` is a callable component, not a `.Root`, so the part indirection is gone.
- Consumer sweep: **none**. `grep -rn "<Separator" src/renderer/src` matches only the wrapper's own file — the app draws rules with `DropdownMenuSeparator` and with `border-*` utilities instead. The 3 `DropdownMenuSeparator` import sites (sidebar.tsx:70, settings/dirs.tsx:132, installed-page.tsx:418) belong to the dropdown-menu migration.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|decorative" src/renderer/src/components/ui/separator.tsx` → no matches.

## Left alone

- `DropdownMenuSeparator` in [components/ui/dropdown-menu.tsx:62](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L62) — it uses `Menu.Separator`, a different primitive that must stay inside the menu's own portal/context; sharing this wrapper would break the menu anatomy.
- `components/ui/badge.tsx`, `components/ui/input.tsx` — not radix.

## Behavior changes

- The `decorative` prop no longer exists on this wrapper. A caller passing it would get it forwarded to the DOM as an unknown attribute rather than controlling semantics.
- Rendered markup differs: radix emitted `<hr>`-like `role="separator"` / `aria-orientation`, Base UI emits a `role="none"` div when decorative (its default). Visually identical; only an a11y-tree diff, and nothing here relies on the separator being reachable.

## Verify by hand

Ten seconds: nothing in the UI uses this wrapper, so the check is that the app still renders — open 设置 → 目录 and a row `⋯` menu and confirm the divider between the 打开 / 在 Finder 中显示 pair and the 移除 item is a 1px `bg-border` rule with the `-mx-1 my-1` insets. That line is `Menu.Separator`; if it looks right, this family is fine.
