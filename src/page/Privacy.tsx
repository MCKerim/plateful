import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router";
import { App } from "@capacitor/app";

export default function Privacy() {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = App.addListener("backButton", () => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
    });
    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-screen bg-background">
      <div className="space-y-2 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: October 8, 2026</p>
        </div>

        <Separator />

        <div className="space-y-6 text-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Introduction</h2>
            <p>
              Welcome to Plateful. Plateful is operated by KBlanks, a sole trader
              (Einzelunternehmen) based in Germany. We are committed to protecting your personal
              data in accordance with the General Data Protection Regulation (GDPR) and applicable
              German law. This privacy policy explains how we collect, use, and safeguard your
              information when you use our recipe and meal planning application.
            </p>
            <p>The controller responsible for your data is:</p>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="font-medium">KBlanks (Einzelunternehmen)</p>
              <p>Im Kassemänneken 5</p>
              <p>46325 Borken (Weseke)</p>
              <p>Germany</p>
              <p>Email: support@plateful.cloud</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Information We Collect</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Account Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Email address (for account creation, authentication, support, and product
                  analytics)
                </li>
                <li>Name (optional, for personalization)</li>
                <li>Profile picture (optional)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Recipe and Meal Data</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Recipes you create, save, or import</li>
                <li>Meal plans and cookbooks</li>
                <li>Dietary preferences and restrictions</li>
                <li>Recipe ratings and reviews</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Camera and Photos</h3>
              <p>
                When you use features that involve images (such as adding a recipe photo, importing
                a recipe from a photo, or attaching a photo in the chatbot or cooking assistant),
                the app requests access to your device's camera and photo library. Images are
                compressed on your device before being uploaded to our servers. Photos you use with
                an AI feature are also transmitted to OpenAI for processing, as described in
                "AI-Powered Features" below. You can revoke camera and photo access at any time in
                your device settings.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Onboarding Survey</h3>
              <p>
                During onboarding, we collect dietary preferences, cooking habits, and other
                personal preferences through a survey. This data is stored in your account and used
                to tailor your experience. You can withdraw consent for this data at any time by
                contacting us.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Usage Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>App usage patterns and features accessed</li>
                <li>Device information (type, operating system)</li>
                <li>Log data and error reports</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and maintain the Plateful service</li>
              <li>Sync your data across devices</li>
              <li>Power AI features (recipe import, chatbot, cooking assistance, search)</li>
              <li>Improve our app features and functionality</li>
              <li>
                Send you email notifications and push notifications about important updates, feature
                changes, or account-related information. You can manage notification preferences in
                your device settings.
              </li>
              <li>Provide customer support</li>
              <li>Analyze usage to fix bugs and improve performance</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">AI-Powered Features</h2>
            <p>
              Plateful uses AI models from OpenAI and Google (Gemini) for several features. The
              specific models change as the providers release new versions; this section names the
              provider that processes your data for each feature and what data it receives. Recipe
              imports, the cooking assistant, recipe adaptation and background recipe processing run
              on our recipe extraction service, which we operate ourselves and which forwards the
              data described below to the respective provider.
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">OpenAI</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <span className="font-medium">AI chatbot:</span> Your chat messages and any photos
                  you attach. If you start the chat from a recipe, that recipe (name, description,
                  ingredients, instructions) is included.
                </li>
                <li>
                  <span className="font-medium">
                    Recipe import from text, websites, and photos:
                  </span>{" "}
                  The text you paste, the content of the web page you import (we fetch the page and
                  send its text), or the photo you take or choose.
                </li>
                <li>
                  <span className="font-medium">
                    Recipe import from TikTok and Instagram posts:
                  </span>{" "}
                  The post's caption and images. Videos go to Google, see below.
                </li>
                <li>
                  <span className="font-medium">Cooking assistant:</span> Your question, any photo
                  you attach, and the recipe you are cooking.
                </li>
                <li>
                  <span className="font-medium">Recipe adaptation:</span> The recipe and the change
                  you ask for.
                </li>
                <li>
                  <span className="font-medium">Search:</span> The text you search for.
                </li>
                <li>
                  <span className="font-medium">Background recipe processing:</span> The content of
                  your recipes (title, description, ingredients, steps), to estimate nutrition and
                  servings, add tags, mark ingredients and timers in cooking steps, suggest
                  collections, and make recipes searchable.
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Google (Gemini)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <span className="font-medium">
                    Recipe import from videos (TikTok, Instagram, YouTube):
                  </span>{" "}
                  The video at the link you import, together with its caption or title and
                  description.
                </li>
                <li>
                  <span className="font-medium">Cover images:</span> When a recipe has no photo, its
                  title, description, and ingredients, to generate a cover image.
                </li>
              </ul>
            </div>
            <p>
              When you import a recipe, your language preference and the names of your collections
              are sent along to the provider handling the import, so the recipe is written in your
              language and can be sorted into your collections.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                Plateful does not store your chat history in your account. The conversation stays in
                the app until you start a new chat or close the app. OpenAI keeps the conversation
                for a limited period so that follow-up messages can refer to earlier ones.
              </li>
              <li>
                OpenAI processes your data in the United States under Standard Contractual Clauses
                (SCCs). OpenAI does not use API data to train its models. See OpenAI's privacy
                policy for details.
              </li>
              <li>
                Google may process your data outside the EU, including in the United States, under
                Standard Contractual Clauses (SCCs). Google does not use this data to train its
                models. See Google's privacy policy for details.
              </li>
            </ul>
            <p>
              By using AI features, you consent to this data being transmitted to the respective
              third-party services as described above.
            </p>
            <div className="space-y-2">
              <h3 className="font-medium">Connecting an AI assistant</h3>
              <p>
                You can connect Plateful to an AI assistant of your choice through our connector (an
                MCP server). The assistant gets access only after you sign in and approve the
                connection on Plateful's own page. On your instructions it can then search, read,
                import, create, change, rate, and delete recipes and manage collections in your
                household, just as you could in the app. Recipe content the assistant reads from
                Plateful is processed by the assistant's provider under your own agreement with that
                provider and its privacy policy; we do not choose or control which assistant you
                use. Recipes imported this way are processed as described above. You can revoke
                access at any time in your assistant's connector settings.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Third-Party Services</h2>
            <p>
              We work with the following third-party service providers. Each receives only the data
              necessary for their specific function:
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-medium">Supabase (EU region)</h3>
                <p>
                  All app data (recipes, meal plans, user accounts, images) is stored on Supabase
                  servers located in the European Union. Data does not leave the EU via Supabase.{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">OpenAI (United States)</h3>
                <p>
                  Chat messages, pasted text, imported web pages, photos, search queries, and recipe
                  content are sent to OpenAI for the AI features described in "AI-Powered Features".
                  Transfer is governed by Standard Contractual Clauses (SCCs).{" "}
                  <a
                    href="https://openai.com/policies/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">PostHog (EU region)</h3>
                <p>
                  Usage patterns, app errors, device information, session data, and your account
                  email address are sent to PostHog for product analytics, support, and error
                  monitoring. The email address is linked to your Plateful account so activity from
                  the same account can be understood across sessions. This data is hosted in the EU
                  and is not used to track you across other companies' apps or websites or for
                  advertising.{" "}
                  <a
                    href="https://posthog.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Canny</h3>
                <p>
                  If you submit feedback or feature requests, your user ID, email address, full
                  name, avatar URL, and account creation date are shared with Canny.{" "}
                  <a
                    href="https://canny.io/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">RevenueCat</h3>
                <p>
                  Your user ID, subscription/purchase information, and on Android the Google
                  Advertising ID (GAID) are processed by RevenueCat to manage your subscription and
                  measure subscription analytics.{" "}
                  <a
                    href="https://www.revenuecat.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Google (Sign-in with Google)</h3>
                <p>
                  If you choose to sign in with Google, your email address, name, and avatar are
                  shared with Google for authentication.{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Google Fonts</h3>
                <p>
                  The web version of the app loads fonts from Google's servers
                  (fonts.googleapis.com), which may transmit your IP address and browser user agent
                  to Google.{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Google Gemini (via our recipe extraction service)</h3>
                <p>
                  Our recipe extraction service, which we operate ourselves, sends videos you import
                  from TikTok, Instagram, or YouTube (with their captions or descriptions) and, to
                  generate cover images, the title, description, and ingredients of recipes without
                  a photo to Google's Gemini API, as described in "AI-Powered Features". Google may
                  process this data outside the EU, including in the United States, under Standard
                  Contractual Clauses (SCCs). Google does not use this data to train its models.{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Google Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">YouTube API Services (Google)</h3>
                <p>
                  When you import a YouTube video, Plateful uses YouTube API Services to fetch the
                  video's title and description; the video's ID is sent to Google.{" "}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    YouTube Terms of Service
                  </a>
                  ,{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Google Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">ScrapeCreators (United States)</h3>
                <p>
                  When you import a TikTok or Instagram post, its link is sent to ScrapeCreators
                  (Web Scraping Guy LLC), which retrieves the post's caption and media for us. No
                  account information is sent.{" "}
                  <a
                    href="https://scrapecreators.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">ScrapingAnt</h3>
                <p>
                  If a recipe website blocks our server, the link to that page is sent to
                  ScrapingAnt (DATAANT Sp. z o.o., Poland), which loads the page and its photo for
                  us through a proxy in the United States. No account information is sent.{" "}
                  <a
                    href="https://scrapingant.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">Hetzner (Germany)</h3>
                <p>
                  Our recipe extraction service and the connector for AI assistants run on servers
                  we rent from Hetzner Online GmbH in Germany. Data you use with these features
                  (links, pasted text, photos, questions, and recipe content) passes through these
                  servers.{" "}
                  <a
                    href="https://www.hetzner.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Legal Basis for Processing (GDPR Art. 6)</h2>
            <p>We process your personal data on the following legal bases:</p>
            <div className="space-y-2">
              <div>
                <h3 className="font-medium">Contract performance (Art. 6(1)(b))</h3>
                <p>
                  Processing necessary to provide the core service: account management, recipe and
                  meal plan storage, sync across devices, subscription management.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Consent (Art. 6(1)(a))</h3>
                <p>
                  Analytics (PostHog), onboarding survey, AI chatbot features, and Canny feedback
                  are processed on the basis of your consent. You may withdraw consent at any time
                  by contacting us or adjusting your settings; withdrawal does not affect the
                  lawfulness of prior processing.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Legitimate interests (Art. 6(1)(f))</h3>
                <p>
                  Error reporting and security monitoring are processed on the basis of our
                  legitimate interest in maintaining a secure and reliable service.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Retention</h2>
            <p>We retain your data only as long as necessary for the purposes described above:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <span className="font-medium">
                  Account data, recipes, meal plans, cookbooks, images, and survey responses:
                </span>{" "}
                Deleted immediately upon account deletion.
              </li>
              <li>
                <span className="font-medium">Analytics data (PostHog):</span> Retained for up to 12
                months.
              </li>
              <li>
                <span className="font-medium">Encrypted database backups:</span> May be retained for
                up to 30 days after deletion before being permanently purged from backup systems.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase (EU region), which provides
              enterprise-grade security measures including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encryption in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Backup and recovery systems</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share data only in these limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>
                With service providers listed in the "Third-Party Services" section above, under
                strict data processing agreements
              </li>
            </ul>
            <div className="space-y-1">
              <h3 className="font-medium">Household sharing</h3>
              <p>
                If you join a household within the app, your recipes, meal plans, and cookbooks
                become visible to all members of that household. This is a deliberate sharing
                feature — joining a household means your content is shared with its members. You can
                leave a household at any time in your account settings.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your Rights (GDPR)</h2>
            <p>
              As a user in the EU, you have the following rights under the GDPR. To exercise any of
              these rights, contact us at support@plateful.cloud:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <span className="font-medium">Access (Art. 15):</span> Request a copy of the
                personal data we hold about you
              </li>
              <li>
                <span className="font-medium">Rectification (Art. 16):</span> Correct inaccurate or
                incomplete data
              </li>
              <li>
                <span className="font-medium">Erasure (Art. 17):</span> Request deletion of your
                account and associated data (in-app account deletion is available in Settings)
              </li>
              <li>
                <span className="font-medium">Data portability (Art. 20):</span> Request an export
                of your data in a machine-readable format. Please contact us at
                support@plateful.cloud and we will provide your data within 30 days.
              </li>
              <li>
                <span className="font-medium">Withdraw consent:</span> Withdraw consent for any
                consent-based processing at any time
              </li>
              <li>
                <span className="font-medium">Object (Art. 21):</span> Object to data processing
                based on legitimate interests
              </li>
              <li>
                <span className="font-medium">Lodge a complaint:</span> You have the right to lodge
                a complaint with the supervisory authority in your EU member state. In Germany, this
                is the relevant state data protection authority (Landesbeauftragte für Datenschutz).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Local Storage and Analytics</h2>
            <p>
              Plateful does not use HTTP cookies. We use browser local storage and session storage
              for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <span className="font-medium">Local storage:</span> Storing your theme preference
                (light/dark mode)
              </li>
              <li>
                <span className="font-medium">Session storage:</span> Temporarily storing your email
                address during the sign-up flow
              </li>
            </ul>
            <p>
              We use PostHog (EU region) for product analytics. PostHog collects usage data, error
              events, device information, and your account email address to help us understand how
              the app is used, provide support, and identify bugs. The data is linked to your
              Plateful account but is not used for cross-app tracking or advertising.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Children's Privacy</h2>
            <p>
              Plateful is not intended for children under 16 years of age. In accordance with German
              law (BDSG §8) and GDPR Art. 8, we do not knowingly collect personal data from children
              under 16. If you believe a child under 16 has provided us with personal data, please
              contact us immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any
              material changes by posting the new policy in the app and updating the "Last updated"
              date. Continued use of the app after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Users Outside the EU</h2>
            <p>
              Plateful is operated from Germany and is designed for EU users. If you access the app
              from outside the European Union, your data will be processed in the EU (via Supabase's
              EU infrastructure) except where specific third-party services (such as OpenAI) process
              data in the United States as described in the "Third-Party Services" section.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Automated Decision-Making</h2>
            <p>
              We do not use automated decision-making or profiling that produces legal effects or
              similarly significantly affects you (GDPR Art. 22). The AI chatbot provides recipe
              suggestions and cooking assistance for your convenience only — it does not make any
              automated decisions about your account or access to the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data practices, or wish to
              exercise your rights, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p className="font-medium">KBlanks (Einzelunternehmen)</p>
              <p>Im Kassemänneken 5</p>
              <p>46325 Borken (Weseke)</p>
              <p>Germany</p>
              <p>Email: support@plateful.cloud</p>
              <p>Through the app's support feature</p>
              <p>Via our social media channels</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
