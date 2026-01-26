import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 min-h-screen bg-background">
      <div className="space-y-6 pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: July 22, 2025</p>
        </div>

        <Separator />

        <div className="space-y-6 text-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Acceptance of Terms</h2>
            <p>
              By downloading, accessing, or using the Plateful mobile application ("App"), you agree
              to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
              please do not use our App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Description of Service</h2>
            <p>Plateful is a recipe and meal planning application that allows users to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create, store, and organize recipes</li>
              <li>Plan meals and create shopping lists</li>
              <li>Import recipes from various sources</li>
              <li>Share recipes with other users</li>
              <li>Rate and review recipes</li>
              <li>Sync data across multiple devices</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">User Accounts</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Account Creation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>
                  You are responsible for maintaining the security of your account credentials
                </li>
                <li>You must be at least 13 years old to create an account</li>
                <li>One person may not maintain more than one account</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Account Responsibility</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You are responsible for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>We are not liable for any loss or damage from unauthorized account access</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Acceptable Use</h2>
            <p>You agree not to use the App to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Upload harmful, offensive, or inappropriate content</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Distribute malware or other harmful code</li>
              <li>Use the App for commercial purposes without permission</li>
              <li>Share recipes that you do not have the right to share</li>
              <li>Harass or abuse other users</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">User Content</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Content Ownership</h3>
              <p>
                You retain ownership of the recipes, photos, and other content you create and upload
                to Plateful. However, by using our App, you grant us a non-exclusive, worldwide,
                royalty-free license to use, store, and display your content as necessary to provide
                the service.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Content Standards</h3>
              <p>All user content must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Be accurate and not misleading</li>
                <li>Not violate any copyright or trademark rights</li>
                <li>Not contain harmful or offensive material</li>
                <li>Comply with applicable food safety guidelines</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Content Removal</h3>
              <p>
                We reserve the right to remove any content that violates these Terms or our
                community standards, with or without notice.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Intellectual Property</h2>
            <p>
              The Plateful App, including its design, functionality, and original content, is
              protected by copyright, trademark, and other intellectual property laws. You may not
              copy, modify, distribute, or create derivative works of our App without explicit
              permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which explains how
              we collect, use, and protect your information when you use our App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Service Availability</h2>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                We strive to maintain App availability but cannot guarantee uninterrupted service
              </li>
              <li>We may temporarily suspend service for maintenance or updates</li>
              <li>We reserve the right to modify or discontinue features with reasonable notice</li>
              <li>We are not liable for any downtime or service interruptions</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Disclaimers and Limitations</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Food Safety Disclaimer</h3>
              <p>
                Plateful provides recipes and meal planning tools for informational purposes only.
                We are not responsible for food safety, dietary restrictions, allergies, or health
                consequences resulting from recipes or meal plans. Always verify ingredient safety
                and consult healthcare professionals for dietary advice.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Service Disclaimer</h3>
              <p>
                The App is provided "as is" without warranties of any kind. We disclaim all
                warranties, express or implied, including merchantability, fitness for a particular
                purpose, and non-infringement.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, we shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising from your use of the
                App.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Account Termination</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Termination by You</h3>
              <p>
                You may terminate your account at any time by deleting the App or contacting our
                support team. Upon termination, your access to the App will cease, and your data may
                be deleted according to our data retention policy.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Termination by Us</h3>
              <p>
                We may suspend or terminate your account if you violate these Terms, engage in
                fraudulent activity, or for any other reason at our discretion, with or without
                notice.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Updates to Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated
              through the App or via email. Continued use of the App after changes constitutes
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the
              jurisdiction where Plateful operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or your use of the App will be resolved through
              binding arbitration in accordance with the rules of the relevant arbitration
              authority, except where prohibited by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable, the remaining provisions
              will remain in full force and effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Contact Information</h2>
            <p>If you have questions about these Terms of Service, please contact us:</p>
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <p>Email: MCKerim@gmx.de</p>
              <p>Through the app's support feature</p>
              <p>Via our social media channels</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between
              you and Plateful regarding your use of the App and supersede all prior agreements and
              understandings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
