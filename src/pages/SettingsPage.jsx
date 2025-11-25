import React, { useState, useRef, useEffect } from "react";
import {
  Settings,
  Shield,
  Mail,
  CreditCard,
  Palette,
  Database,
  Globe,
  Lock,
  Save,
  Users,
  DollarSign,
  Upload,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { getScopeFromToken } from "../utils/roleUtils";

export function SettingsPage({ userRole }) {
  const normalizedRole =
    userRole === "superadmin" ? "super-admin" : userRole;
  const isSuperAdmin =
    normalizedRole === "super-admin" || normalizedRole === "superadmin";

  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  const handleResetSettings = () => {
    if (
      window.confirm(
        "⚠️ Are you sure you want to reset all settings? This action cannot be undone and will restore all settings to their default values."
      )
    ) {
      setLogoUrl(null);
      toast.success("Settings reset to defaults");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".svg"];
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      toast.error(
        "❌ Invalid file type. Please upload PNG, JPG, JPEG, or SVG files only."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("❌ File size too large. Please upload a file smaller than 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("logo", file);

      const token = localStorage.getItem("token");
      
      // Validate token scope before making request
      if (token) {
        const scope = getScopeFromToken(token);
        
        // If scope is "mobile", clear storage and reject
        if (scope === 'mobile') {
          console.warn('⚠️ [Admin Panel] Mobile-scope token detected in SettingsPage. Clearing storage.');
          localStorage.removeItem('token');
          window.location.href = '/';
          throw new Error('Invalid token scope. Please login again.');
        }
        
        // Only allow tokens with scope="admin" or no scope (backward compatibility)
        if (scope && scope !== 'admin') {
          console.warn('⚠️ [Admin Panel] Invalid token scope in SettingsPage:', scope);
          localStorage.removeItem('token');
          window.location.href = '/';
          throw new Error('Invalid token scope. Please login again.');
        }
      }
      
      let baseURL = "http://localhost:5000/api";
      if (typeof import.meta !== "undefined" && import.meta.env) {
        baseURL =
          import.meta.env.VITE_BASE_URL ||
          import.meta.env.REACT_APP_BASE_URL ||
          baseURL;
      }

      const response = await fetch(`${baseURL}/admin/settings/logo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      if (data.logoUrl) {
        const serverBase = baseURL.replace("/api", "");
        const fullUrl = data.logoUrl.startsWith("http")
          ? data.logoUrl
          : `${serverBase}${data.logoUrl}`;
        setLogoUrl(fullUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setLogoUrl(reader.result);
        reader.readAsDataURL(file);
      }

      toast.success("✅ Logo uploaded successfully!");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Logo upload error:", error);
      toast.error("❌ Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      const loadCurrentLogo = async () => {
        try {
          const token = localStorage.getItem("token");
          
          // Validate token scope before making request
          if (token) {
            const scope = getScopeFromToken(token);
            
            // If scope is "mobile", clear storage and reject
            if (scope === 'mobile') {
              console.warn('⚠️ [Admin Panel] Mobile-scope token detected in SettingsPage. Clearing storage.');
              localStorage.removeItem('token');
              window.location.href = '/';
              return;
            }
            
            // Only allow tokens with scope="admin" or no scope (backward compatibility)
            if (scope && scope !== 'admin') {
              console.warn('⚠️ [Admin Panel] Invalid token scope in SettingsPage:', scope);
              localStorage.removeItem('token');
              window.location.href = '/';
              return;
            }
          }
          
          let baseURL = "http://localhost:5000/api";
          if (typeof import.meta !== "undefined" && import.meta.env) {
            baseURL =
              import.meta.env.VITE_BASE_URL ||
              import.meta.env.REACT_APP_BASE_URL ||
              baseURL;
          }
          const response = await fetch(`${baseURL}/admin/settings/logo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.logoUrl) {
              const serverBase = baseURL.replace("/api", "");
              const fullUrl = data.logoUrl.startsWith("http")
                ? data.logoUrl
                : `${serverBase}${data.logoUrl}`;
              setLogoUrl(fullUrl);
            }
          }
        } catch (error) {
          console.error("Error loading current logo:", error);
        }
      };
      loadCurrentLogo();
    }
  }, [isSuperAdmin]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900 dark:text-white mb-1">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure your admin panel and platform settings
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* --- Appearance / Logo Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>Branding & Theme</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Platform Logo</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Platform Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "BM"
                )}
              </div>

              {isSuperAdmin && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload New Logo"}
                  </Button>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* --- Reset Section --- */}
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <p className="text-sm text-orange-900 dark:text-orange-100 mb-2">
              ⚠️ Danger Zone
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
              These actions cannot be undone. Please be careful.
            </p>

            {isSuperAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResetSettings}
              >
                Reset All Settings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
