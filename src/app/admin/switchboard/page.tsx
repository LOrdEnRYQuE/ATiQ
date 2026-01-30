"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Power, PowerOff, Plus, Trash2, AlertTriangle, CheckCircle } from "lucide-react";

interface ConfigItem {
  id: string;
  key: string;
  value: string | number | boolean;
  description: string;
  is_active: boolean;
  updated_at: string;
}

interface SystemStatus {
  maintenance_mode: boolean;
  default_model: string;
  enable_repair_agent: boolean;
  enable_voice_coding: boolean;
  token_limit_per_hour: number;
}

export default function Switchboard() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    maintenance_mode: false,
    default_model: 'claude-3.5-sonnet',
    enable_repair_agent: true,
    enable_voice_coding: false,
    token_limit_per_hour: 100000,
  });
  const [loading, setLoading] = useState(true);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: "",
    value: "",
    description: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data } = await supabase
        .from('global_config')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        setConfigs(data);
        
        // Extract system status
        const status: Partial<SystemStatus> = {};
        data.forEach(config => {
          if (config.key in systemStatus) {
            const value = config.value;
            status[config.key as keyof SystemStatus] = 
              typeof value === 'string' ? value === 'true' ? true : value === 'false' ? false : value :
              typeof value === 'number' ? value : value;
          }
        });
        
        setSystemStatus(prev => ({ ...prev, ...status }));
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConfig = async (config: ConfigItem) => {
    const newValue = typeof config.value === 'boolean' ? !config.value : config.value;
    
    try {
      const { error } = await supabase
        .from('global_config')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c
      ));

      // Update system status if it's a system config
      if (config.key in systemStatus) {
        setSystemStatus(prev => ({
          ...prev,
          [config.key]: newValue
        }));
      }
    } catch (error) {
      console.error('Error toggling config:', error);
    }
  };

  const updateConfigValue = async (config: ConfigItem, newValue: string | number | boolean) => {
    try {
      const { error } = await supabase
        .from('global_config')
        .update({ 
          value: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfigs(prev => prev.map(c => 
        c.id === config.id ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c
      ));

      // Update system status if it's a system config
      if (config.key in systemStatus) {
        setSystemStatus(prev => ({
          ...prev,
          [config.key]: newValue
        }));
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const createConfig = async () => {
    try {
      const { error } = await supabase
        .from('global_config')
        .insert({
          key: newConfig.key,
          value: newConfig.value,
          description: newConfig.description,
        });

      if (error) throw error;

      await fetchConfigs();
      setShowNewConfig(false);
      setNewConfig({ key: "", value: "", description: "" });
    } catch (error) {
      console.error('Error creating config:', error);
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const { error } = await supabase
        .from('global_config')
        .delete()
        .eq('id', configId);

      if (error) throw error;

      setConfigs(prev => prev.filter(c => c.id !== configId));
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const criticalConfigs = [
    'maintenance_mode',
    'enable_repair_agent',
    'default_model',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Power className="w-8 h-8 text-purple-400" />
          Switchboard
        </h1>
        <p className="text-gray-400">Control platform features and global configuration</p>
      </header>

      {/* System Status Overview */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-6">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border ${
            systemStatus.maintenance_mode 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-green-500/10 border-green-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              {systemStatus.maintenance_mode ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400" />
              )}
              <span className="font-medium">System Status</span>
            </div>
            <p className="text-sm text-gray-400">
              {systemStatus.maintenance_mode ? 'Maintenance Mode' : 'Operational'}
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
            <div className="flex items-center gap-3 mb-2">
              <Power className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Repair Agent</span>
            </div>
            <p className="text-sm text-gray-400">
              {systemStatus.enable_repair_agent ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Default Model</span>
            </div>
            <p className="text-sm text-gray-400">{systemStatus.default_model}</p>
          </div>

          <div className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
            <div className="flex items-center gap-3 mb-2">
              <Power className="w-5 h-5 text-yellow-400" />
              <span className="font-medium">Voice Coding</span>
            </div>
            <p className="text-sm text-gray-400">
              {systemStatus.enable_voice_coding ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Controls */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Feature Flags</h2>
          <button
            onClick={() => setShowNewConfig(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Config
          </button>
        </div>

        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.id} className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">{config.key}</h3>
                    {criticalConfigs.includes(config.key) && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Critical</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{config.description}</p>
                  
                  {/* Boolean Toggle */}
                  {typeof config.value === 'boolean' && (
                    <button
                      onClick={() => toggleConfig(config)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
                        config.value 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {config.value ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      {config.value ? 'Enabled' : 'Disabled'}
                    </button>
                  )}

                  {/* String/Number Input */}
                  {typeof config.value === 'string' && config.key !== 'system_prompt_v1' && config.key !== 'system_prompt_v2' && (
                    <input
                      type="text"
                      value={config.value}
                      onChange={(e) => updateConfigValue(config, e.target.value)}
                      className="px-3 py-1 bg-[#111] border border-[#444] rounded-lg text-sm focus:border-purple-500 outline-none"
                    />
                  )}

                  {typeof config.value === 'number' && (
                    <input
                      type="number"
                      value={config.value}
                      onChange={(e) => updateConfigValue(config, parseInt(e.target.value))}
                      className="px-3 py-1 bg-[#111] border border-[#444] rounded-lg text-sm focus:border-purple-500 outline-none w-32"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(config.updated_at).toLocaleString()}
                  </span>
                  {!criticalConfigs.includes(config.key) && (
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Config Modal */}
      {showNewConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-8 z-50">
          <div className="bg-[#111] border border-[#222] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Add Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Key</label>
                <input
                  type="text"
                  value={newConfig.key}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
                  placeholder="e.g., enable_beta_feature"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                <input
                  type="text"
                  value={newConfig.value}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
                  placeholder="true, false, or any value"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newConfig.description}
                  onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none h-20"
                  placeholder="Describe what this configuration does"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewConfig(false)}
                className="px-4 py-2 border border-[#333] rounded-lg hover:bg-[#0a0a0a] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createConfig}
                disabled={!newConfig.key || !newConfig.value}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                Add Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
