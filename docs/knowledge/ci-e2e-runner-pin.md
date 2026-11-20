# CI's E2E job runs on a pinned Ubuntu, moved together with Playwright

_Since 2026-11-20 the `e2e-tests` job in `.github/workflows/ci.yml` runs on `ubuntu-26.04` instead of `ubuntu-latest`, with `@playwright/test` and `playwright` at 1.65.1. Lint, unit tests and the build stay on `ubuntu-latest`; they do not depend on the OS release._

**Symptom.** From 2026-11-05 every push to `main` failed CI (11 runs in a row, the Vercel deploy was unaffected) at "Install Playwright browsers" with `Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.58.2!` and `ERROR: Playwright does not support chromium on ubuntu26.04-x64`. GitHub had moved `ubuntu-latest` to the `ubuntu-26.04` image (release `ubuntu26/20261101.186`). Playwright keeps a list of the Ubuntu releases it can install browsers and system packages for, and 1.58.2 predates 26.04; 1.65.1 lists it.

**The rule.** The runner label and the Playwright version change in the same commit. Before moving `runs-on` to a newer Ubuntu, check that the Playwright in `package-lock.json` supports it (search `node_modules/playwright-core/lib` for `ubuntu<version>`), upgrade Playwright if not, and run `npx playwright install chromium && npm run test:e2e -- --project=chromium` locally. Do not go back to `ubuntu-latest`: the next image switch would turn CI red again without any change in the repo.

**Cache.** The browser cache key is `runner.os` plus the lockfile hash, so a Playwright upgrade misses the cache and installs fresh browsers and system packages. A runner change alone does not; change the lockfile with it as the rule says, or the job reuses browsers without `--with-deps`.

Source: CI runs 42054113881 (first failure, 2026-11-05) to 44741778184 (2026-11-20); local `npx playwright test --project=chromium` on 2026-11-20, 118 passed with 1.58.2 and 118 passed with 1.65.1 (Chromium 159, revision 1255).
