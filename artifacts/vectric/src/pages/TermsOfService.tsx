import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetSettings } from "@workspace/api-client-react";

export default function TermsOfService() {
  const { data: settings } = useGetSettings();
  const siteName = settings?.siteName || "Vectric";
  const contactEmail = settings?.contactEmail || "legal@yourdomain.com";
  const updatedDate = "June 1, 2025";

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-serif font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: {updatedDate}</p>

        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-p:leading-relaxed prose-p:text-gray-700">

          <p>
            Please read these Terms of Service ("Terms") carefully before using {siteName}.
            By accessing or using our website, you agree to be bound by these Terms. If you
            do not agree, please do not use our website.
          </p>

          <h2>1. Use of the Website</h2>
          <p>
            {siteName} provides articles, blog posts, and informational content for general
            reading purposes. You may access and read our content freely. You agree to use
            this website only for lawful purposes and in a way that does not infringe the
            rights of others.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Reproduce, duplicate, or copy our content without written permission.</li>
            <li>Use our website in any way that causes or may cause damage to the website or impairs its availability.</li>
            <li>Transmit any unsolicited or unauthorised advertising or promotional material (spam).</li>
            <li>Attempt to gain unauthorised access to any part of our website or systems.</li>
          </ul>

          <h2>2. Intellectual Property</h2>
          <p>
            All content published on {siteName} — including articles, images, graphics, logos,
            and design — is the intellectual property of {siteName} or its respective authors
            and contributors, unless otherwise stated.
          </p>
          <p>
            You may share links to our articles. You may quote brief excerpts for commentary
            or educational purposes, provided you clearly credit {siteName} and link back to
            the original article. Reproducing full articles without permission is prohibited.
          </p>

          <h2>3. Newsletter</h2>
          <p>
            By subscribing to our newsletter, you consent to receive periodic emails from
            {siteName} containing articles, updates, and relevant information. You may
            unsubscribe at any time via the link in any newsletter email. We will not send
            spam or share your email with third parties.
          </p>

          <h2>4. User-Submitted Content</h2>
          <p>
            If you submit content to us (such as comments or contact messages), you grant
            {siteName} a non-exclusive, royalty-free licence to use, display, and distribute
            that content in connection with our services. You represent that you own or have
            the rights to any content you submit.
          </p>

          <h2>5. Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. These links are provided
            for your convenience only. We have no control over the content of those sites
            and accept no responsibility for them or for any loss or damage that may arise
            from your use of them. Visiting linked websites is at your own risk.
          </p>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The content on {siteName} is provided for informational purposes only. We make
            no warranties or representations about the accuracy, completeness, or suitability
            of the information. The content does not constitute professional advice (legal,
            financial, medical, or otherwise).
          </p>
          <p>
            The website is provided "as is" without any warranties of any kind, either
            express or implied, including but not limited to warranties of merchantability
            or fitness for a particular purpose.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {siteName} shall not be liable for any
            indirect, incidental, special, or consequential damages arising from your use
            of or inability to use this website, even if we have been advised of the
            possibility of such damages.
          </p>

          <h2>8. Privacy</h2>
          <p>
            Your use of this website is also governed by our{" "}
            <a href="/privacy-policy">Privacy Policy</a>, which is incorporated into these
            Terms by reference. Please review it to understand our practices.
          </p>

          <h2>9. Changes to These Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted
            on this page with an updated date. Your continued use of the website after
            changes are posted constitutes acceptance of the revised Terms.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable law.
            Any disputes arising under these Terms shall be subject to the exclusive
            jurisdiction of the relevant courts.
          </p>

          <h2>11. Contact</h2>
          <p>
            If you have any questions about these Terms, please contact us at:{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
