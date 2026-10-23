# Package: search

This package is responsible for search indexing, result contracts, and contextual discovery.

---

## Responsibilities

- expose stable public types
- expose reusable primitives
- hide implementation details
- avoid importing app-specific routes or feature internals
- document extension points

---

## Public API Rule

Other code should import from the package's public entry point, not deep internal files.

```ts
import { something } from '@synapcity/search'
```

---

## Dependency Rule

Package code should remain reusable. It may depend on shared utilities and approved peer dependencies, but should not import from `apps/web` or from feature internals.

---

## Documentation Checklist

- [ ] public API documented
- [ ] examples included
- [ ] ownership clear
- [ ] dependencies clear
- [ ] testing approach clear
