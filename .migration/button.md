# button

2026-10-28 · transformation engine (legacy `new-york` style has no `base-*` registry counterpart), keeping the project's exact cva classes. Verdict: migrated clean; the wrapper now uses the real Base UI `Button` primitive rather than a hand-rolled `useRender` composition.

## Changed

- [src/renderer/src/components/ui/button.tsx:1](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/button.tsx#L1) — `import { Slot } from '@radix-ui/react-slot'` → `import { Button as ButtonPrimitive } from '@base-ui/react/button'`.
- [button.tsx:5-31](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/button.tsx#L5) — the `cva` block is byte-for-byte unchanged, including `disabled:pointer-events-none disabled:opacity-50` and the `[&_svg]` rules.
- [button.tsx:33-46](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/components/ui/button.tsx#L33) — props went from `React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }` to `ButtonPrimitive.Props & VariantProps<typeof buttonVariants>`; the `asChild` branch (`const Comp = asChild ? Slot : 'button'`) is gone because Base UI's own `render` prop covers it. The export list `export { Button, buttonVariants }` is unchanged — the old file never exported a `ButtonProps` type.
- `@radix-ui/react-slot` was the only radix import removed here and turned out to be unused by the rest of the project, so it was dropped from `package.json` with no consumer edits.
- Consumers needed no change for the variant/size API. Where a `Button` is used *as* another component's trigger the call site was rewritten by that component's migration (`render={<Button … />}` at [pages/settings/dirs.tsx:119](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/settings/dirs.tsx#L119), [pages/installed-page.tsx:221](file:///Users/jackyin/Workspace/openworkit/src/renderer/src/pages/installed-page.tsx#L221)).
- 10 files import this wrapper (topbar, sidebar, settings/overview, settings/advanced, settings/environment, settings/updates, settings/dirs, market-page, connectors-page, installed-page); all render unchanged.
- Leftover scan clean: `grep -n "radix-ui\|@radix-ui\|Slot\|asChild" src/renderer/src/components/ui/button.tsx` → no matches.

## Left alone

- `class-variance-authority` and the variant names (`default` / `secondary` / `outline` / `ghost` / `destructive` / `link`, sizes incl. `icon-sm`) — project API, not radix.
- `components/ui/badge.tsx` — plain `<span>`, never used Slot.

## Behavior changes

- Base UI's `Button` is typed `NativeButtonProps & BaseUIComponentProps<'button', …>` (verified in `node_modules/.../@base-ui/react/button/Button.d.ts:16`), so it still renders a native `<button>` and takes `disabled` / `type` straight through. Neither the old nor the new wrapper defaulted `type`, so form-submit behaviour is unchanged.
- `asChild` is gone; the equivalent is `render={…}`. The snapshot shows `asChild` was **declared but never used** on `<Button>` anywhere in the app, so this wrapper needed no consumer edits — the `render` rewrites all came from tooltip/menu/select trigger call sites.
- The primitive adds its own `data-base-ui-*` / `button-size`-style state attributes on the element. Nothing in the project's CSS keys off them, and the old `data-[state]` selectors were never used here.

## Verify by hand

Ten seconds of clicking: on 市场 hover a card's primary button (variant + hover colors), on 设置 → 目录 press a `size="icon-sm"` ghost button (28px box, icon centered, no label spill), and confirm a `disabled` button is both dimmed and unclickable.
