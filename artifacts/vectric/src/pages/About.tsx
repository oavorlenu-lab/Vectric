import { PublicLayout } from "@/components/layout/PublicLayout";
import { useGetSettings } from "@workspace/api-client-react";

export default function About() {
  const { data: settings } = useGetSettings();

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">About {settings?.siteName || "Vectric"}</h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {settings?.siteTagline || "A premium destination for authoritative, beautiful, and thoughtful publishing."}
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-serif">
          {settings?.siteDescription ? (
            <p>{settings.siteDescription}</p>
          ) : (
            <>
              <p>
                Founded with a commitment to editorial excellence, Vectric provides a platform where 
                substance meets style. We believe that great writing deserves a great reading experience—one 
                free from clutter, noise, and distraction.
              </p>
              
              <h2>Our Mission</h2>
              <p>
                We aim to elevate digital publishing by offering deep, well-researched, and beautifully presented 
                content across technology, business, culture, and science. Our authors are experts in their fields, 
                bringing nuance and perspective to the stories that shape our world.
              </p>
              
              <h2>The Design Philosophy</h2>
              <p>
                Our platform is designed with intentionality. Every typographic choice, spacing unit, and color 
                is meant to serve the reading experience. We believe that aesthetics and information density are 
                not mutually exclusive—they reinforce each other to create something memorable.
              </p>
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
