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

import { apiService } from "../services/api";

export function SettingsPage({ userRole }) {
  const normalizedRole =
    userRole === "superadmin" ? "super-admin" : userRole;
  const isSuperAdmin =
    normalizedRole === "super-admin" || normalizedRole === "superadmin";

  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Admin Phone Change State
  const [adminPhone, setAdminPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [userId, setUserId] = useState(null);

  const fileInputRef = useRef(null);

  const [currentModPhone, setCurrentModPhone] = useState("");
  const [modPhone, setModPhone] = useState("");
  const [modConfirmPassword, setModConfirmPassword] = useState("");
  const [isUpdatingMod, setIsUpdatingMod] = useState(false);

  // Note: We no longer fetch all moderators on mount since we look up by phone

  const handleUpdateModerator = async () => {
    if (!currentModPhone) {
      toast.error("Please enter the current moderator phone");
      return;
    }
    if (!modPhone) {
      toast.error("Please enter a new phone number");
      return;
    }
    if (!modPhone.startsWith("+964") || modPhone.length < 13) {
      toast.error("Invalid new phone format. Must start with +964 and have 10 digits.");
      return;
    }
    if (!modConfirmPassword) {
      toast.error("Please confirm your superadmin password");
      return;
    }

    try {
      setIsUpdatingMod(true);

      // Step 1: Find the moderator by their current phone
      const usersResponse = await apiService.getUsers({ search: currentModPhone.trim() });
      const users = usersResponse.users || usersResponse || [];

      // Strict match on phone (ignoring spaces if needed, but exact match is safer)
      // The search API uses ILIKE, so we might get partial matches. We filter for exact match or normalized match.
      const targetUser = users.find(u =>
        u.phone === currentModPhone.trim() ||
        u.phone.replace(/\s/g, '') === currentModPhone.replace(/\s/g, '')
      );

      if (!targetUser) {
        toast.error("❌ Moderator with this phone number not found.");
        return;
      }

      if (targetUser.role !== 'moderator') {
        toast.error(`❌ User found but role is '${targetUser.role}', not 'moderator'.`);
        return;
      }

      console.log("🚀 Updating Moderator Phone...");
      console.log("   ModeratorID:", targetUser.id);

      // Step 2: Call update API
      const response = await apiService.changeAdminPhone(
        targetUser.id,
        modPhone,
        modConfirmPassword
      );

      console.log("✅ API Response:", response);

      if (response && (response.success || response.message)) {
        toast.success("✅ Moderator phone number updated successfully!");
        setModPhone("");
        setCurrentModPhone(""); // Clear the inputs
        setModConfirmPassword("");
      } else {
        toast.success("✅ Phone updated (Response OK)");
        setModPhone("");
        setCurrentModPhone("");
        setModConfirmPassword("");
      }
    } catch (error) {
      console.error("❌ Update moderator phone error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update moderator phone";
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setIsUpdatingMod(false);
    }
  };

  useEffect(() => {
    // Extract User ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.id) {
            setUserId(payload.id);
          }
        }
      } catch (e) {
        console.error("Failed to decode token for user ID", e);
      }
    }
  }, []);

  const handleUpdatePhone = async (e) => {
    if (e) e.preventDefault();

    console.log("🖱️ 'Update Phone' button clicked");
    console.log("   Phone:", adminPhone);
    console.log("   Password provided:", !!confirmPassword);
    console.log("   UserID:", userId);

    if (!adminPhone) {
      toast.error("Please enter a new phone number");
      return;
    }
    // Basic format validation
    if (!adminPhone.startsWith("+964") || adminPhone.length < 13) {
      toast.error("Invalid phone format. Must start with +964 and have 10 digits.");
      return;
    }

    if (!confirmPassword) {
      toast.error("Please confirm your password");
      return;
    }
    if (!userId) {
      console.error("❌ User ID is missing from state");
      toast.error("User ID not found. Please log in again.");
      return;
    }

    try {
      setIsUpdatingPhone(true);
      console.log("🚀 Sending PUT request to update phone...");

      // Use existing API endpoint via service
      const response = await apiService.changeAdminPhone(
        userId,
        adminPhone,
        confirmPassword
      );

      console.log("✅ API Response:", response);

      if (response && (response.success || response.message)) {
        toast.success("✅ Phone number updated successfully!");
        setAdminPhone("");
        setConfirmPassword("");
      } else {
        console.warn("⚠️ Unexpected API response:", response);
        toast.success("✅ Phone updated (Response OK)"); // Fallback success if 200 OK but no success flag
        setAdminPhone("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("❌ Update phone error:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update phone number";

      toast.error(`❌ ${errorMsg}`);
    } finally {
      setIsUpdatingPhone(false);
    }
  };

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

      // Get base URL based on environment
      function getBaseUrl() {
        // Hardcoded for Production as requested
        return 'https://api.mazaadati.com/api';
      }

      const baseURL = getBaseUrl();

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

          // Get base URL based on environment
          function getBaseUrl() {
            // Hardcoded for Production as requested
            return 'https://api.mazaadati.com/api';
          }

          const baseURL = getBaseUrl();
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

      {/* --- Admin Account Security Section (Superadmin Only) --- */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Account Security</CardTitle>
            <CardDescription>
              Manage your super admin account credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="admin-phone">Change Phone Number</Label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      id="admin-phone"
                      placeholder="+964750XXXXXXX"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: +964XXXXXXXXXX (Iraq format)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePhone}
                  disabled={isUpdatingPhone || !adminPhone || !confirmPassword}
                >
                  {isUpdatingPhone ? "Updating..." : "Update Phone Number"}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* --- Moderator Phone Section --- */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Change Moderator Phone Number</h3>
              <p className="text-sm text-gray-500">
                Update the phone number for a moderator account.
              </p>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Current Moderator Phone</Label>
                  <Input
                    placeholder="Enter current phone (e.g., +964...)"
                    value={currentModPhone}
                    onChange={(e) => setCurrentModPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This must match the moderator's existing phone number exactly.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mod-phone">New Moderator Phone</Label>
                  <Input
                    id="mod-phone"
                    placeholder="+9647XXXXXXXXX"
                    value={modPhone}
                    onChange={(e) => setModPhone(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: +964XXXXXXXXXX (Iraq format)
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="mod-confirm-password">
                    Confirm Superadmin Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mod-confirm-password"
                    type="password"
                    placeholder="Enter YOUR superadmin password"
                    value={modConfirmPassword}
                    onChange={(e) => setModConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateModerator}
                  disabled={isUpdatingMod || !currentModPhone || !modPhone || !modConfirmPassword}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isUpdatingMod ? "Updating..." : "Update Moderator Phone"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Appearance Section Removed --- */}
    </div>
  );
}
