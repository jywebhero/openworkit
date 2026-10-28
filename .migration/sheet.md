# sheet

2026-10-28 · transformation engine (legacy `new-york` style — there is no `base-new-york` registry variant, so the project's own file was rewired and its classes kept). Verdict: migrated; the slide-in animation is preserved on purpose rather than replaced by Base UI's idiomatic transition.

## Changed

- [src/renderer/src/components/ui/sheet.tsx:2](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L2) — `@radix-ui/react-dialog` → `@base-ui/react/dialog`. The sheet is built on the dialog primitive in both libraries, so `Root` / `Trigger` / `Close` re-exports at [sheet.tsx:6-8](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L6) are unchanged.
- [sheet.tsx:13-18](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L13) — `DialogPrimitive.Overlay` → `DialogPrimitive.Backdrop` (`bg-black/30 backdrop-blur-[1px]` kept).
- [sheet.tsx:19-33](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L19) — `DialogPrimitive.Content` → `DialogPrimitive.Popup`; the always-present close button became `DialogPrimitive.Close` with the same classes. No `Positioner`: the panel is pinned by its own `fixed inset-y-0 right-0 … w-[560px] max-w-[94vw]` classes.
- [sheet.tsx:22-23](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L22) — attribute rename only: `data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200` → `data-open:…`, and the `data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-150` pair → `data-closed:…`. The `tw-animate-css` keyframes were deliberately kept instead of swapping in Base UI's `data-starting-style`/`data-ending-style` + `transition` idiom, because the side effect would have changed the perceived slide distance/timing.
- `SheetHeader` / `SheetTitle` / `SheetDescription` ([sheet.tsx:38-58](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/sheet.tsx#L38)) keep their markup and classes; only the typing moved to `DialogPrimitive.Title.Props` / `.Description.Props`.
- Consumer: one file, [pages/installed-page.tsx:445-561](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L445) (the SKILL.md viewer). Its `Sheet` is controlled with `open` / `onOpenChange`, which Base UI names identically, and `SheetTrigger` is never used — the row menu opens it via state, so no `asChild` call site existed here.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|data-\[state\|Overlay" src/renderer/src/components/ui/sheet.tsx` → no matches.

## Left alone

- `components/ui/dialog.tsx` — the same underlying primitive, migrated in its own report.
- `components/ui/sonner.tsx` — not radix.
- The `w-[560px] max-w-[94vw]` sizing — project-specific, not a radix artifact, so it was not "normalized" to registry widths.

## Behavior changes

- Exit animation is now actually observable: Base UI keeps the Popup mounted through the close, so `data-closed:slide-out-to-right` fires. With radix the same class list was already used, so this is not a visual regression — but a caller that relied on instant unmount would notice the extra 150ms.
- Escape closes the sheet and focus returns to the element that opened it (here, the row's `⋯` menu item, which unmounts when the menu closes). The smoke run only asserts Escape-dismiss, not focus-return, so **hand-check focus restoration** after 查看 SKILL.md → Escape.
- Backdrop click dismisses by the same `onOpenChange` contract; the installed page's handler ignores the `reason` argument Base UI passes, which is fine but means it cannot distinguish backdrop vs. close-button.

## Verify by hand

Fifteen seconds: 已安装 → row `⋯` → 查看 SKILL.md. The panel must slide in from the right over ~200ms with the backdrop fading in, show the skill name in the header and the markdown body scrollable, and the X at `top-4 right-4` must not overlap the title (that is why `SheetHeader` keeps `pr-8`). Press Escape — panel slides out over ~150ms, and the toast row underneath must still be interactive.
