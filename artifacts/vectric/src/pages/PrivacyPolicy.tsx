import { PublicLayout } from "@/components/layout/PublicLayout";
import { SeoHead } from "@/components/SeoHead";
import { useGetSettings } from "@workspace/api-client-react";

export default function PrivacyPolicy() {
  const { data: settings } = useGetSettings();
  const siteName = settings?.siteName || "Vectric";
  const contactEmail = settings?.contactEmail || "privacy@yourdomain.com";
  const updatedDate = "June 1, 2025";

  return (
    <PublicLayout>
      <SeoHead
        title="Privacy Policy"
        description={`Read ${siteName}'s Privacy Policy to understand how we collect, use, and protect your personal information.`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy-policy" },
        ]}
      />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-serif font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {updatedDate}</p>

        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-gray-700">

          <p>
            Welcome to {siteName}. This Privacy Policy explains how we collect, use, and protect
            your personal information when you visit our website and subscribe to our newsletter.
            By using our website, you agree to the practices described in this policy.
          </p>

          <h2>1. Information We Collect</h2>
          <p>We collect only the information you voluntarily provide to us:</p>
          <ul>
            <li><strong>Email address</strong> — when you subscribe to our newsletter.</li>
            <li><strong>Contact form data</strong> — your name, email, and message when you reach out to us.</li>
            <li><strong>Usage data</strong> — anonymous analytics data such as pages visited and time spent on the site, collected through tools like Google Analytics (if enabled).</li>
          </ul>
          <p>We do not collect payment information, government IDs, or any sensitive personal data.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information solely for the following purposes:</p>
          <ul>
            <li>To send you our newsletter with articles and updates (if you subscribed).</li>
            <li>To respond to your messages and inquiries.</li>
            <li>To understand how visitors use our website so we can improve the content and experience.</li>
          </ul>
          <p>We do not sell, rent, or trade your personal information to any third parties.</p>

          <h2>3. Newsletter Subscriptions</h2>
          <p>
            When you subscribe to our newsletter, your email address is stored securely in our database.
            You can unsubscribe at any time by clicking the unsubscribe link in any newsletter email.
            Once unsubscribed, your email will be removed from our mailing list promptly.
          </p>

          <h2>4. Cookies</h2>
          <p>
            Our website may use cookies to improve your browsing experience. Cookies are small files
            stored on your device. We use them for:
          </p>
          <ul>
            <li>Keeping you logged in (for admin users only).</li>
            <li>Analytics to understand website traffic (via Google Analytics, if enabled).</li>
          </ul>
          <p>
            You can disable cookies through your browser settings. Note that some parts of the site
            may not function correctly without cookies.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>We may use the following third-party services that have their own privacy policies:</p>
          <ul>
            <li><strong>Google Analytics</strong> — for anonymous website traffic analysis.</li>
            <li><strong>Resend</strong> — for sending newsletter emails.</li>
          </ul>
          <p>
            These services process data on our behalf and are required to keep it confidential.
            We encourage you to review their privacy policies.
          </p>

          <h2>6. Data Security</h2>
          <p>
            We take reasonable steps to protect your personal information from unauthorized access,
            loss, or misuse. Your data is stored securely and access is restricted to authorised
            personnel only. However, no method of transmission over the internet is 100% secure.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain your email address for as long as you are subscribed to our newsletter.
            Contact form messages are retained for up to 12 months. You may request deletion
            of your data at any time by contacting us.
          </p>

          <h2>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Withdraw consent for newsletter communications at any time.</li>
          </ul>
          <p>To exercise any of these rights, please contact us at <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>

          <h2>9. Children's Privacy</h2>
          <p>
            Our website is not directed at children under the age of 13. We do not knowingly collect
            personal information from children. If you believe a child has provided us with personal
            information, please contact us and we will delete it promptly.
          </p>

          <h2>10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Any changes will be posted on this
            page with an updated date. We encourage you to review this policy periodically.
          </p>

          <h2>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
