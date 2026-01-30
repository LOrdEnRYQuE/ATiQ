"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Zap, AlertTriangle, Users, TrendingUp, Cpu } from "lucide-react";

interface TelemetryRow {
  created_at: string;
  event_type: string;
  success: boolean;
  error_signature: string;
  model_used: string;
  duration_ms: number;
}

interface ActiveSession {
  id: string;
  user_id: string;
  last_seen: string;
  metadata: Record<string, unknown>;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

export default function LivePulse() {
  const [metrics, setMetrics] = useState({
    activeSessions: 0,
    crashesLastHour: 0,
    repairSuccessRate: 0,
    tokenBurnRate: 0,
  });
  
  const [telemetryData, setTelemetryData] = useState<TelemetryRow[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Real-time subscriptions
    const telemetrySubscription = supabase
      .channel('telemetry_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
        (payload) => {
          setTelemetryData(prev => [...prev.slice(-99), payload.new as TelemetryRow]);
          updateMetrics();
        }
      )
      .subscribe();

    const sessionsSubscription = supabase
      .channel('session_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        () => {
          fetchActiveSessions();
        }
      )
      .subscribe();

    // Initial data fetch
    const fetchData = async () => {
      try {
        const { data: telemetry } = await supabase
          .from('telemetry_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        const { data: sessions } = await supabase
          .from('active_sessions')
          .select('*');

        setTelemetryData(telemetry || []);
        setActiveSessions(sessions || []);
        updateMetrics();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveSessions = async () => {
      const { data: sessions } = await supabase
        .from('active_sessions')
        .select('*');
      setActiveSessions(sessions || []);
      updateMetrics();
    };

    const updateMetrics = () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const recentTelemetry = telemetryData.filter(
        row => new Date(row.created_at) > oneHourAgo
      );

      const crashes = recentTelemetry.filter(row => row.event_type === 'CRASH').length;
      const repairs = recentTelemetry.filter(row => row.event_type === 'REPAIR_SUCCESS' || row.event_type === 'REPAIR_FAILED');
      const successfulRepairs = repairs.filter(row => row.success).length;
      const successRate = repairs.length > 0 ? (successfulRepairs / repairs.length) * 100 : 0;

      setMetrics({
        activeSessions: activeSessions.length,
        crashesLastHour: crashes,
        repairSuccessRate: successRate,
        tokenBurnRate: Math.round(recentTelemetry.length * 1.2), // Estimated
      });
    };

    fetchData();

    // Cleanup
    return () => {
      telemetrySubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
    };
  }, [telemetryData, activeSessions]);

  const metricCards: MetricCard[] = [
    {
      title: "Active Sessions",
      value: metrics.activeSessions,
      icon: Users,
      color: "text-blue-400",
    },
    {
      title: "Crashes (1h)",
      value: metrics.crashesLastHour,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "Repair Success Rate",
      value: `${metrics.repairSuccessRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      title: "Token Burn Rate",
      value: `${metrics.tokenBurnRate}/hr`,
      icon: Zap,
      color: "text-yellow-400",
    },
  ];

  // Prepare chart data
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    const hourStart = new Date(hour);
    hourStart.setMinutes(0, 0, 0);
    
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);
    
    const hourTelemetry = telemetryData.filter(
      row => {
        const rowTime = new Date(row.created_at);
        return rowTime >= hourStart && rowTime < hourEnd;
      }
    );

    return {
      hour: hourStart.getHours().toString().padStart(2, '0') + ':00',
      crashes: hourTelemetry.filter(row => row.event_type === 'CRASH').length,
      repairs: hourTelemetry.filter(row => row.event_type.includes('REPAIR')).length,
      sessions: hourTelemetry.filter(row => row.event_type === 'SESSION_START').length,
    };
  });

  const errorData = telemetryData
    .filter(row => row.error_signature)
    .reduce((acc: Array<{ error: string; count: number }>, row) => {
      const existing = acc.find(item => item.error === row.error_signature);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ error: row.error_signature, count: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
        <div className="flex items-center justify-center h-64">
          <Cpu className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricCards.map((card, index) => (
          <div key={index} className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <card.icon className={`w-6 h-6 ${card.color}`} />
              {card.change && (
                <span className={`text-sm ${card.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                  {card.change}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
            <p className="text-sm text-gray-400">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Activity Chart */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">24-Hour Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="hour" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="crashes" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="repairs" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sessions" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Errors */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4">Top Error Signatures</h3>
          {errorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="error" type="category" stroke="#888" width={200} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              No errors in the last 24 hours
            </div>
          )}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Active Sessions ({activeSessions.length})</h3>
        <div className="space-y-2">
          {activeSessions.slice(0, 10).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Session {session.id.slice(0, 8)}</span>
              </div>
              <span className="text-xs text-gray-500">
                Last seen: {new Date(session.last_seen).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {activeSessions.length === 0 && (
            <div className="text-center text-gray-400 py-8">No active sessions</div>
          )}
        </div>
      </div>
    </main>
  );
}
