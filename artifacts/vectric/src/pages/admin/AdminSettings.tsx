import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Save, KeyRound, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [formData, setFormData] = useState<any>({});

  // Credentials change state
  const [creds, setCreds] = useState({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
  const [credsLoading, setCredsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const SETTINGS_FIELDS = [
    "siteName","siteTagline","siteDescription","logoUrl","faviconUrl",
    "googleAnalyticsId","googleSearchConsoleCode","adsenseClientId","grokApiKey",
    "footerText","socialLinks","headerMenu","footerMenu","contactEmail","contactAddress",
    "resendApiKey","newsletterFromEmail","maintenanceMode",
  ];

  const handleSave = () => {
    // Strip id, timestamps, and null values — API only accepts string|boolean|undefined
    const payload: Record<string, any> = {};
    for (const key of SETTINGS_FIELDS) {
      const val = formData[key];
      if (val !== null && val !== undefined) payload[key] = val;
    }
    updateSettings.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
        onError: () => toast.error("Failed to save settings")
      }
    );
  };

  const handleCredentialsChange = async () => {
    if (!creds.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    if (creds.newPassword && creds.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (creds.newPassword && creds.newPassword !== creds.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (!creds.newUsername && !creds.newPassword) {
      toast.error("Enter a new username or new password to update");
      return;
    }

    setCredsLoading(true);
    try {
      const resp = await fetch("/api/auth/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: creds.currentPassword,
          newUsername: creds.newUsername || undefined,
          newPassword: creds.newPassword || undefined,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "Failed to update credentials");
      } else {
        toast.success("Credentials updated successfully");
        setCreds({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      toast.error("Network error");
    } finally {
      setCredsLoading(false);
    }
  };

  if (isLoading) return <AdminLayout><div className="animate-pulse h-96 bg-gray-100 rounded-xl"></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 mt-1">Configure global platform options</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2 text-lg">General Identity</h3>
            
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={formData.siteName || ""} onChange={e => handleChange("siteName", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={formData.siteTagline || ""} onChange={e => handleChange("siteTagline", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.siteDescription || ""} onChange={e => handleChange("siteDescription", e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={formData.logoUrl || ""} onChange={e => handleChange("logoUrl", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input value={formData.faviconUrl || ""} onChange={e => handleChange("faviconUrl", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2 text-lg">Integrations</h3>
            
            <div className="space-y-2">
              <Label>Google Analytics ID</Label>
              <Input value={formData.googleAnalyticsId || ""} onChange={e => handleChange("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" />
            </div>
            
            <div className="space-y-2">
              <Label>AdSense Client ID</Label>
              <Input value={formData.adsenseClientId || ""} onChange={e => handleChange("adsenseClientId", e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" />
            </div>
            
            <div className="space-y-2">
              <Label>Groq API Key</Label>
              <Input type="password" value={formData.grokApiKey || ""} onChange={e => handleChange("grokApiKey", e.target.value)} placeholder="gsk_..." />
              <p className="text-xs text-gray-500">Required for the AI Writing Assistant. Get a free key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">console.groq.com</a>.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2 text-lg">Email (Newsletter)</h3>
            <div className="space-y-2">
              <Label>Resend API Key</Label>
              <Input type="password" value={formData.resendApiKey || ""} onChange={e => handleChange("resendApiKey", e.target.value)} placeholder="re_..." />
              <p className="text-xs text-gray-500">
                Required to send newsletters. Get a free key at{" "}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">resend.com</a>
                {" "}— free tier includes 3,000 emails/month.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Newsletter From Email</Label>
              <Input
                type="email"
                value={formData.newsletterFromEmail || ""}
                onChange={e => handleChange("newsletterFromEmail", e.target.value)}
                placeholder="newsletter@yourdomain.com"
              />
              <p className="text-xs text-gray-500">
                The email address newsletters are sent <em>from</em>. Must be an address you have configured in your Resend account.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold border-b pb-2 text-lg">Footer & Navigation</h3>
            
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Input value={formData.footerText || ""} onChange={e => handleChange("footerText", e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Header Menu (JSON Array)</Label>
              <Textarea 
                value={formData.headerMenu || ""} 
                onChange={e => handleChange("headerMenu", e.target.value)} 
                className="font-mono text-xs" 
                rows={4} 
                placeholder={'[{"label":"Tech","href":"/category/tech"}]'}
              />
            </div>
          </div>

          {/* Credentials Section */}
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <KeyRound className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-lg">Admin Credentials</h3>
            </div>
            <p className="text-sm text-gray-500">Change your admin username or password. Current password is required to make any changes.</p>

            <div className="space-y-2">
              <Label>Current Password <span className="text-red-500">*</span></Label>
              <Input
                type="password"
                value={creds.currentPassword}
                onChange={e => setCreds(p => ({ ...p, currentPassword: e.target.value }))}
                placeholder="Enter your current password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2">
                <Label>New Username</Label>
                <Input
                  value={creds.newUsername}
                  onChange={e => setCreds(p => ({ ...p, newUsername: e.target.value }))}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={creds.newPassword}
                  onChange={e => setCreds(p => ({ ...p, newPassword: e.target.value }))}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2 md:col-start-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={creds.confirmPassword}
                  onChange={e => setCreds(p => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <Button
              onClick={handleCredentialsChange}
              disabled={credsLoading}
              variant="outline"
              className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {credsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Update Credentials
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <h3 className="font-bold border-b pb-2 text-lg">Configuration</h3>
            
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={formData.contactEmail || ""} onChange={e => handleChange("contactEmail", e.target.value)} placeholder="hello@yoursite.com" />
            </div>

            <div className="space-y-2">
              <Label>Contact Address</Label>
              <Textarea value={formData.contactAddress || ""} onChange={e => handleChange("contactAddress", e.target.value)} placeholder={"123 Main Street\nCity, Country"} rows={2} />
              <p className="text-xs text-gray-500">Shown on the Contact page. Leave blank to hide the address section.</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-red-600">Maintenance Mode</Label>
                <p className="text-xs text-gray-500">Take public site offline</p>
              </div>
              <Switch checked={formData.maintenanceMode} onCheckedChange={v => handleChange("maintenanceMode", v)} />
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
            <h4 className="font-semibold text-indigo-800 mb-2">Current Login Info</h4>
            <p className="text-sm text-indigo-600">Your admin credentials are separate from the public user system. Keep them safe and change them regularly.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
