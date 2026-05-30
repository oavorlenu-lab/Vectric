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
import { Save } from "lucide-react";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSettings.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast.success("Settings saved");
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
        },
        onError: () => toast.error("Failed to save settings")
      }
    );
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
          <Save className="w-4 h-4 mr-2" />
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
              <Label>Grok AI API Key</Label>
              <Input type="password" value={formData.grokApiKey || ""} onChange={e => handleChange("grokApiKey", e.target.value)} placeholder="xai-..." />
              <p className="text-xs text-gray-500">Required for the AI Writing Assistant features.</p>
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
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <h3 className="font-bold border-b pb-2 text-lg">Configuration</h3>
            
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={formData.contactEmail || ""} onChange={e => handleChange("contactEmail", e.target.value)} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-xs text-gray-500">Allow visitors to create accounts</p>
              </div>
              <Switch checked={formData.enableUserRegistration} onCheckedChange={v => handleChange("enableUserRegistration", v)} />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="space-y-0.5">
                <Label className="text-red-600">Maintenance Mode</Label>
                <p className="text-xs text-gray-500">Take public site offline</p>
              </div>
              <Switch checked={formData.maintenanceMode} onCheckedChange={v => handleChange("maintenanceMode", v)} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
