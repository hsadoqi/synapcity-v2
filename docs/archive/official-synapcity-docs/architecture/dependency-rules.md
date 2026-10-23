# Dependency Rules

Synapcity should grow through clear boundaries, not accidental imports.

---

## Default Flow

```text
Component
  ↓
Hook
  ↓
Store / Service
  ↓
Repository
  ↓
Database
```

---

## Allowed Imports

| From | May import |
| --- | --- |
| Route/page | feature page modules, shells, providers |
| Component | UI primitives, hooks, types |
| Hook | stores, services, route utilities |
| Store | pure utilities, services, domain types |
| Service | repositories, validators, domain logic |
| Repository | Prisma/database client |
| Shared package | shared utilities/types only |

---

## Forbidden Imports

### UI must not import Prisma

Bad:

```ts
import { prisma } from '@/lib/prisma'
```

Good:

```ts
import { useDashboard } from '../hooks/use-dashboard'
```

### Features must not import another feature's internals

Bad:

```ts
import { DocumentEditorInternalToolbar } from '@/modules/documents/components/internal-toolbar'
```

Good:

```ts
import { DocumentPreviewCard } from '@/modules/documents/public'
```

### Shared packages must not import app code

Shared packages should remain portable.

Bad:

```ts
import { appRoutes } from '@/app/routes'
```

Good:

```ts
export type RouteDescriptor = { href: string; label: string }
```

---

## Public API Pattern

Each feature should expose a small public API.

```text
modules/documents/
├── public.ts
├── components/
├── hooks/
├── stores/
├── services/
└── types.ts
```

Other features should import from `public.ts`, not from deep internal paths.

---

## Dependency Smells

A dependency probably needs review if:

- a component imports a repository
- a widget imports dashboard internals
- a route owns complex business logic
- a feature imports another feature's private component
- a store contains JSX
- a shared package imports from `apps/web`
- adding a feature requires editing many unrelated files
