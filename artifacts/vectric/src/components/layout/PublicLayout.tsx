import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetSettings } from "@workspace/api-client-react";

export function Navbar() {
  const { data: settings } = useGetSettings();
  
  // Parse header menu if exists
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

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
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

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/search">Search</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/contact">Subscribe</Link>
          </Button>
        </div>
      </div>
    </header>
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
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
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
