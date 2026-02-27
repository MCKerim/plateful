# Legal Review — Privacy Policy & Terms of Service

**Date:** 2026-02-22
**Reviewed against:** Actual codebase data practices
**Jurisdiction:** Germany (GDPR applies as primary framework)

---

## Open Issues (Require Code Changes)

### 1. Recipe extraction service uses unencrypted HTTP

- **File:** API calls to `http://91.99.166.5:3000` (recipe-from-url, recipe-from-image)
- **Problem:** User data (recipe URLs, food images, language preference) is transmitted over plain HTTP — no TLS/encryption in transit
- **Risk:** Man-in-the-middle attacks, data interception, violates GDPR Art. 32 (security of processing)
- **Fix:** Migrate the service to HTTPS with a valid certificate. Also consider using a domain name instead of a bare IP.

### 3. No in-app account deletion mechanism

- **Problem:** ToS now correctly says to use Settings > Delete Account, but that feature doesn't exist in the app yet
- **Apple requirement:** Since June 2022, Apple requires all apps with account creation to offer in-app account deletion
- **Google requirement:** Similar policy since December 2023
- **Fix:** Build an in-app "Delete Account" flow in Settings. Simply uninstalling the app does NOT delete the account or data.

---

## Additional Items (Resolved)

| #   | Area       | Issue                                              | Resolution |
| --- | ---------- | -------------------------------------------------- | ---------- |
| A1  | Legal      | No Impressum (§ 5 TMG)                             | ✅ Created `src/page/Impressum.tsx`, route `/imprint`, linked from Settings |
| A2  | Privacy    | Google Gemini undisclosed (used in recipe extraction server) | ✅ Disclosed in "AI-Powered Features" and "Third-Party Services" sections of PP |
| A3  | Privacy    | Controller name missing (KBlanks)                  | ✅ Full legal name and address added to PP introduction, contact, and ToS |
| A4  | Privacy    | Automated decision-making not addressed (GDPR Art. 22) | ✅ "Automated Decision-Making" section added to PP |

---

## Resolved Issues (from original review)

| #   | Priority     | Area       | Issue                                                 | Resolution |
| --- | ------------ | ---------- | ----------------------------------------------------- | ---------- |
| 1   | **CRITICAL** | Security   | HTTP recipe extraction (no TLS)                       | ❌ Open — needs code |
| 2   | **CRITICAL** | Privacy    | OpenAI training opt-out unconfirmed                   | ✅ Confirmed OFF in OpenAI settings |
| 3   | **CRITICAL** | Compliance | No in-app account deletion (Apple/Google requirement) | ❌ Open — needs code |
| 4   | **CRITICAL** | Compliance | Data export claimed but doesn't exist                 | ✅ PP now documents manual email export process (GDPR Art. 20) |
| 5   | **HIGH**     | Privacy    | Third-party services not named                        | ✅ "Third-Party Services" section added to PP (incl. Google Gemini via recipe extraction server) |
| 6   | **HIGH**     | Privacy    | AI/chatbot processing undisclosed                     | ✅ "AI-Powered Features" section added to PP |
| 7   | **HIGH**     | Privacy    | Camera/photo access not mentioned                     | ✅ "Camera and Photos" added to PP |
| 8   | **MEDIUM**   | Privacy    | Survey data not mentioned                             | ✅ "Onboarding Survey" added to PP |
| 9   | **MEDIUM**   | Privacy    | Household data sharing not explained                  | ✅ Household sharing subsection added to PP |
| 10  | **HIGH**     | Privacy    | No data retention policy                              | ✅ "Data Retention" section added to PP |
| 11  | **HIGH**     | Privacy    | No legal basis for processing (GDPR)                  | ✅ "Legal Basis for Processing" section added to PP |
| 12  | **HIGH**     | Privacy    | Data transfers outside EU vague                       | ✅ Supabase/PostHog noted as EU; OpenAI noted as US with SCCs |
| 13  | **LOW**      | Privacy    | Shopping lists don't exist                            | ✅ Removed from PP |
| 14  | **LOW**      | Privacy    | Recipe recommendations don't exist                    | ✅ Removed; replaced with AI chatbot use |
| 15  | **LOW**      | Privacy    | Cookies section misleading                            | ✅ Replaced with "Local Storage and Analytics" |
| 16  | **MEDIUM**   | Privacy    | US-centric framing (should be Germany)                | ✅ Rewritten as "Users Outside the EU" with Germany-first framing |
| 17  | **LOW**      | Privacy    | Notification types unspecified                        | ✅ Email + push specified in PP |
| 18  | **HIGH**     | ToS        | No subscription/payment terms                         | ✅ "Subscriptions and Payments" section added to ToS |
| 19  | **HIGH**     | ToS        | No AI content disclaimer                              | ✅ "AI-Generated Content" section added to ToS |
| 20  | **HIGH**     | ToS        | Age should be 16, not 13 (Germany)                    | ✅ Updated to 16 in both PP and ToS |
| 21  | **MEDIUM**   | ToS        | Governing law unspecified                             | ✅ Updated to "Federal Republic of Germany" |
| 22  | **HIGH**     | ToS        | Arbitration unenforceable in EU                       | ✅ Replaced with EU-compliant dispute resolution + ODR link |
| 23  | **MEDIUM**   | ToS        | Recipe import copyright unclear                       | ✅ Import copyright clause added to Acceptable Use in ToS |
| 24  | **MEDIUM**   | ToS        | No household terms                                    | ✅ "Household Accounts" section added to ToS |
| 25  | **LOW**      | ToS        | No third-party dependency disclaimer                  | ✅ Disclaimer added to Disclaimers section in ToS |
| 26  | **MEDIUM**   | ToS        | "Delete the app" ≠ delete account                     | ✅ Fixed in ToS; in-app deletion still needs code (#3) |
