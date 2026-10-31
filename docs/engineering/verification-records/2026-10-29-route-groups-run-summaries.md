# Route groups: sanitized run summaries (2026-10-29)

Extracted from local logs with terminal colour codes removed and the checkout path replaced by `<worktree>`. Only summary lines are kept; nothing else from the logs. Secrets scan: no JWTs, `sb_secret_`/`sb_publishable_` keys or bearer tokens appear in the originals.

## Repository gate, final tree `29255f3b` (`pnpm verify` from the repository root, CI placeholder values)

Exit 0

```text
@synapcity/domain-identity:lint: cache hit, replaying logs 6970c1dd44e30557
@synapcity/frontend-supabase:lint: cache hit, replaying logs 0eef18165500224a
@synapcity/domain-grids:lint: cache hit, replaying logs a9f5c7eb6b3c9cb0
@synapcity/dev-boundaries:lint: cache hit, replaying logs 4a7db348c2e81f11
@synapcity/dev-vitest-config:check-types: cache hit, replaying logs 0b5a34cf33856cd7
@synapcity/server-auth:lint: cache hit, replaying logs 4472cb5288e22c8b
@synapcity/dev-playwright-config:check-types: cache hit, replaying logs f48bc2ee22b66fce
@synapcity/domain-identity:check-types: cache hit, replaying logs 3999dfb292141fc5
@synapcity/frontend-site:check-types: cache hit, replaying logs e35e56a7548496ae
@synapcity/frontend-tokens:check-types: cache hit, replaying logs e4f76f2b883c8e00
@synapcity/domain-preferences:check-types: cache hit, replaying logs 3f500c745e7563b3
@synapcity/frontend-supabase:check-types: cache hit, replaying logs eb7e839b3483e5c5
@synapcity/frontend-site:lint: cache hit, replaying logs bf99db1ecaa33360
@synapcity/domain-records:check-types: cache hit, replaying logs 0689629d76c715ed
@synapcity/server-supabase:lint: cache hit, replaying logs 99963ea9d86ecbca
@synapcity/dev-boundaries:check-types: cache hit, replaying logs e791571ff4881580
@synapcity/frontend-tailwind-config:check-types: cache hit, replaying logs 9a88ab80dec23b85
@synapcity/domain-grids:check-types: cache hit, replaying logs 0e0b270539f86b2b
@synapcity/server-auth:check-types: cache hit, replaying logs 3c1a50ff6de4203a
@synapcity/frontend-preferences:check-types: cache hit, replaying logs a0f94d668ae5f6db
@synapcity/domain-prototypes:check-types: cache hit, replaying logs eb5a6a00f75c269a
@synapcity/domain-preferences:lint: cache hit, replaying logs 6e6e0ece8249a221
@synapcity/domain-spaces:check-types: cache hit, replaying logs 453201803016a347
@synapcity/domain-records:lint: cache hit, replaying logs d957727c01f959e3
@synapcity/frontend-preferences:lint: cache hit, replaying logs 141de76f313d8bdf
@synapcity/server-supabase:check-types: cache hit, replaying logs 91d0b4ee9a9d9064
@synapcity/server-account:lint: cache hit, replaying logs 1b15c6593cff6a98
@synapcity/frontend-error-reports:check-types: cache hit, replaying logs 4e23d96455bb3ef2
@synapcity/domain-dashboards:check-types: cache hit, replaying logs 225fbce028eaf562
@synapcity/domain-spaces:lint: cache hit, replaying logs 4990eccfbadcb9f6
@synapcity/domain-prototypes:lint: cache hit, replaying logs 2bfeebf4093bc4e3
@synapcity/frontend-error-reports:lint: cache hit, replaying logs b2c7e472d5ba0d14
@synapcity/server-account:check-types: cache hit, replaying logs b4c3b717a4c93121
@synapcity/server-data:lint: cache hit, replaying logs 3850cfd287836334
@synapcity/domain-dashboards:lint: cache hit, replaying logs c2f05ba25a8073a7
@synapcity/server-data:check-types: cache hit, replaying logs 8da5b0fba9359da2
@synapcity/dev-fixtures:check-types: cache hit, replaying logs cdff7b36d40bd6df
@synapcity/frontend-ui:check-types: cache hit, replaying logs 491d287f30812973
@synapcity/frontend-ui:lint: cache hit, replaying logs 588d3a7c402a7088
@synapcity/frontend-shells:check-types: cache hit, replaying logs bcaa377d35d04f98
storybook:check-types: cache hit, replaying logs 555891f9d3ab592d
@synapcity/frontend-forms:check-types: cache hit, replaying logs 832e15ed4049f88b
@synapcity/features-settings:check-types: cache hit, replaying logs 4b530cab85ab1271
@synapcity/frontend-collection:check-types: cache hit, replaying logs ce8671fce1a456f5
@synapcity/features-account:check-types: cache hit, replaying logs 286af296bcb1c6bd
@synapcity/features-dashboards:check-types: cache hit, replaying logs 02619b298bb5a96a
docs:check-types: cache hit, replaying logs 663a6fee9024fc77
@synapcity/features-spaces:check-types: cache hit, replaying logs c32b7b162014546c
@synapcity/features-auth:check-types: cache hit, replaying logs 65e0b027450cecb1
@synapcity/frontend-forms:lint: cache hit, replaying logs 049af856bdbd8a75
@synapcity/frontend-shells:lint: cache hit, replaying logs ba11d9dda3da623d
@synapcity/frontend-collection:lint: cache hit, replaying logs 6cf2e43d1f472b6a
@synapcity/features-settings:lint: cache hit, replaying logs 9d2ea9f2ce0e9b5e
storybook:lint: cache hit, replaying logs 6ac1036c25c3502d
web:check-types: cache miss, executing d51faf15246ad15a
@synapcity/features-dashboards:lint: cache hit, replaying logs f423e1ec326d458a
@synapcity/features-account:lint: cache hit, replaying logs b3aecdc15df6d6c9
docs:lint: cache hit, replaying logs 66d3205683c09dee
@synapcity/features-spaces:lint: cache hit, replaying logs abee3fbb0382f53d
@synapcity/features-auth:lint: cache hit, replaying logs fb80a106f4d60b93
web:lint: cache miss, executing c7332568d1e3afe7
 Tasks:    61 successful, 61 total
@synapcity/frontend-tailwind-config:test:coverage: cache hit, replaying logs e7119c009591b99b
@synapcity/frontend-tailwind-config:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tailwind-config:test:coverage:       Tests  22 passed (22)
@synapcity/frontend-tokens:test:coverage: cache hit, replaying logs 6ecee1eedbe7fb94
@synapcity/frontend-tokens:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tokens:test:coverage:       Tests  5 passed (5)
@synapcity/frontend-site:test:coverage: cache hit, replaying logs 747951ba144052ed
@synapcity/frontend-site:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-site:test:coverage:       Tests  11 passed (11)
@synapcity/domain-records:test:coverage: cache hit, replaying logs 8472342c03f53e6c
@synapcity/domain-records:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-records:test:coverage:       Tests  8 passed (8)
@synapcity/dev-boundaries:test:coverage: cache hit, replaying logs f626d60d04882da3
@synapcity/dev-boundaries:test:coverage:  Test Files  13 passed (13)
@synapcity/dev-boundaries:test:coverage:       Tests  149 passed (149)
@synapcity/frontend-supabase:test:coverage: cache hit, replaying logs 835b2474eb7b0e47
@synapcity/frontend-supabase:test:coverage:  Test Files  2 passed (2)
@synapcity/frontend-supabase:test:coverage:       Tests  8 passed (8)
@synapcity/domain-identity:test:coverage: cache hit, replaying logs 88c40f182a6fc84a
@synapcity/domain-identity:test:coverage:  Test Files  14 passed (14)
@synapcity/domain-identity:test:coverage:       Tests  139 passed (139)
@synapcity/domain-grids:test:coverage: cache hit, replaying logs 889d8a3c2319a7b4
@synapcity/domain-grids:test:coverage:  Test Files  5 passed (5)
@synapcity/domain-grids:test:coverage:       Tests  19 passed (19)
@synapcity/domain-preferences:test:coverage: cache hit, replaying logs 668278456a991481
@synapcity/domain-preferences:test:coverage:  Test Files  13 passed (13)
@synapcity/domain-preferences:test:coverage:       Tests  147 passed (147)
@synapcity/domain-prototypes:test:coverage: cache hit, replaying logs 23a9fd681aa8f6a6
@synapcity/domain-prototypes:test:coverage:  Test Files  18 passed (18)
@synapcity/domain-prototypes:test:coverage:       Tests  66 passed (66)
@synapcity/domain-spaces:test:coverage: cache hit, replaying logs adc25e11b41cbf94
@synapcity/domain-spaces:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-spaces:test:coverage:       Tests  57 passed (57)
@synapcity/server-auth:test:coverage: cache hit, replaying logs e3cc26f526bd392c
@synapcity/server-auth:test:coverage:  Test Files  4 passed (4)
@synapcity/server-auth:test:coverage:       Tests  20 passed (20)
@synapcity/frontend-preferences:test:coverage: cache hit, replaying logs 91d601d8f27310a4
@synapcity/frontend-preferences:test:coverage:  Test Files  18 passed (18)
@synapcity/frontend-preferences:test:coverage:       Tests  168 passed (168)
@synapcity/domain-dashboards:test:coverage: cache hit, replaying logs 8ce99f67adae67d4
@synapcity/domain-dashboards:test:coverage:  Test Files  4 passed (4)
@synapcity/domain-dashboards:test:coverage:       Tests  30 passed (30)
@synapcity/server-supabase:test:coverage: cache hit, replaying logs ebde3f814efbf220
@synapcity/server-supabase:test:coverage:  Test Files  9 passed (9)
@synapcity/server-supabase:test:coverage:       Tests  88 passed (88)
@synapcity/frontend-error-reports:test:coverage: cache hit, replaying logs b299ce8c25873f33
@synapcity/frontend-error-reports:test:coverage:  Test Files  3 passed (3)
@synapcity/frontend-error-reports:test:coverage:       Tests  21 passed (21)
@synapcity/dev-fixtures:test:coverage: cache hit, replaying logs b23217ae88decee2
@synapcity/dev-fixtures:test:coverage:  Test Files  4 passed (4)
@synapcity/dev-fixtures:test:coverage:       Tests  25 passed (25)
@synapcity/server-data:test:coverage: cache hit, replaying logs ed2cb70cb12484a4
@synapcity/server-data:test:coverage:  Test Files  6 passed (6)
@synapcity/server-data:test:coverage:       Tests  55 passed (55)
@synapcity/server-account:test:coverage: cache hit, replaying logs f2d4b608db75c694
@synapcity/server-account:test:coverage:  Test Files  6 passed (6)
@synapcity/server-account:test:coverage:       Tests  42 passed (42)
@synapcity/frontend-ui:test:coverage: cache hit, replaying logs 4d83ca21c4b970ae
@synapcity/frontend-ui:test:coverage:  Test Files  68 passed (68)
@synapcity/frontend-ui:test:coverage:       Tests  572 passed (572)
@synapcity/frontend-shells:test:coverage: cache hit, replaying logs 3a8f1800fcde2858
@synapcity/frontend-shells:test:coverage:  Test Files  19 passed (19)
@synapcity/frontend-shells:test:coverage:       Tests  129 passed (129)
@synapcity/frontend-forms:test:coverage: cache hit, replaying logs fbf49e5272371f78
@synapcity/frontend-forms:test:coverage:  Test Files  37 passed (37)
@synapcity/frontend-forms:test:coverage:       Tests  365 passed (365)
@synapcity/frontend-collection:test:coverage: cache hit, replaying logs fb038fe6258ba50e
@synapcity/frontend-collection:test:coverage:  Test Files  26 passed (26)
@synapcity/frontend-collection:test:coverage:       Tests  178 passed (178)
@synapcity/features-settings:test:coverage: cache hit, replaying logs 6783085fc1618a03
@synapcity/features-settings:test:coverage:  Test Files  40 passed (40)
@synapcity/features-settings:test:coverage:       Tests  306 passed (306)
@synapcity/features-account:test:coverage: cache hit, replaying logs eca91fd7261d0359
@synapcity/features-account:test:coverage:  Test Files  10 passed (10)
@synapcity/features-account:test:coverage:       Tests  61 passed (61)
@synapcity/features-dashboards:test:coverage: cache hit, replaying logs 24a2bc80f98b2f0f
@synapcity/features-dashboards:test:coverage:  Test Files  28 passed (28)
@synapcity/features-dashboards:test:coverage:       Tests  142 passed (142)
@synapcity/features-spaces:test:coverage: cache hit, replaying logs 4fb0c97373e251e7
@synapcity/features-spaces:test:coverage:  Test Files  11 passed (11)
@synapcity/features-spaces:test:coverage:       Tests  62 passed (62)
@synapcity/features-auth:test:coverage: cache hit, replaying logs c9153d0b88ce7dc0
@synapcity/features-auth:test:coverage:  Test Files  35 passed (35)
@synapcity/features-auth:test:coverage:       Tests  284 passed (284)
web:test:coverage: cache miss, executing 45c55eca6a65305d
web:test:coverage:  Test Files  76 passed (76)
web:test:coverage:       Tests  771 passed (771)
 Tasks:    29 successful, 29 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
web:build: cache miss, executing 427fe418ec671c9b
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:test:e2e:   26 skipped
web:test:e2e:   104 passed (27.0s)
 Tasks:    4 successful, 4 total
storybook:test:storybook:  Test Files  167 passed (167)
storybook:test:storybook:       Tests  530 passed (530)
 Tasks:    1 successful, 1 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:build: cache hit, replaying logs 427fe418ec671c9b
 Tasks:    3 successful, 3 total
EXIT 0
```

## Repository gate, an intermediate tree that failed (exit 1)

The bare owner root had been moved out of `(protected)`, which broke the "every page in a group" invariant. That change was reverted before publishing.

```text
@synapcity/dev-vitest-config:check-types: cache hit, replaying logs 0b5a34cf33856cd7
@synapcity/domain-records:lint: cache hit, replaying logs d957727c01f959e3
@synapcity/domain-preferences:lint: cache hit, replaying logs 6e6e0ece8249a221
@synapcity/frontend-site:lint: cache hit, replaying logs bf99db1ecaa33360
@synapcity/domain-identity:lint: cache hit, replaying logs 6970c1dd44e30557
@synapcity/dev-boundaries:lint: cache hit, replaying logs 4a7db348c2e81f11
@synapcity/dev-playwright-config:check-types: cache hit, replaying logs f48bc2ee22b66fce
@synapcity/domain-identity:check-types: cache hit, replaying logs 3999dfb292141fc5
@synapcity/domain-grids:lint: cache hit, replaying logs a9f5c7eb6b3c9cb0
@synapcity/frontend-tokens:check-types: cache hit, replaying logs e4f76f2b883c8e00
@synapcity/frontend-tailwind-config:check-types: cache hit, replaying logs 9a88ab80dec23b85
@synapcity/domain-records:check-types: cache hit, replaying logs 0689629d76c715ed
@synapcity/domain-grids:check-types: cache hit, replaying logs 0e0b270539f86b2b
@synapcity/frontend-supabase:check-types: cache hit, replaying logs eb7e839b3483e5c5
@synapcity/domain-preferences:check-types: cache hit, replaying logs 3f500c745e7563b3
@synapcity/frontend-supabase:lint: cache hit, replaying logs 0eef18165500224a
@synapcity/domain-spaces:lint: cache hit, replaying logs 4990eccfbadcb9f6
@synapcity/dev-boundaries:check-types: cache hit, replaying logs e791571ff4881580
@synapcity/frontend-site:check-types: cache hit, replaying logs e35e56a7548496ae
@synapcity/domain-prototypes:lint: cache hit, replaying logs 2bfeebf4093bc4e3
@synapcity/frontend-preferences:lint: cache hit, replaying logs 141de76f313d8bdf
@synapcity/server-auth:lint: cache hit, replaying logs 4472cb5288e22c8b
@synapcity/server-auth:check-types: cache hit, replaying logs 3c1a50ff6de4203a
@synapcity/domain-spaces:check-types: cache hit, replaying logs 453201803016a347
@synapcity/frontend-preferences:check-types: cache hit, replaying logs a0f94d668ae5f6db
@synapcity/domain-prototypes:check-types: cache hit, replaying logs eb5a6a00f75c269a
@synapcity/domain-dashboards:lint: cache hit, replaying logs c2f05ba25a8073a7
@synapcity/server-supabase:lint: cache hit, replaying logs 99963ea9d86ecbca
@synapcity/frontend-error-reports:lint: cache hit, replaying logs b2c7e472d5ba0d14
@synapcity/server-supabase:check-types: cache hit, replaying logs 91d0b4ee9a9d9064
@synapcity/frontend-error-reports:check-types: cache hit, replaying logs 4e23d96455bb3ef2
@synapcity/domain-dashboards:check-types: cache hit, replaying logs 225fbce028eaf562
@synapcity/server-account:lint: cache hit, replaying logs 1b15c6593cff6a98
@synapcity/frontend-ui:lint: cache hit, replaying logs 588d3a7c402a7088
@synapcity/server-data:lint: cache hit, replaying logs 3850cfd287836334
@synapcity/server-data:check-types: cache hit, replaying logs 8da5b0fba9359da2
@synapcity/server-account:check-types: cache hit, replaying logs b4c3b717a4c93121
@synapcity/dev-fixtures:check-types: cache hit, replaying logs cdff7b36d40bd6df
@synapcity/frontend-forms:lint: cache hit, replaying logs 049af856bdbd8a75
@synapcity/features-settings:lint: cache hit, replaying logs 9d2ea9f2ce0e9b5e
storybook:lint: cache hit, replaying logs 6ac1036c25c3502d
@synapcity/frontend-collection:lint: cache hit, replaying logs 6cf2e43d1f472b6a
@synapcity/frontend-shells:lint: cache hit, replaying logs ba11d9dda3da623d
@synapcity/frontend-ui:check-types: cache hit, replaying logs 491d287f30812973
@synapcity/features-account:lint: cache hit, replaying logs b3aecdc15df6d6c9
@synapcity/features-dashboards:lint: cache hit, replaying logs f423e1ec326d458a
@synapcity/features-spaces:lint: cache hit, replaying logs abee3fbb0382f53d
docs:lint: cache hit, replaying logs 66d3205683c09dee
@synapcity/frontend-forms:check-types: cache hit, replaying logs 832e15ed4049f88b
@synapcity/frontend-collection:check-types: cache hit, replaying logs ce8671fce1a456f5
storybook:check-types: cache hit, replaying logs 555891f9d3ab592d
@synapcity/frontend-shells:check-types: cache hit, replaying logs bcaa377d35d04f98
@synapcity/features-auth:lint: cache hit, replaying logs fb80a106f4d60b93
@synapcity/features-settings:check-types: cache hit, replaying logs 4b530cab85ab1271
@synapcity/features-account:check-types: cache hit, replaying logs 286af296bcb1c6bd
@synapcity/features-dashboards:check-types: cache hit, replaying logs 02619b298bb5a96a
@synapcity/features-spaces:check-types: cache hit, replaying logs c32b7b162014546c
docs:check-types: cache hit, replaying logs 663a6fee9024fc77
web:lint: cache hit, replaying logs dfef4f66cca0d986
@synapcity/features-auth:check-types: cache hit, replaying logs 65e0b027450cecb1
web:check-types: cache hit, replaying logs 1bfae3cb5e144d03
 Tasks:    61 successful, 61 total
@synapcity/frontend-tokens:test:coverage: cache hit, replaying logs 6ecee1eedbe7fb94
@synapcity/frontend-tokens:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tokens:test:coverage:       Tests  5 passed (5)
@synapcity/frontend-site:test:coverage: cache hit, replaying logs 747951ba144052ed
@synapcity/frontend-site:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-site:test:coverage:       Tests  11 passed (11)
@synapcity/frontend-supabase:test:coverage: cache hit, replaying logs 835b2474eb7b0e47
@synapcity/frontend-supabase:test:coverage:  Test Files  2 passed (2)
@synapcity/frontend-supabase:test:coverage:       Tests  8 passed (8)
@synapcity/domain-preferences:test:coverage: cache hit, replaying logs 668278456a991481
@synapcity/domain-preferences:test:coverage:  Test Files  13 passed (13)
@synapcity/domain-preferences:test:coverage:       Tests  147 passed (147)
@synapcity/domain-identity:test:coverage: cache hit, replaying logs 88c40f182a6fc84a
@synapcity/domain-identity:test:coverage:  Test Files  14 passed (14)
@synapcity/domain-identity:test:coverage:       Tests  139 passed (139)
@synapcity/domain-records:test:coverage: cache hit, replaying logs 8472342c03f53e6c
@synapcity/domain-records:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-records:test:coverage:       Tests  8 passed (8)
@synapcity/domain-grids:test:coverage: cache hit, replaying logs 889d8a3c2319a7b4
@synapcity/domain-grids:test:coverage:  Test Files  5 passed (5)
@synapcity/domain-grids:test:coverage:       Tests  19 passed (19)
@synapcity/frontend-tailwind-config:test:coverage: cache hit, replaying logs e7119c009591b99b
@synapcity/frontend-tailwind-config:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tailwind-config:test:coverage:       Tests  22 passed (22)
@synapcity/dev-boundaries:test:coverage: cache hit, replaying logs f626d60d04882da3
@synapcity/dev-boundaries:test:coverage:  Test Files  13 passed (13)
@synapcity/dev-boundaries:test:coverage:       Tests  149 passed (149)
@synapcity/frontend-preferences:test:coverage: cache hit, replaying logs 91d601d8f27310a4
@synapcity/frontend-preferences:test:coverage:  Test Files  18 passed (18)
@synapcity/frontend-preferences:test:coverage:       Tests  168 passed (168)
@synapcity/server-auth:test:coverage: cache hit, replaying logs e3cc26f526bd392c
@synapcity/server-auth:test:coverage:  Test Files  4 passed (4)
@synapcity/server-auth:test:coverage:       Tests  20 passed (20)
@synapcity/domain-prototypes:test:coverage: cache hit, replaying logs 23a9fd681aa8f6a6
@synapcity/domain-prototypes:test:coverage:  Test Files  18 passed (18)
@synapcity/domain-prototypes:test:coverage:       Tests  66 passed (66)
@synapcity/domain-spaces:test:coverage: cache hit, replaying logs adc25e11b41cbf94
@synapcity/domain-spaces:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-spaces:test:coverage:       Tests  57 passed (57)
@synapcity/frontend-error-reports:test:coverage: cache hit, replaying logs b299ce8c25873f33
@synapcity/frontend-error-reports:test:coverage:  Test Files  3 passed (3)
@synapcity/frontend-error-reports:test:coverage:       Tests  21 passed (21)
@synapcity/server-supabase:test:coverage: cache hit, replaying logs ebde3f814efbf220
@synapcity/server-supabase:test:coverage:  Test Files  9 passed (9)
@synapcity/server-supabase:test:coverage:       Tests  88 passed (88)
@synapcity/domain-dashboards:test:coverage: cache hit, replaying logs 8ce99f67adae67d4
@synapcity/domain-dashboards:test:coverage:  Test Files  4 passed (4)
@synapcity/domain-dashboards:test:coverage:       Tests  30 passed (30)
@synapcity/server-data:test:coverage: cache hit, replaying logs ed2cb70cb12484a4
@synapcity/server-data:test:coverage:  Test Files  6 passed (6)
@synapcity/server-data:test:coverage:       Tests  55 passed (55)
@synapcity/server-account:test:coverage: cache hit, replaying logs f2d4b608db75c694
@synapcity/server-account:test:coverage:  Test Files  6 passed (6)
@synapcity/server-account:test:coverage:       Tests  42 passed (42)
@synapcity/dev-fixtures:test:coverage: cache hit, replaying logs b23217ae88decee2
@synapcity/dev-fixtures:test:coverage:  Test Files  4 passed (4)
@synapcity/dev-fixtures:test:coverage:       Tests  25 passed (25)
@synapcity/frontend-ui:test:coverage: cache hit, replaying logs 4d83ca21c4b970ae
@synapcity/frontend-ui:test:coverage:  Test Files  68 passed (68)
@synapcity/frontend-ui:test:coverage:       Tests  572 passed (572)
@synapcity/frontend-shells:test:coverage: cache hit, replaying logs 3a8f1800fcde2858
@synapcity/frontend-shells:test:coverage:  Test Files  19 passed (19)
@synapcity/frontend-shells:test:coverage:       Tests  129 passed (129)
@synapcity/frontend-forms:test:coverage: cache hit, replaying logs fbf49e5272371f78
@synapcity/frontend-forms:test:coverage:  Test Files  37 passed (37)
@synapcity/frontend-forms:test:coverage:       Tests  365 passed (365)
@synapcity/features-settings:test:coverage: cache hit, replaying logs 6783085fc1618a03
@synapcity/features-settings:test:coverage:  Test Files  40 passed (40)
@synapcity/features-settings:test:coverage:       Tests  306 passed (306)
@synapcity/frontend-collection:test:coverage: cache hit, replaying logs fb038fe6258ba50e
@synapcity/frontend-collection:test:coverage:  Test Files  26 passed (26)
@synapcity/frontend-collection:test:coverage:       Tests  178 passed (178)
@synapcity/features-account:test:coverage: cache hit, replaying logs eca91fd7261d0359
@synapcity/features-account:test:coverage:  Test Files  10 passed (10)
@synapcity/features-account:test:coverage:       Tests  61 passed (61)
@synapcity/features-dashboards:test:coverage: cache hit, replaying logs 24a2bc80f98b2f0f
@synapcity/features-dashboards:test:coverage:  Test Files  28 passed (28)
@synapcity/features-dashboards:test:coverage:       Tests  142 passed (142)
@synapcity/features-spaces:test:coverage: cache hit, replaying logs 4fb0c97373e251e7
@synapcity/features-spaces:test:coverage:  Test Files  11 passed (11)
@synapcity/features-spaces:test:coverage:       Tests  62 passed (62)
@synapcity/features-auth:test:coverage: cache hit, replaying logs c9153d0b88ce7dc0
@synapcity/features-auth:test:coverage:  Test Files  35 passed (35)
@synapcity/features-auth:test:coverage:       Tests  284 passed (284)
web:test:coverage: cache hit, replaying logs 8475e5acd8556e96
web:test:coverage:  Test Files  76 passed (76)
web:test:coverage:       Tests  765 passed (765)
 Tasks:    29 successful, 29 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:build: cache hit, replaying logs d6e14491f8d16a3b
web:test:e2e:   26 skipped
web:test:e2e:   104 passed (1.1m)
 Tasks:    4 successful, 4 total
storybook:test:storybook:  Test Files  167 passed (167)
storybook:test:storybook:       Tests  530 passed (530)
 Tasks:    1 successful, 1 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:build: cache hit, replaying logs d6e14491f8d16a3b
 Tasks:    3 successful, 3 total
EXIT 0
```

## Repository gate, tree before the return-path fix (exit 0)

```text
@synapcity/dev-vitest-config:check-types: cache hit, replaying logs 0b5a34cf33856cd7
@synapcity/dev-playwright-config:check-types: cache hit, replaying logs f48bc2ee22b66fce
@synapcity/frontend-site:lint: cache hit, replaying logs bf99db1ecaa33360
@synapcity/domain-grids:lint: cache hit, replaying logs a9f5c7eb6b3c9cb0
@synapcity/frontend-supabase:lint: cache hit, replaying logs 0eef18165500224a
@synapcity/domain-records:lint: cache hit, replaying logs d957727c01f959e3
@synapcity/dev-boundaries:lint: cache hit, replaying logs 4a7db348c2e81f11
@synapcity/domain-preferences:lint: cache hit, replaying logs 6e6e0ece8249a221
@synapcity/domain-identity:lint: cache hit, replaying logs 6970c1dd44e30557
@synapcity/domain-grids:check-types: cache hit, replaying logs 0e0b270539f86b2b
@synapcity/frontend-tailwind-config:check-types: cache hit, replaying logs 9a88ab80dec23b85
@synapcity/dev-boundaries:check-types: cache hit, replaying logs e791571ff4881580
@synapcity/domain-preferences:check-types: cache hit, replaying logs 3f500c745e7563b3
@synapcity/frontend-tokens:check-types: cache hit, replaying logs e4f76f2b883c8e00
@synapcity/frontend-site:check-types: cache hit, replaying logs e35e56a7548496ae
@synapcity/domain-identity:check-types: cache hit, replaying logs 3999dfb292141fc5
@synapcity/frontend-supabase:check-types: cache hit, replaying logs eb7e839b3483e5c5
@synapcity/domain-records:check-types: cache hit, replaying logs 0689629d76c715ed
@synapcity/frontend-preferences:lint: cache hit, replaying logs 141de76f313d8bdf
@synapcity/domain-spaces:lint: cache hit, replaying logs 4990eccfbadcb9f6
@synapcity/domain-prototypes:lint: cache hit, replaying logs 2bfeebf4093bc4e3
@synapcity/server-auth:lint: cache hit, replaying logs 4472cb5288e22c8b
@synapcity/frontend-preferences:check-types: cache hit, replaying logs a0f94d668ae5f6db
@synapcity/domain-prototypes:check-types: cache hit, replaying logs eb5a6a00f75c269a
@synapcity/server-auth:check-types: cache hit, replaying logs 3c1a50ff6de4203a
@synapcity/frontend-error-reports:lint: cache hit, replaying logs b2c7e472d5ba0d14
@synapcity/domain-spaces:check-types: cache hit, replaying logs 453201803016a347
@synapcity/domain-dashboards:lint: cache hit, replaying logs c2f05ba25a8073a7
@synapcity/frontend-error-reports:check-types: cache hit, replaying logs 4e23d96455bb3ef2
@synapcity/server-supabase:lint: cache hit, replaying logs 99963ea9d86ecbca
@synapcity/server-supabase:check-types: cache hit, replaying logs 91d0b4ee9a9d9064
@synapcity/domain-dashboards:check-types: cache hit, replaying logs 225fbce028eaf562
@synapcity/server-data:check-types: cache hit, replaying logs 8da5b0fba9359da2
@synapcity/server-account:lint: cache hit, replaying logs 1b15c6593cff6a98
@synapcity/server-data:lint: cache hit, replaying logs 3850cfd287836334
@synapcity/server-account:check-types: cache hit, replaying logs b4c3b717a4c93121
@synapcity/frontend-ui:lint: cache hit, replaying logs 588d3a7c402a7088
@synapcity/dev-fixtures:check-types: cache hit, replaying logs cdff7b36d40bd6df
@synapcity/frontend-forms:lint: cache hit, replaying logs 049af856bdbd8a75
storybook:lint: cache hit, replaying logs 6ac1036c25c3502d
@synapcity/frontend-shells:lint: cache hit, replaying logs ba11d9dda3da623d
@synapcity/frontend-ui:check-types: cache hit, replaying logs 491d287f30812973
@synapcity/frontend-collection:lint: cache hit, replaying logs 6cf2e43d1f472b6a
@synapcity/features-settings:lint: cache hit, replaying logs 9d2ea9f2ce0e9b5e
@synapcity/frontend-forms:check-types: cache hit, replaying logs 832e15ed4049f88b
@synapcity/frontend-shells:check-types: cache hit, replaying logs bcaa377d35d04f98
@synapcity/features-settings:check-types: cache hit, replaying logs 4b530cab85ab1271
@synapcity/features-account:lint: cache hit, replaying logs b3aecdc15df6d6c9
@synapcity/features-dashboards:lint: cache hit, replaying logs f423e1ec326d458a
docs:lint: cache hit, replaying logs 66d3205683c09dee
storybook:check-types: cache hit, replaying logs 555891f9d3ab592d
@synapcity/features-spaces:lint: cache hit, replaying logs abee3fbb0382f53d
@synapcity/frontend-collection:check-types: cache hit, replaying logs ce8671fce1a456f5
@synapcity/features-account:check-types: cache hit, replaying logs 286af296bcb1c6bd
@synapcity/features-dashboards:check-types: cache hit, replaying logs 02619b298bb5a96a
@synapcity/features-spaces:check-types: cache hit, replaying logs c32b7b162014546c
docs:check-types: cache hit, replaying logs 663a6fee9024fc77
@synapcity/features-auth:lint: cache hit, replaying logs fb80a106f4d60b93
@synapcity/features-auth:check-types: cache hit, replaying logs 65e0b027450cecb1
web:lint: cache miss, executing 2b757217a681f988
web:check-types: cache miss, executing 9997a40145759d87
 Tasks:    61 successful, 61 total
@synapcity/frontend-supabase:test:coverage: cache hit, replaying logs 835b2474eb7b0e47
@synapcity/frontend-supabase:test:coverage:  Test Files  2 passed (2)
@synapcity/frontend-supabase:test:coverage:       Tests  8 passed (8)
@synapcity/dev-boundaries:test:coverage: cache hit, replaying logs f626d60d04882da3
@synapcity/dev-boundaries:test:coverage:  Test Files  13 passed (13)
@synapcity/dev-boundaries:test:coverage:       Tests  149 passed (149)
@synapcity/domain-identity:test:coverage: cache hit, replaying logs 88c40f182a6fc84a
@synapcity/domain-identity:test:coverage:  Test Files  14 passed (14)
@synapcity/domain-identity:test:coverage:       Tests  139 passed (139)
@synapcity/frontend-tokens:test:coverage: cache hit, replaying logs 6ecee1eedbe7fb94
@synapcity/frontend-tokens:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tokens:test:coverage:       Tests  5 passed (5)
@synapcity/domain-records:test:coverage: cache hit, replaying logs 8472342c03f53e6c
@synapcity/domain-records:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-records:test:coverage:       Tests  8 passed (8)
@synapcity/domain-preferences:test:coverage: cache hit, replaying logs 668278456a991481
@synapcity/domain-preferences:test:coverage:  Test Files  13 passed (13)
@synapcity/domain-preferences:test:coverage:       Tests  147 passed (147)
@synapcity/frontend-site:test:coverage: cache hit, replaying logs 747951ba144052ed
@synapcity/frontend-site:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-site:test:coverage:       Tests  11 passed (11)
@synapcity/domain-grids:test:coverage: cache hit, replaying logs 889d8a3c2319a7b4
@synapcity/domain-grids:test:coverage:  Test Files  5 passed (5)
@synapcity/domain-grids:test:coverage:       Tests  19 passed (19)
@synapcity/frontend-tailwind-config:test:coverage: cache hit, replaying logs e7119c009591b99b
@synapcity/frontend-tailwind-config:test:coverage:  Test Files  1 passed (1)
@synapcity/frontend-tailwind-config:test:coverage:       Tests  22 passed (22)
@synapcity/server-auth:test:coverage: cache hit, replaying logs e3cc26f526bd392c
@synapcity/server-auth:test:coverage:  Test Files  4 passed (4)
@synapcity/server-auth:test:coverage:       Tests  20 passed (20)
@synapcity/domain-prototypes:test:coverage: cache hit, replaying logs 23a9fd681aa8f6a6
@synapcity/domain-prototypes:test:coverage:  Test Files  18 passed (18)
@synapcity/domain-prototypes:test:coverage:       Tests  66 passed (66)
@synapcity/domain-spaces:test:coverage: cache hit, replaying logs adc25e11b41cbf94
@synapcity/domain-spaces:test:coverage:  Test Files  1 passed (1)
@synapcity/domain-spaces:test:coverage:       Tests  57 passed (57)
@synapcity/frontend-preferences:test:coverage: cache hit, replaying logs 91d601d8f27310a4
@synapcity/frontend-preferences:test:coverage:  Test Files  18 passed (18)
@synapcity/frontend-preferences:test:coverage:       Tests  168 passed (168)
@synapcity/server-supabase:test:coverage: cache hit, replaying logs ebde3f814efbf220
@synapcity/server-supabase:test:coverage:  Test Files  9 passed (9)
@synapcity/server-supabase:test:coverage:       Tests  88 passed (88)
@synapcity/domain-dashboards:test:coverage: cache hit, replaying logs 8ce99f67adae67d4
@synapcity/domain-dashboards:test:coverage:  Test Files  4 passed (4)
@synapcity/domain-dashboards:test:coverage:       Tests  30 passed (30)
@synapcity/frontend-error-reports:test:coverage: cache hit, replaying logs b299ce8c25873f33
@synapcity/frontend-error-reports:test:coverage:  Test Files  3 passed (3)
@synapcity/frontend-error-reports:test:coverage:       Tests  21 passed (21)
@synapcity/server-data:test:coverage: cache hit, replaying logs ed2cb70cb12484a4
@synapcity/server-data:test:coverage:  Test Files  6 passed (6)
@synapcity/server-data:test:coverage:       Tests  55 passed (55)
@synapcity/server-account:test:coverage: cache hit, replaying logs f2d4b608db75c694
@synapcity/server-account:test:coverage:  Test Files  6 passed (6)
@synapcity/server-account:test:coverage:       Tests  42 passed (42)
@synapcity/dev-fixtures:test:coverage: cache hit, replaying logs b23217ae88decee2
@synapcity/dev-fixtures:test:coverage:  Test Files  4 passed (4)
@synapcity/dev-fixtures:test:coverage:       Tests  25 passed (25)
@synapcity/frontend-ui:test:coverage: cache hit, replaying logs 4d83ca21c4b970ae
@synapcity/frontend-ui:test:coverage:  Test Files  68 passed (68)
@synapcity/frontend-ui:test:coverage:       Tests  572 passed (572)
@synapcity/frontend-shells:test:coverage: cache hit, replaying logs 3a8f1800fcde2858
@synapcity/frontend-shells:test:coverage:  Test Files  19 passed (19)
@synapcity/frontend-shells:test:coverage:       Tests  129 passed (129)
@synapcity/frontend-forms:test:coverage: cache hit, replaying logs fbf49e5272371f78
@synapcity/frontend-forms:test:coverage:  Test Files  37 passed (37)
@synapcity/frontend-forms:test:coverage:       Tests  365 passed (365)
@synapcity/frontend-collection:test:coverage: cache hit, replaying logs fb038fe6258ba50e
@synapcity/frontend-collection:test:coverage:  Test Files  26 passed (26)
@synapcity/frontend-collection:test:coverage:       Tests  178 passed (178)
@synapcity/features-settings:test:coverage: cache hit, replaying logs 6783085fc1618a03
@synapcity/features-settings:test:coverage:  Test Files  40 passed (40)
@synapcity/features-settings:test:coverage:       Tests  306 passed (306)
@synapcity/features-account:test:coverage: cache hit, replaying logs eca91fd7261d0359
@synapcity/features-account:test:coverage:  Test Files  10 passed (10)
@synapcity/features-account:test:coverage:       Tests  61 passed (61)
@synapcity/features-dashboards:test:coverage: cache hit, replaying logs 24a2bc80f98b2f0f
@synapcity/features-dashboards:test:coverage:  Test Files  28 passed (28)
@synapcity/features-dashboards:test:coverage:       Tests  142 passed (142)
@synapcity/features-spaces:test:coverage: cache hit, replaying logs 4fb0c97373e251e7
@synapcity/features-spaces:test:coverage:  Test Files  11 passed (11)
@synapcity/features-spaces:test:coverage:       Tests  62 passed (62)
@synapcity/features-auth:test:coverage: cache hit, replaying logs c9153d0b88ce7dc0
@synapcity/features-auth:test:coverage:  Test Files  35 passed (35)
@synapcity/features-auth:test:coverage:       Tests  284 passed (284)
web:test:coverage: cache miss, executing 41ae7849420baf5f
web:test:coverage:  Test Files  76 passed (76)
web:test:coverage:       Tests  757 passed (757)
 Tasks:    29 successful, 29 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
web:build: cache miss, executing 2553b66a86c5235b
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:test:e2e:   26 skipped
web:test:e2e:   104 passed (36.5s)
 Tasks:    4 successful, 4 total
storybook:test:storybook:  Test Files  167 passed (167)
storybook:test:storybook:       Tests  530 passed (530)
 Tasks:    1 successful, 1 total
@synapcity/frontend-ui:build: cache hit, replaying logs 171c35a3482294aa
docs:build: cache hit, replaying logs dc404afdf72d44f5
web:build: cache hit, replaying logs 2553b66a86c5235b
 Tasks:    3 successful, 3 total
EXIT 0
```

## Local-session suite (`pnpm test:e2e:local-session`), last of three consecutive passing runs against the local Supabase stack, server built and started from this worktree

```text
$ node e2e/run-local-session.mjs
Running 17 tests using 1 worker
  ✓   1 [chromium] › e2e/local-session.e2e.ts:68:1 › signing in reaches the workspace shell through the real app and stack (1.2s)
  ✓   2 [chromium] › e2e/local-session.e2e.ts:82:3 › / is public for a signed-in visitor: public shell and account menu (1.2s)
  ✓   3 [chromium] › e2e/local-session.e2e.ts:82:3 › /privacy is public for a signed-in visitor: public shell and account menu (1.2s)
  ✓   4 [chromium] › e2e/local-session.e2e.ts:99:1 › the landing page leads back into the workspace (1.3s)
  ✓   5 [chromium] › e2e/local-session.e2e.ts:109:1 › the account menu works from the keyboard and returns focus (1.8s)
  ✓   6 [chromium] › e2e/local-session.e2e.ts:131:1 › the chosen theme follows the person between the public and workspace shells (1.8s)
  ✓   7 [chromium] › e2e/local-session.e2e.ts:147:1 › guest-facing auth pages send a signed-in visitor on, as before (1.5s)
  ✓   8 [chromium] › e2e/local-session.e2e.ts:165:3 › /auth/forgot-password renders for a signed-in visitor in one public shell (1.2s)
  ✓   9 [chromium] › e2e/local-session.e2e.ts:165:3 › /auth/update-password renders for a signed-in visitor in one public shell (1.1s)
  ✓  10 [chromium] › e2e/local-session.e2e.ts:165:3 › /auth/delete-account renders for a signed-in visitor in one public shell (1.2s)
  ✓  11 [chromium] › e2e/local-session.e2e.ts:165:3 › /auth/error renders for a signed-in visitor in one public shell (1.2s)
  ✓  12 [chromium] › e2e/local-session.e2e.ts:165:3 › /auth/welcome renders for a signed-in visitor in one public shell (1.2s)
  ✓  13 [chromium] › e2e/local-session.e2e.ts:185:1 › unknown addresses end in one shell each: workspace inside the owner area, public elsewhere (3.2s)
  ✓  14 [chromium] › e2e/local-session.e2e.ts:223:1 › effective metadata of a protected page keeps the site title and share image (1.8s)
  ✓  15 [chromium] › e2e/local-session.e2e.ts:240:1 › signing out returns to a public page, drops the session and protects the workspace again (1.6s)
  ✓  16 [chromium] › e2e/local-session.e2e.ts:325:3 › the callback exchanges a real code › signs the person in, sets the session cookie and lands on the reset page (1.3s)
  ✓  17 [chromium] › e2e/local-session.e2e.ts:371:3 › the callback exchanges a real code › ignores an unsafe destination and sends the person to their own home (990ms)
  17 passed (27.7s)
```
