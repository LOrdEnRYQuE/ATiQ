"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Settings, Shield, Database, Key, Save, RefreshCw } from "lucide-react";

interface AdminSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  enableTelemetry: boolean;
  maxSessionsPerUser: number;
  defaultModel: string;
  enableNotifications: boolean;
  autoCleanupDays: number;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<AdminSettings>({
    siteName: "ATiQ",
    siteDescription: "AI-Powered Web Development Platform",
    maintenanceMode: false,
    enableTelemetry: true,
    maxSessionsPerUser: 5,
    defaultModel: "claude-3.5-sonnet",
    enableNotifications: true,
    autoCleanupDays: 30,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    try {
      const supabase = createClient();
      
      // Fetch settings from global_config
      const { data: configData } = await supabase
        .from('global_config')
        .select('key, value')
        .in('key', [
          'site_name',
          'site_description', 
          'maintenance_mode',
          'enable_telemetry',
          'max_sessions_per_user',
          'default_model',
          'enable_notifications',
          'auto_cleanup_days'
        ]);

      if (configData) {
        const newSettings = { ...settings };
        configData.forEach(config => {
          switch (config.key) {
            case 'site_name':
              newSettings.siteName = config.value as string;
              break;
            case 'site_description':
              newSettings.siteDescription = config.value as string;
              break;
            case 'maintenance_mode':
              newSettings.maintenanceMode = config.value as boolean;
              break;
            case 'enable_telemetry':
              newSettings.enableTelemetry = config.value as boolean;
              break;
            case 'max_sessions_per_user':
              newSettings.maxSessionsPerUser = config.value as number;
              break;
            case 'default_model':
              newSettings.defaultModel = config.value as string;
              break;
            case 'enable_notifications':
              newSettings.enableNotifications = config.value as boolean;
              break;
            case 'auto_cleanup_days':
              newSettings.autoCleanupDays = config.value as number;
              break;
          }
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage("Error loading settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      const supabase = createClient();
      
      const settingsToSave = [
        { key: 'site_name', value: settings.siteName },
        { key: 'site_description', value: settings.siteDescription },
        { key: 'maintenance_mode', value: settings.maintenanceMode },
        { key: 'enable_telemetry', value: settings.enableTelemetry },
        { key: 'max_sessions_per_user', value: settings.maxSessionsPerUser },
        { key: 'default_model', value: settings.defaultModel },
        { key: 'enable_notifications', value: settings.enableNotifications },
        { key: 'auto_cleanup_days', value: settings.autoCleanupDays },
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('global_config')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            description: `Admin setting: ${setting.key}`,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      }

      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <main className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">Configure your ATiQ admin panel</p>
      </header>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes("Error") 
            ? "bg-red-500/10 border border-red-500/20 text-red-400" 
            : "bg-green-500/10 border border-green-500/20 text-green-400"
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-8">
        {/* General Settings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">General</h2>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Site Description</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none resize-none"
              />
            </div>
          </div>
        </section>

        {/* System Settings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">System</h2>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Maintenance Mode</label>
                <p className="text-xs text-gray-500">Disable access to the platform</p>
              </div>
              <button
                onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Enable Telemetry</label>
                <p className="text-xs text-gray-500">Collect usage analytics</p>
              </div>
              <button
                onClick={() => handleInputChange('enableTelemetry', !settings.enableTelemetry)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableTelemetry ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableTelemetry ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-300">Enable Notifications</label>
                <p className="text-xs text-gray-500">Send system notifications</p>
              </div>
              <button
                onClick={() => handleInputChange('enableNotifications', !settings.enableNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableNotifications ? 'bg-purple-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* AI Settings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">AI Configuration</h2>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Default Model</label>
              <select
                value={settings.defaultModel}
                onChange={(e) => handleInputChange('defaultModel', e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              >
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
              </select>
            </div>
          </div>
        </section>

        {/* Database Settings */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Database</h2>
          </div>
          
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Sessions Per User</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxSessionsPerUser}
                onChange={(e) => handleInputChange('maxSessionsPerUser', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Auto Cleanup Days</label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.autoCleanupDays}
                onChange={(e) => handleInputChange('autoCleanupDays', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Automatically delete logs older than this many days</p>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex items-center gap-4">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-6 py-3 bg-[#111] border border-[#333] text-gray-300 rounded-lg hover:border-purple-500 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </section>
      </div>
    </main>
  );
}
