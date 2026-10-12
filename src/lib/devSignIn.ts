/**
 * Dev builds only: the test account (`dev@plateful.test`, the iOS repo's
 * `DevConfig.swift`) from `.env.local` as `VITE_DEV_EMAIL` and
 * `VITE_DEV_PASSWORD`, so an agent or a developer can sign in without a
 * mailbox. `import.meta.env.DEV` is false in a production build, which makes
 * this null there whatever the environment holds, and `.env.local` is
 * git-ignored and never deployed.
 */
export const devAccount =
  import.meta.env.DEV && import.meta.env.VITE_DEV_EMAIL && import.meta.env.VITE_DEV_PASSWORD
    ? {
        email: String(import.meta.env.VITE_DEV_EMAIL),
        password: String(import.meta.env.VITE_DEV_PASSWORD),
      }
    : null;
