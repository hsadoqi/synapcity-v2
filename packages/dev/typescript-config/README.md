# @repo/typescript-config

Owns: the shared `tsconfig` bases that workspaces extend.

| File                 | For                      |
| -------------------- | ------------------------ |
| `base.json`          | Any TypeScript workspace |
| `nextjs.json`        | Next.js apps             |
| `react-library.json` | Shared React packages    |

A workspace extends one of them from its own `tsconfig.json`, for example `"extends": "@repo/typescript-config/nextjs.json"`. Compiler options specific to one workspace stay in that workspace.
