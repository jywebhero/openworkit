# dialog

2026-10-28 · transformation engine (legacy `new-york` style has no `base-*` counterpart), classes kept verbatim. Verdict: migrated; the only structural decision was that a centered modal does **not** need Base UI's Positioner layer.

## Changed

- [src/renderer/src/components/ui/dialog.tsx:2](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L2) — `@radix-ui/react-dialog` → `@base-ui/react/dialog`. `Root` / `Trigger` / `Close` / `Portal` / `Title` / `Description` keep their names, so [dialog.tsx:6-8](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L6) stayed bare re-exports.
- [dialog.tsx:10-21](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L10) — `DialogOverlay` now wraps `DialogPrimitive.Backdrop` (radix's `Overlay`), typed `DialogPrimitive.Backdrop.Props`; still rendered as a private helper inside `Portal`, never exported, so consumers are unaffected.
- [dialog.tsx:23-51](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L23) — `Content` → `Popup`. No `Positioner` was inserted: Base UI only needs one for anchored floating panels, and this popup is positioned by its own `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2` classes. The project's local `showClose` prop and the built-in `DialogPrimitive.Close` + `sr-only` label survived ([dialog.tsx:42-47](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L42)).
- [dialog.tsx:34](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L34) — `outline-none` was added to the Popup class list (radix's Content shipped an equivalent reset; Base UI does not, so without it the focused dialog shows the browser ring).
- [dialog.tsx:15](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L15), [:35-36](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/dialog.tsx#L35) — the state-gated animation classes were renamed `data-[state=open]:animate-in …` / `data-[state=closed]:animate-out …` → `data-open:animate-in …` / `data-closed:animate-out …`. `tw-animate-css` is still in `package.json` and still does the work; Tailwind 4.3.3 compiles the bare `data-*` shorthand (checked in the built CSS).
- All other classes are byte-identical to [the pre-migration file](file:///tmp/openworkit-pre-baseui/ui/dialog.tsx) (`bg-black/35 backdrop-blur-[2px]`, `grid w-full max-w-lg gap-4 rounded-2xl border-border bg-card p-6 shadow-2xl`, header/footer/title/description).
- Consumers: 3 files use dialogs, all through controlled `open` / `onOpenChange`, which Base UI names identically — [pages/settings/advanced.tsx:92](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/advanced.tsx#L92), [pages/market-page.tsx:446](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/market-page.tsx#L446) and the skill detail dialog at [pages/market-page.tsx:678](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/market-page.tsx#L678), [pages/installed-page.tsx:564](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L564). No `DialogContent` call site needed a prop change (their `className="max-w-[420px]"` overrides still land last in `cn`).
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state\|Overlay\b\|ContentPrimitive" src/renderer/src/components/ui/dialog.tsx` → no matches.

## Left alone

- `components/ui/sheet.tsx` — also radix dialog, migrated in its own report.
- `components/ui/sonner.tsx` — toast library, not radix.
- `components/ui/dropdown-menu.tsx` — a different primitive family (`Menu`), migrated separately.

## Behavior changes

- Backdrop click, Escape and focus trapping are Base UI's own implementations. Externally they behave the same (the smoke run exercises backdrop-driven open, the X button, and Escape), but the close is now cancellable through `onOpenChange` with a `reason` argument — code that only reads `open` (as all three call sites do) is unaffected.
- Base UI does not unmount the Popup during the exit animation, which is why `data-closed:animate-out` is now reachable; radix needed the same trick via `forceMount`-style class gating.
- radix set `aria-modal`/`role="dialog"` on Content; Base UI's Popup also renders `role="dialog"`, and the smoke assertions had to be written against `getByRole('dialog')` + a specific inner `Close`/button rather than text, because a `DialogDescription` matched the same string twice (strict-mode violation, fixed by narrowing the locator).
- A dialog without a `DialogTitle` triggers Base UI's a11y warning rather than radix's; all three project dialogs pass a title, so nothing changed in practice.

## Verify by hand

Twenty seconds: 市场 → 添加本地技能 (opens, backdrop blurs, X closes, Escape closes); click a market card → detail dialog scrolls inside `max-w-[560px]`, its 安装 button still works, and after closing, focus is back on the card that opened it; 设置 → 高级 → 重置 triggers the confirm dialog and the backdrop click must *not* dismiss it if the app expects an explicit choice — check that the reset flow still requires a button press.
