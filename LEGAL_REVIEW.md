# Legal Review — Privacy Policy & Terms of Service

**Date:** 2026-02-22
**Reviewed against:** Actual codebase data practices
**Jurisdiction:** Germany (GDPR applies as primary framework)

---

## Critical Issues (Fix Before Anything Else)

### 1. Recipe extraction service uses unencrypted HTTP

- **File:** API calls to `http://91.99.166.5:3000` (recipe-from-url, recipe-from-image)
- **Problem:** User data (recipe URLs, food images, language preference) is transmitted over plain HTTP — no TLS/encryption in transit
- **Risk:** Man-in-the-middle attacks, data interception, violates GDPR Art. 32 (security of processing)
- **Fix:** Migrate the service to HTTPS with a valid certificate. Also consider using a domain name instead of a bare IP.

### 2. OpenAI may be training on your users' data

- **Problem:** You haven't confirmed opting out of OpenAI's data training. By default, API usage data is **not** used for training (as of March 2023 for API), but this depends on your API plan and terms.
- **Action:** Log into your OpenAI account → Settings → Data Controls → Verify "Improve our models" is OFF. Review [OpenAI's API data usage policy](https://openai.com/policies/api-data-usage-policies).
- **If you can't opt out:** You must disclose this in the privacy policy — users need to know their chat data and images could be used to train AI models.

### 3. No in-app account deletion mechanism

- **Problem:** ToS says users can delete their account by "contacting support" or "deleting the App"
- **Apple requirement:** Since June 2022, Apple requires all apps with account creation to offer in-app account deletion
- **Google requirement:** Similar policy since December 2023
- **Fix:** Build an in-app "Delete Account" flow in Settings. Simply uninstalling the app does NOT delete the account or data.

### 4. Right to data export is claimed but doesn't exist

- **Problem:** Privacy policy lists "Export your data" as a user right, but no export feature exists in the app
- **GDPR Art. 20:** Right to data portability is a legal requirement — you must provide a way for users to get their data in a machine-readable format
- **Fix:** Either build an export feature (JSON/CSV download of recipes, meal plans, etc.) or at minimum, handle export requests manually via email and document that process

---

## Privacy Policy — Missing Disclosures

### 5. Third-party services not named

The privacy policy vaguely mentions "service providers" but GDPR requires transparency about who processes user data. The following services are **completely undisclosed**:

| Service | Data Sent | Purpose | Privacy Policy Link Needed |
|---------|-----------|---------|---------------------------|
| **OpenAI** | Chat messages, recipe data, food images (base64) | AI chatbot (gpt-4.1-mini) | Yes |
| **PostHog** | Usage patterns, errors, device info, exceptions | Product analytics | Yes |
| **Canny** | User ID, email, full name, avatar URL, account creation date | Feedback/feature requests | Yes |
| **RevenueCat** | User ID, purchase/subscription info | Subscription management | Yes |
| **Google Fonts** | IP address, user agent (via fonts.googleapis.com) | Font delivery | Yes |
| **Recipe extraction server** (91.99.166.5) | URLs, images, language | Recipe importing | Yes |
| **Google** (OAuth) | Email, name, avatar | Authentication | Already partially covered |
| **Supabase** | All app data | Database, auth, storage, realtime | Already partially covered |

**Action:** Add a "Third-Party Services" section listing each provider, what data is shared, why, and a link to their privacy policy.

### 6. AI/Chatbot data processing — no disclosure at all

- Users have **zero** awareness that their chat messages and uploaded images are sent to OpenAI
- The chatbot also sends recipe context (name, ingredients, instructions) to OpenAI
- Previous conversation IDs are stored for continuity
- **Action:** Add a dedicated "AI-Powered Features" section explaining:
  - What data is sent to OpenAI
  - That images uploaded in chat are transmitted to OpenAI servers
  - Whether/how long chat data is retained
  - OpenAI's data handling practices
  - Consider adding an in-app consent banner before first chatbot use

### 7. Camera and photo access not mentioned

- App requests camera and photo gallery permissions on mobile (via @capacitor/camera)
- Images are compressed client-side, uploaded to Supabase storage, and potentially sent to OpenAI or the recipe extraction server
- **Action:** Add "Camera and Photos" to the data collection section

### 8. Survey data collection not mentioned

- Onboarding survey collects dietary preferences, cooking habits, and other personal preferences
- Stored in `survey_answers` table with question text, selected options, and user ID
- **Action:** Disclose survey data collection, its purpose, and retention period

### 9. Household data sharing not explained

- Users in a household can see each other's recipes, meal plans, and cookbooks
- This is a form of data sharing between users that should be disclosed
- **Action:** Explain that joining a household means your recipe and meal planning data becomes visible to other household members

### 10. Data retention policy completely missing

- No mention of how long data is kept
- No mention of what happens to data after account deletion
- No mention of backup retention
- **GDPR Art. 13(2)(a):** You must state storage periods or criteria for determining them
- **Action:** Define and disclose retention periods for:
  - Account data
  - Recipes and meal plans
  - Chat history
  - Images in Supabase storage
  - Survey responses
  - Analytics data (PostHog)
  - Data after account deletion (how soon is it purged?)

### 11. Legal basis for processing missing

- **GDPR Art. 13(1)(c):** Must state the legal basis for each processing activity
- **Action:** Add a "Legal Basis" section:
  - **Contract performance** (Art. 6(1)(b)): Core app features (recipes, meal planning, sync)
  - **Consent** (Art. 6(1)(a)): Analytics (PostHog), survey, chatbot/AI features, Canny feedback
  - **Legitimate interest** (Art. 6(1)(f)): Error reporting, security monitoring

### 12. Data transfers outside the EU

- Current text says "transferred to and processed in countries where our service providers operate" — too vague
- **GDPR Art. 13(1)(f):** Must state specific transfer mechanisms
- OpenAI processes data in the US
- Supabase hosting region should be specified
- PostHog hosting region should be specified
- **Action:** Name which services transfer data outside the EU and what safeguards are used (Standard Contractual Clauses, EU-US Data Privacy Framework, etc.)

---

## Privacy Policy — Inaccuracies to Fix

### 13. "Shopping lists" — doesn't exist

- "Meal plans and shopping lists" is listed under collected data, but the app has no shopping list feature
- **Action:** Remove "shopping lists"

### 14. "Recipe recommendations" — doesn't exist

- "Personalize your experience with recipe recommendations" is listed as a data use, but no recommendation system exists
- **Action:** Remove or replace with actual use case (e.g., "Power AI chatbot features")

### 15. "Cookies" section is misleading

- The app doesn't use HTTP cookies
- It uses `localStorage` (theme preference) and `sessionStorage` (temporary email during signup)
- **Action:** Replace "Cookies and Analytics" with "Local Storage and Analytics" — explain what's stored locally and that PostHog is used for analytics

### 16. "International Users" section assumes US-based

- Text says "If you are using Plateful from outside the United States" — but you're based in Germany
- GDPR should be the **primary** framework, not an afterthought for international users
- **Action:** Rewrite to reflect German/EU base. Add a section about non-EU users instead

### 17. Notifications

- "Send important updates and notifications" is listed but doesn't specify email vs. push
- **Action:** Specify: "We may send you email notifications and push notifications about important updates, feature changes, or account-related information. You can manage notification preferences in your device settings."

---

## Terms of Service — Issues

### 18. No subscription/payment terms

- App has RevenueCat subscriptions but ToS doesn't mention:
  - What's included in free vs. paid tiers
  - Subscription pricing and billing cycle
  - Auto-renewal terms and how to cancel
  - That refunds are handled by Apple/Google per their policies
- **Apple/Google requirement:** Must reference their payment terms
- **Action:** Add a "Subscriptions and Payments" section

### 19. AI-generated content disclaimer missing

- Chatbot generates recipe suggestions via `propose_recipe` and `propose_recipe_edit` function calls
- AI can hallucinate ingredients, wrong quantities, or unsafe food combinations
- **Risk:** Someone follows an AI-generated recipe and has an allergic reaction
- **Action:** Add: "AI-generated recipes and suggestions are provided for convenience only. Always verify ingredients, quantities, allergens, and cooking instructions independently. We are not responsible for the accuracy, safety, or suitability of AI-generated content."

### 20. Age requirement should be 16, not 13

- Germany's implementation of GDPR (BDSG §8) sets the age of consent for data processing at **16**
- Both privacy policy and ToS currently say 13
- **Action:** Change to 16 in both documents

### 21. Governing law is vague

- Currently says "the jurisdiction where Plateful operates" — specify it
- **Action:** Replace with: "These Terms are governed by the laws of the Federal Republic of Germany."

### 22. Arbitration clause is problematic in the EU

- EU consumers have the right to bring disputes to their local courts (Brussels I Regulation)
- Mandatory arbitration clauses are generally **unenforceable** against EU consumers
- **Action:** Replace arbitration clause with:
  - Jurisdiction: competent courts in [your city], Germany
  - Reference to EU Online Dispute Resolution platform (https://ec.europa.eu/consumers/odr)
  - Note that this doesn't restrict consumers' rights under EU law

### 23. Recipe import copyright implications

- App scrapes recipes from external URLs
- ToS should clarify that users are responsible for copyright compliance when importing
- Current "Share recipes that you do not have the right to share" partially covers this but doesn't mention imports
- **Action:** Add explicit clause: "When importing recipes from external sources, you are responsible for ensuring you have the right to use and store that content."

### 24. Household/shared account terms missing

- No terms governing household membership
- Questions like: Who owns shared data? What happens when a member leaves? Can the household owner remove members?
- **Action:** Add a "Household Accounts" section covering data ownership and member removal

### 25. Third-party service dependency disclaimer

- App depends on Supabase, OpenAI, Google, RevenueCat, etc.
- If any of these go down, the app breaks
- **Action:** Add a clause disclaiming liability for third-party service outages

### 26. Account deletion says "deleting the App" terminates account

- This is wrong — uninstalling the app does NOT delete the user's account or data from Supabase
- **Action:** Remove "by deleting the App" and replace with in-app deletion instructions

---

## Summary Checklist

| # | Priority | Area | Issue |
|---|----------|------|-------|
| 1 | **CRITICAL** | Security | HTTP recipe extraction (no TLS) |
| 2 | **CRITICAL** | Privacy | OpenAI training opt-out unconfirmed |
| 3 | **CRITICAL** | Compliance | No in-app account deletion (Apple/Google requirement) |
| 4 | **CRITICAL** | Compliance | Data export claimed but doesn't exist |
| 5 | **HIGH** | Privacy | Third-party services not named |
| 6 | **HIGH** | Privacy | AI/chatbot processing undisclosed |
| 7 | **HIGH** | Privacy | Camera/photo access not mentioned |
| 8 | **MEDIUM** | Privacy | Survey data not mentioned |
| 9 | **MEDIUM** | Privacy | Household data sharing not explained |
| 10 | **HIGH** | Privacy | No data retention policy |
| 11 | **HIGH** | Privacy | No legal basis for processing (GDPR) |
| 12 | **HIGH** | Privacy | Data transfers outside EU vague |
| 13 | **LOW** | Privacy | Shopping lists don't exist |
| 14 | **LOW** | Privacy | Recipe recommendations don't exist |
| 15 | **LOW** | Privacy | Cookies section misleading |
| 16 | **MEDIUM** | Privacy | US-centric framing (should be Germany) |
| 17 | **LOW** | Privacy | Notification types unspecified |
| 18 | **HIGH** | ToS | No subscription/payment terms |
| 19 | **HIGH** | ToS | No AI content disclaimer |
| 20 | **HIGH** | ToS | Age should be 16, not 13 (Germany) |
| 21 | **MEDIUM** | ToS | Governing law unspecified |
| 22 | **HIGH** | ToS | Arbitration unenforceable in EU |
| 23 | **MEDIUM** | ToS | Recipe import copyright unclear |
| 24 | **MEDIUM** | ToS | No household terms |
| 25 | **LOW** | ToS | No third-party dependency disclaimer |
| 26 | **MEDIUM** | ToS | "Delete the app" ≠ delete account |
