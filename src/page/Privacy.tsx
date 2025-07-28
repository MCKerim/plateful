import { Separator } from "@/components/ui/separator";

export default function Privacy() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-screen bg-background">
      <div className="space-y-2 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: July 22, 2025
          </p>
        </div>

        <Separator />

        <div className="space-y-6 text-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Introduction</h2>
            <p>
              Welcome to Plateful. We respect your privacy and are committed to
              protecting your personal data. This privacy policy explains how we
              collect, use, and safeguard your information when you use our
              recipe and meal planning application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Information We Collect</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Account Information</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Email address (for account creation and authentication)</li>
                <li>Name (optional, for personalization)</li>
                <li>Profile picture (optional)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Recipe and Meal Data</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Recipes you create, save, or import</li>
                <li>Meal plans and shopping lists</li>
                <li>Dietary preferences and restrictions</li>
                <li>Recipe ratings and reviews</li>
              </ul>
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
            <h2 className="text-lg font-semibold">
              How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide and maintain the Plateful service</li>
              <li>Sync your data across devices</li>
              <li>Personalize your experience with recipe recommendations</li>
              <li>Improve our app features and functionality</li>
              <li>Send important updates and notifications</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Data Storage and Security</h2>
            <p>
              Your data is stored securely using Supabase, which provides
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
              We do not sell, trade, or rent your personal information to third
              parties. We may share data only in these limited circumstances:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>
                With service providers who help us operate the app (under strict
                confidentiality agreements)
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
              <li>Object to data processing</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Cookies and Analytics</h2>
            <p>
              We may use cookies and similar technologies to improve your
              experience and analyze app usage. You can control cookie settings
              through your device preferences.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Children's Privacy</h2>
            <p>
              Plateful is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will
              notify you of any material changes by posting the new policy in
              the app and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our data
              practices, please contact us:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p>Email: MCKerim@gmx.de</p>
              <p>Through the app's support feature</p>
              <p>Via our social media channels</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">International Users</h2>
            <p>
              If you are using Plateful from outside the United States, please
              note that your information may be transferred to and processed in
              countries where our service providers operate. We ensure
              appropriate safeguards are in place for such transfers.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
