# Storybook

Component workshop for `@synapcity/frontend-ui`. It owns the Storybook configuration (`.storybook/`), the theme addon wiring and the `/brand-assets` mount. It is a brand host, not an owner: `@synapcity/frontend-brand` owns the files, and `public/brand-assets` holds generated compatibility aliases only ([brand README](../../packages/frontend/brand/README.md)). It does not own components or stories: stories live beside the component in `packages/frontend/ui/src/{components,blocks}/**/*.stories.tsx`.

Framework: `@storybook/nextjs-vite` (Storybook 10, Vite, React 19). Styling comes from `@synapcity/frontend-tailwind-config` through `@synapcity/frontend-ui/styles.css`; the theme addon toggles the `light` and `dark` classes on `<html>`.

## Commands

Run from this directory, or with `pnpm --filter storybook <script>` from the repository root.

| Command                | What it does                               |
| ---------------------- | ------------------------------------------ |
| `pnpm dev`             | Start Storybook on <http://localhost:6006> |
| `pnpm build-storybook` | Build the static site                      |
| `pnpm check-types`     | Type-check the config                      |
| `pnpm lint`            | Lint the config                            |

## Notes

- Prop tables use Storybook's default `react-docgen`. `react-docgen-typescript` is not used because its Vite plugin does not support TypeScript 7.0.x (see the comment in `.storybook/main.ts`).
- `a11y: { test: 'error' }` in `.storybook/preview.tsx` makes accessibility violations fail the Vitest addon run. `vitest.config.ts` is set up for it, but no script runs it yet.
- Add a story by creating `*.stories.tsx` beside the component; no registration is needed.
