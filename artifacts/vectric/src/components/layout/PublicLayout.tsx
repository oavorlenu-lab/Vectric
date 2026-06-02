import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGetSettings, useSubscribeNewsletter } from "@workspace/api-client-react";
import { Search, Menu, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SUBSCRIBED_KEY = "vectric_subscribed";

export function Navbar() {
  const { data: settings } = useGetSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(() => !!localStorage.getItem(SUBSCRIBED_KEY));
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = () => setSubscribed(true);
    window.addEventListener("vectric:subscribed", handler);
    return () => window.removeEventListener("vectric:subscribed", handler);
  }, []);

  const subscribeNewsletter = useSubscribeNewsletter();

  let menuItems = [
    { label: "Technology", href: "/category/technology" },
    { label: "Business", href: "/category/business" },
    { label: "Science", href: "/category/science" },
    { label: "Health", href: "/category/health" },
  ];

  if (settings?.headerMenu) {
    try {
      menuItems = JSON.parse(settings.headerMenu);
    } catch(e) {}
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    subscribeNewsletter.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          localStorage.setItem(SUBSCRIBED_KEY, "1");
          setSubscribed(true);
          setSubscribeOpen(false);
          setEmail("");
          toast.success("You're subscribed! Thank you.");
        },
        onError: () => {
          toast.error("Something went wrong. Please try again.");
        },
      }
    );
  };

  return (
    <>
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
              {settings?.siteName || "Vectric"}
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {menuItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => navigate("/search")}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Button>

            {!subscribed ? (
              <Button size="sm" onClick={() => setSubscribeOpen(true)}>
                Subscribe
              </Button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground px-3 py-1.5 rounded-md border bg-muted/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs">Subscribed</span>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Stay in the loop</DialogTitle>
            <DialogDescription>
              Get the latest articles from {settings?.siteName || "Vectric"} delivered straight to your inbox.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubscribe} className="space-y-4 mt-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button
              type="submit"
              className="w-full"
              disabled={subscribeNewsletter.isPending}
            >
              {subscribeNewsletter.isPending ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Footer() {
  const { data: settings } = useGetSettings();

  return (
    <footer className="border-t bg-card text-card-foreground mt-20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight mb-4 inline-block">
              {settings?.siteName || "Vectric"}
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {settings?.siteDescription || "A premium destination for authoritative, beautiful, and thoughtful publishing."}
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{settings?.footerText || `© ${new Date().getFullYear()} Vectric. All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
