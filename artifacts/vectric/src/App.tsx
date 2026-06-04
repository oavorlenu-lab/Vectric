import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CookieBanner } from "@/components/CookieBanner";
import { useGetSettings } from "@workspace/api-client-react";
import { useEffect } from "react";

import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BlogPost from "@/pages/BlogPost";
import Category from "@/pages/Category";
import Search from "@/pages/Search";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Login from "@/pages/Login";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import FAQ from "@/pages/FAQ";

import AdminLogin from "@/pages/admin/AdminLogin";
import Dashboard from "@/pages/admin/Dashboard";
import AdminPosts from "@/pages/admin/AdminPosts";
import AdminPostEditor from "@/pages/admin/AdminPostEditor";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminMedia from "@/pages/admin/AdminMedia";
import AdminMessages from "@/pages/admin/AdminMessages";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminAds from "@/pages/admin/AdminAds";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAi from "@/pages/admin/AdminAi";
import AdminUsers from "@/pages/admin/AdminUsers";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function GoogleAnalytics({ id }: { id: string }) {
  useEffect(() => {
    if (!id || document.getElementById("ga-script")) return;
    const s = document.createElement("script");
    s.id = "ga-script";
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    s.async = true;
    document.head.appendChild(s);
    const i = document.createElement("script");
    i.id = "ga-init";
    i.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
    document.head.appendChild(i);
  }, [id]);
  return null;
}

function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="text-6xl mb-6">🔧</div>
      <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Under Maintenance</h1>
      <p className="text-lg text-gray-500 max-w-md">We're making some improvements. We'll be back shortly. Thanks for your patience.</p>
    </div>
  );
}

function AppShell() {
  const { data: settings } = useGetSettings();
  const [location] = useLocation();
  const isAdmin = location.startsWith("/admin");

  useEffect(() => {
    if (settings?.googleAnalyticsId) {
      // handled by GoogleAnalytics component below
    }
  }, [settings?.googleAnalyticsId]);

  if (settings?.maintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <>
      {settings?.googleAnalyticsId && <GoogleAnalytics id={settings.googleAnalyticsId} />}
      <Router />
    </>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/blog/:slug" component={BlogPost} />
        <Route path="/category/:slug" component={Category} />
        <Route path="/search" component={Search} />
        <Route path="/contact" component={Contact} />
        <Route path="/about" component={About} />
        <Route path="/login" component={Login} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/faq" component={FAQ} />

        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/posts" component={AdminPosts} />
        <Route path="/admin/posts/new" component={AdminPostEditor} />
        <Route path="/admin/posts/:id/edit" component={AdminPostEditor} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/media" component={AdminMedia} />
        <Route path="/admin/messages" component={AdminMessages} />
        <Route path="/admin/newsletter" component={AdminNewsletter} />
        <Route path="/admin/ads" component={AdminAds} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/ai" component={AdminAi} />
        <Route path="/admin/users" component={AdminUsers} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppShell />
          </WouterRouter>
          <Toaster position="top-center" />
          <CookieBanner />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
