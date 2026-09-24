# RevenueCat webhook: a sandbox event never touches a production row

_Since 2026-09-24 `setUserSubscription` and `setAutoRenewOff` skip any event with `environment == "SANDBOX"` whose target row carries `environment == "PRODUCTION"`; sandbox rows of test accounts are still written, so device and simulator tests keep their webhook leg_

**What happened (2026-09-24, all UTC):** 02:34 `RENEWAL` (PRODUCTION) for Kerim's
own account `22ea48e1-…`, his trial converting to the paid year; row active.
09:19 `TRANSFER from=22ea48e1-… to=8951453e-…`, environment SANDBOX: the iOS
device test of the native paywall bought in the sandbox under a fresh app
account, through the phone's sandbox Apple ID, which earlier sandbox runs had
used while signed in as Kerim. RevenueCat moved that *sandbox* subscription to
the new customer and the TRANSFER-from branch upserted Kerim's row with
`is_active = false`, `auto_renews = false`, `expires_at = null`,
`environment = SANDBOX`. `household_entitlements` had no row for his
household from then on: the web app and his partner were paywalled, the iOS
app stayed open only through the payer override (RevenueCat's own
entitlement). His real subscription at Apple and RevenueCat was never touched.

**The rule** (`isSandboxAgainstProduction` in
`supabase/functions/revenuecat-webhook/index.ts`): the `last_event_at` read
now also selects `environment`; a SANDBOX event against a PRODUCTION row is
logged (`skipping SANDBOX event for PRODUCTION row user=…`) and dropped. A
production event still overwrites a sandbox row (a tester who then really
buys). Everything else is unchanged: TRANSFER-to, INITIAL_PURCHASE and the
StoreKit-config renewals of the simulator still write rows for test accounts,
which is what the end-to-end checks in the iOS repo rely on.

**Why not drop SANDBOX entirely:** it would also drop the webhook leg of every
sandbox test (the iOS repo's `docs/knowledge/revenuecat-ios.md` documents the
row landing 46 s after a StoreKit-config purchase). The narrow rule protects
paying users and keeps that. What it does not prevent: a TestFlight tester
unlocking their own real household with a free sandbox purchase, which was the
original "launch checklist" worry there; accepted, testers are comped anyway.

**Testing rules that follow** (RevenueCat's own advice, now enforced by
experience): one sandbox tester Apple ID per test app account (create it in
App Store Connect, set it under Settings → App Store → Sandbox Account before
the run), so RevenueCat sees a new store account with no previous owner and
sends INITIAL_PURCHASE, not TRANSFER; and never tap "Restore" while signed
into a test account on a phone whose App Store Apple ID holds a real
subscription, because a *production* TRANSFER is correct behaviour and would
move the real purchase.

**Repair of 2026-09-24:** Kerim's row was reset by hand to the state the 02:34
RENEWAL had written (`is_active/auto_renews true`, `APP_STORE`, `PRODUCTION`,
`expires_at 2027-09-24T10:32:59Z`, `last_event_at 2026-09-24T02:34:22Z`);
`household_entitlements` showed the household again immediately. The test
account's row went with the account's deletion.

**Deploy:** through the Supabase MCP `deploy_edge_function` with
`functions/revenuecat-webhook/index.ts` and `functions/_shared/headers.ts`,
`verify_jwt: false` (RevenueCat authenticates with the shared secret, not a
JWT). Deployed as **version 18 on 2026-09-24** after Kerim's explicit go in
the session (the auto-mode classifier blocks production deploys without it).
