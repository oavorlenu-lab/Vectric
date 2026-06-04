import { useState } from "react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { SeoHead } from "@/components/SeoHead";
import { useSendMessage, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  const { data: settings } = useGetSettings();
  const sendMessage = useSendMessage();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    sendMessage.mutate({
      data: { name, email, message }
    }, {
      onSuccess: () => {
        toast.success("Message sent successfully. We'll get back to you soon!");
        setName("");
        setEmail("");
        setMessage("");
      },
      onError: () => {
        toast.error("Failed to send message. Please try again.");
      }
    });
  };

  return (
    <PublicLayout>
      <SeoHead
        title="Contact Us"
        description="Get in touch with the Vectric team. Whether you have feedback, a story pitch, or a partnership enquiry — we'd love to hear from you."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" },
        ]}
      />
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Get in Touch</h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Whether you're a reader with feedback, a writer pitching a story, or a brand looking to partner with us, we'd love to hear from you.
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Email Us</h3>
                  <p className="text-muted-foreground">{settings?.contactEmail || "hello@vectric.com"}</p>
                </div>
              </div>
              
              {settings?.contactAddress && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Headquarters</h3>
                    <p className="text-muted-foreground" style={{ whiteSpace: "pre-line" }}>{settings.contactAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-card border rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com" 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help you?" 
                  rows={6}
                  required 
                  className="resize-none"
                />
              </div>
              
              <Button type="submit" className="w-full font-bold" disabled={sendMessage.isPending}>
                {sendMessage.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
