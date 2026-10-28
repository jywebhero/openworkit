# dropdown-menu

2026-10-28 · transformation engine (legacy `new-york` style has no `base-*` registry counterpart), project classes kept verbatim. Verdict: migrated; the anatomy changed the most of any component here (Positioner inserted, Item events renamed, Label needs a Group).

## Changed

- [src/renderer/src/components/ui/dropdown-menu.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L1) — `@radix-ui/react-dropdown-menu` → `@base-ui/react/menu` (Base UI folds dropdown + context menu into one `Menu` family). `Root` and `Trigger` names survive, so [:4-5](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L4) stay bare re-exports.
- [:7-39](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L7) — `Content` → `Portal > Positioner > Popup`. Radix's `Content` positioned itself from `sideOffset`; Base UI requires the `Positioner` ([dropdown-menu.tsx:21-27](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L21)) to carry the placement, so `side` / `sideOffset` / `align` / `alignOffset` are declared on the wrapper via `Pick<Positioner.Props, …>` and forwarded **down**, keeping consumer props (`align="end"`, `align="start"`, `className="w-[190px]"`) working untouched. Defaults match the old radix defaults: `side='bottom'`, `sideOffset=6`, `align='center'`, `alignOffset=0`. The Positioner gets `isolate z-50 outline-none` and the Popup keeps the visual box (`min-w-[180px] rounded-xl border-border bg-popover p-1 shadow-lg`).
- [:31-32](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L31) — animation gating renamed `data-[state=open]/[state=closed]` → `data-open:` / `data-closed:` (the `tw-animate-css` keyframes themselves are unchanged).
- [:42-60](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L42) — `Item` keeps its classes with only attribute renames: `data-[highlighted]:` → `data-highlighted:`, `data-[disabled]:` → `data-disabled:`. The project-local `inset` prop still maps to `pl-8`.
- [:62-66](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L62) — `Menu.Separator`, classes unchanged.
- [:68-77](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dropdown-menu.tsx#L68) — `DropdownMenuLabel` now renders `MenuPrimitive.GroupLabel` **wrapped in `MenuPrimitive.Group`**. Verified against `menu/group-label/MenuGroupLabel.js:29`, which calls `useMenuGroupRootContext()` unconditionally and then `setLabelId(...)` in a layout effect — outside a `Menu.Group` that hook returns no context and the component throws, so the wrapper had to add the Group. Same file line 41 shows the label renders with `aria-hidden: true`, i.e. it is a purely visual label (radix's `DropdownMenu.Label` was too), so the extra Group layer costs nothing semantically. The visible class list is unchanged.
- Consumers — 3 files, all rewritten at the call site:
  - [components/app/sidebar.tsx:46](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/sidebar.tsx#L46) — `asChild` → `render={<Button variant="ghost" size="icon-sm" … />}`; the label at [sidebar.tsx:57](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/app/sidebar.tsx#L57) and 5 items (:58 市场, :62 已安装, :66 设置, :71 检查更新, :74 退出) went `onSelect` → `onClick`.
  - [pages/settings/dirs.tsx:119](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/dirs.tsx#L119) — trigger `render={<Button … />}`, 3 items `onSelect` → `onClick` (:124 打开, :128 在 Finder 中显示, :135 移除目录, the last one destructive-styled).
  - [pages/installed-page.tsx:401](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L401) — `render={<Button … />}` on the row `⋯` trigger; 4 items `onSelect` → `onClick` (:407 查看 SKILL.md, :411 在 Finder 中显示, :415 停用/启用, :419 移到废纸篓) with the separator at :418.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|onSelect\|data-\[state\|data-\[highlighted\|asChild" src/renderer/src/components/ui/dropdown-menu.tsx` → no matches, and `grep -rn "onSelect=" src/renderer/src` is empty project-wide.

## Left alone

- `components/ui/select.tsx` — its own primitive family (`Select`), migrated separately.
- `components/ui/sonner.tsx`, `badge.tsx`, `input.tsx` — not radix.
- No submenu / checkbox-item / radio-item parts existed in this wrapper, so nothing was dropped; if they are added later they map to `Menu.Submenu` / `Menu.CheckboxItem` and need the same Positioner treatment.

## Behavior changes

- **`onSelect` → `onClick`**: verified in `menu/item/MenuItem.d.ts`, `closeOnClick` defaults to `true`, so activation closes the menu the same way radix's `onSelect` did. The difference is reach: any future item that must keep the menu open now has to pass `closeOnClick={false}` instead of just returning early from `onSelect`.
- **The trigger opens on `mousedown`, not on click.** `menu/trigger/MenuTrigger.js:166` dispatches with `event: 'mousedown'` (except inside a menubar), so the popup appears a beat earlier than radix's click-driven open, and a press-drag-release that starts on the `⋯` already opens it. Base UI guards the reverse case itself (`MenuTrigger.js:201` — mousedown→mouseup inside 200ms must not fire a menu item). Flagged, not patched; the row triggers sit inside clickable rows, so hand-check that opening a menu no longer also fires the row's own click.
- Base UI's items support keyboard *text navigation* with an optional `label` override prop (`MenuItem.d.ts:30-35`) that falls back to the rendered text. This interacts with the newly-required `Group` wrapper around the label, so whether a typed character can land on a GroupLabel must be hand-checked (radix had no such context).
- Checkable/radio items are not used here; if they are added later they carry `data-selected`/`data-checked` instead of radix's `data-[state=checked]`.

## Verify by hand

Forty seconds, the family's real keyboard surface:
1. 侧边栏 → click the logo-row chevron → menu opens under it, left-aligned, 200px wide; the tagline label renders above 市场/已安装/设置; arrow-key down through items — the highlight must follow with the `bg-accent` fill; Enter on 检查更新 must navigate **and** close the menu.
2. Type "市" or press `市`/`m` — confirm the typeahead lands on an expected item and does not get stuck on the GroupLabel.
3. 已安装 → row `⋯` → 查看 SKILL.md opens the sheet and closes the menu; 停用 toggles and the row goes muted with the "已启用/已停用" toast; 移到废纸篓 must delete and the menu must not stay open afterwards.
4. Escape with nothing highlighted closes without action, and focus returns to the `⋯` trigger.
