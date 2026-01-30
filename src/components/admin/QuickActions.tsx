"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { 
  Zap, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Users, 
  Database, 
  Shield,
  CheckCircle,
  X
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => Promise<void>;
  danger?: boolean;
  requiresConfirmation?: boolean;
}

export default function QuickActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  const clearCache = async () => {
    setLoading('clear-cache');
    try {
      // Clear any client-side cache
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      setMessage({ type: 'success', text: 'Cache cleared successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to clear cache' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetFailedSessions = async () => {
    setLoading('reset-sessions');
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .lt('last_seen', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Sessions older than 1 hour

      if (error) throw error;
      setMessage({ type: 'success', text: 'Stale sessions cleared' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset sessions' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const cleanupOldLogs = async () => {
    setLoading('cleanup-logs');
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('telemetry_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Old logs cleaned up' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to cleanup logs' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const exportData = async () => {
    setLoading('export-data');
    try {
      const [users, sessions, logs] = await Promise.all([
        supabase.from('user_profiles').select('*'),
        supabase.from('active_sessions').select('*'),
        supabase.from('telemetry_logs').select('*').limit(1000)
      ]);

      const data = {
        users: users.data || [],
        sessions: sessions.data || [],
        logs: logs.data || [],
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atiq-admin-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Data exported successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to export data' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleMaintenanceMode = async () => {
    setLoading('maintenance-mode');
    try {
      const { data: current } = await supabase
        .from('global_config')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      const newValue = !(current?.value === true);
      
      await supabase
        .from('global_config')
        .upsert({
          key: 'maintenance_mode',
          value: newValue,
          description: 'Maintenance mode toggle'
        });

      setMessage({ 
        type: 'success', 
        text: `Maintenance mode ${newValue ? 'enabled' : 'disabled'}` 
      });
    } catch {
      setMessage({ type: 'error', text: 'Failed to toggle maintenance mode' });
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'clear-cache',
      title: 'Clear Cache',
      description: 'Clear browser and application cache',
      icon: RefreshCw,
      action: clearCache
    },
    {
      id: 'reset-sessions',
      title: 'Reset Failed Sessions',
      description: 'Clear stale or failed user sessions',
      icon: Users,
      action: resetFailedSessions
    },
    {
      id: 'cleanup-logs',
      title: 'Cleanup Old Logs',
      description: 'Remove telemetry logs older than 30 days',
      icon: Database,
      action: cleanupOldLogs
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Download admin data as JSON',
      icon: Download,
      action: exportData
    },
    {
      id: 'maintenance-mode',
      title: 'Toggle Maintenance Mode',
      description: 'Enable/disable platform maintenance',
      icon: Shield,
      action: toggleMaintenanceMode,
      danger: true,
      requiresConfirmation: true
    }
  ];

  const executeAction = async (action: QuickAction) => {
    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        `Are you sure you want to "${action.title}"? This action may affect all users.`
      );
      if (!confirmed) return;
    }

    await action.action();
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-purple-400" />
        <h3 className="text-xl font-semibold">Quick Actions</h3>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isLoading = loading === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              disabled={isLoading}
              className={`
                flex items-center gap-3 p-4 rounded-lg border transition-all
                ${action.danger 
                  ? 'border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5' 
                  : 'border-[#333] hover:border-purple-500/40 hover:bg-purple-500/5'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`p-2 rounded-lg ${
                action.danger 
                  ? 'bg-red-500/10' 
                  : 'bg-purple-500/10'
              }`}>
                <Icon className={`w-4 h-4 ${
                  action.danger 
                    ? 'text-red-400' 
                    : 'text-purple-400'
                }`} />
              </div>
              
              <div className="flex-1 text-left">
                <h4 className={`text-sm font-medium ${
                  action.danger ? 'text-red-400' : 'text-white'
                }`}>
                  {isLoading ? 'Processing...' : action.title}
                </h4>
                <p className="text-xs text-gray-400">{action.description}</p>
              </div>

              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400">Important</span>
        </div>
        <p className="text-xs text-gray-400">
          Some actions may affect all users. Please read descriptions carefully before executing.
        </p>
      </div>
    </div>
  );
}
