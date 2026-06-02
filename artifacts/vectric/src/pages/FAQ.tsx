import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SeoHead } from "@/components/SeoHead";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    category: "General",
    items: [
      {
        question: "What is Vectric?",
        answer:
          "Vectric is a multi-category blog and news platform covering technology, sports, business, health, entertainment, lifestyle, and more. We publish well-researched, easy-to-read articles to keep you informed on everything that matters.",
      },
      {
        question: "Is Vectric free to read?",
        answer:
          "Yes, all content on Vectric is completely free to read. No subscription or account is required to access any article.",
      },
      {
        question: "How often is new content published?",
        answer:
          "We publish new articles daily across our categories. You can subscribe to our newsletter to get the latest posts delivered straight to your inbox.",
      },
    ],
  },
  {
    category: "Newsletter",
    items: [
      {
        question: "How do I subscribe to the newsletter?",
        answer:
          "You can subscribe by entering your email address in the newsletter signup box found on the homepage or at the bottom of any article. You'll receive a confirmation and start getting updates right away.",
      },
      {
        question: "How do I unsubscribe from the newsletter?",
        answer:
          "Every newsletter email contains an unsubscribe link at the bottom. Click it and you'll be removed from the mailing list immediately. You can also contact us directly and we'll remove you manually.",
      },
      {
        question: "Will you share my email with anyone?",
        answer:
          "Never. We do not sell, rent, or share your email address with any third parties. Your email is only used to send you our newsletter updates.",
      },
    ],
  },
  {
    category: "Content & Categories",
    items: [
      {
        question: "What topics does Vectric cover?",
        answer:
          "Vectric covers a wide range of topics including Technology, Sports, Business & Finance, Health & Wellness, Entertainment, Lifestyle, Science, and more. Browse our categories to find what interests you most.",
      },
      {
        question: "Can I submit an article or pitch a story?",
        answer:
          "We welcome story pitches and contributions from writers. Please reach out to us via the Contact page with your idea and a brief summary of who you are.",
      },
      {
        question: "Are your articles written by humans or AI?",
        answer:
          "All articles on Vectric are written and reviewed by our editorial team. We may use AI tools to assist with research and drafting, but every published piece is reviewed and edited by a human editor before going live.",
      },
    ],
  },
  {
    category: "Technical",
    items: [
      {
        question: "Why is the website not loading properly?",
        answer:
          "Try refreshing the page or clearing your browser cache. If the issue persists, please contact us via our Contact page and describe the problem — we'll look into it right away.",
      },
      {
        question: "Can I share articles on social media?",
        answer:
          "Absolutely! Each article has social sharing options. When you share a link, it will display the article title, description, and featured image on platforms like Facebook, Twitter/X, and WhatsApp.",
      },
      {
        question: "How do I search for a specific article?",
        answer:
          "Use the search bar at the top of the website to find articles by keyword, topic, or title. You can also browse by category using the navigation menu.",
      },
    ],
  },
  {
    category: "Contact & Privacy",
    items: [
      {
        question: "How can I contact Vectric?",
        answer:
          "You can reach us through our Contact page. Fill in the form with your name, email, and message and we'll get back to you as soon as possible.",
      },
      {
        question: "How does Vectric handle my personal data?",
        answer:
          "We take your privacy seriously. We only collect the minimum data necessary (such as your email for the newsletter) and never share it with third parties. Read our full Privacy Policy for details.",
      },
      {
        question: "Does Vectric use cookies?",
        answer:
          "Yes, we use essential cookies to keep admin users logged in and analytics cookies (like Google Analytics) to understand how visitors use the site. You can accept or decline non-essential cookies via the cookie banner when you first visit.",
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4 hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-semibold text-base md:text-lg">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-primary" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-muted-foreground leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <PublicLayout>
      <SeoHead
        title="Frequently Asked Questions"
        description="Find answers to the most common questions about Vectric — our content, newsletter, privacy practices, and more."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" },
        ]}
      />

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground">
            Got a question? We've got answers. If you can't find what you're
            looking for, feel free to{" "}
            <a href="/contact" className="text-primary underline underline-offset-4">
              contact us
            </a>
            .
          </p>
        </div>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-xl font-serif font-bold mb-2 text-primary">
                {section.category}
              </h2>
              <div className="border rounded-xl px-6 divide-y">
                {section.items.map((item) => (
                  <FaqItem
                    key={item.question}
                    question={item.question}
                    answer={item.answer}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-muted rounded-2xl p-10">
          <h2 className="text-2xl font-serif font-bold mb-3">
            Still have questions?
          </h2>
          <p className="text-muted-foreground mb-6">
            We're happy to help. Send us a message and we'll get back to you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold px-8 py-3 hover:opacity-90 transition-opacity"
          >
            Contact Us
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
