"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Rocket, TrendingUp, Users, Activity, AlertTriangle, Zap, Target, Flame } from "lucide-react";

interface LaunchMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  crashesPerMinute: number;
  avgResponseTime: number;
  successRate: number;
  tokensUsed: number;
  featureAdoption: Record<string, number>;
}

interface TimeSeriesData {
  time: string;
  users: number;
  sessions: number;
  crashes: number;
  tokens: number;
}

export default function LaunchDayWarRoom() {
  const [metrics, setMetrics] = useState<LaunchMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    crashesPerMinute: 0,
    avgResponseTime: 0,
    successRate: 0,
    tokensUsed: 0,
    featureAdoption: {}
  });
  
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [launchTime] = useState(() => new Date('2026-01-30T04:15:00.000Z'));
  const [timeSinceLaunch, setTimeSinceLaunch] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    
    const updateMetrics = async () => {
      try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        // Get real-time metrics with error handling
        let activeSessions = [];
        let recentTelemetry = [];
        let allTelemetry = [];

        try {
          const { data } = await supabase.from('active_sessions').select('*');
          activeSessions = data || [];
        } catch (error) {
          console.warn('Failed to fetch active sessions:', error);
          setDbError(true);
          return;
        }

        try {
          const { data } = await supabase
            .from('telemetry_logs')
            .select('*')
            .gte('created_at', oneHourAgo.toISOString());
          recentTelemetry = data || [];
        } catch (error) {
          console.warn('Failed to fetch recent telemetry:', error);
          setDbError(true);
          return;
        }

        try {
          const { data } = await supabase
            .from('telemetry_logs')
            .select('*')
            .gte('created_at', launchTime.toISOString());
          allTelemetry = data || [];
        } catch (error) {
          console.warn('Failed to fetch all telemetry:', error);
          setDbError(true);
          return;
        }

        // Reset error state if successful
        setDbError(false);

        const uniqueUsers = new Set(allTelemetry?.map(t => t.user_id).filter(Boolean) || []).size;
        const crashes = recentTelemetry?.filter(t => t.event_type === 'CRASH').length || 0;
        const repairs = recentTelemetry?.filter(t => t.event_type.includes('REPAIR')) || [];
        const successfulRepairs = repairs.filter(t => t.success).length;
        const totalTokens = allTelemetry?.reduce((sum, t) => sum + (t.event_data as any)?.tokens || 0, 0) || 0;

        // Calculate feature adoption
        const featureUsage = allTelemetry?.filter(t => t.event_type === 'FEATURE_USED') || [];
        const featureAdoption = featureUsage.reduce((acc, t) => {
          const feature = (t.event_data as any)?.feature;
          if (feature) {
            acc[feature] = (acc[feature] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        setMetrics({
          totalUsers: uniqueUsers,
          activeUsers: activeSessions?.length || 0,
          totalSessions: allTelemetry?.filter(t => t.event_type === 'SESSION_START').length || 0,
          crashesPerMinute: crashes,
          avgResponseTime: repairs.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / Math.max(repairs.length, 1),
          successRate: repairs.length > 0 ? (successfulRepairs / repairs.length) * 100 : 100,
          tokensUsed: totalTokens,
          featureAdoption
        });

        // Update time series data
        const timeData = Array.from({ length: 60 }, (_, i) => {
          const time = new Date(now.getTime() - (59 - i) * 60 * 1000);
          const timeStart = new Date(time);
          timeStart.setSeconds(0, 0);
          
          const periodTelemetry = allTelemetry?.filter(telemetryItem => {
            const itemTime = new Date(telemetryItem.created_at);
            return itemTime >= timeStart && itemTime < new Date(timeStart.getTime() + 60 * 1000);
          }) || [];

          return {
            time: timeStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            users: new Set(periodTelemetry.map(t => t.user_id).filter(Boolean)).size,
            sessions: periodTelemetry.filter(t => t.event_type === 'SESSION_START').length,
            crashes: periodTelemetry.filter(t => t.event_type === 'CRASH').length,
            tokens: periodTelemetry.reduce((sum, t) => sum + (t.event_data as any)?.tokens || 0, 0)
          };
        });

        setTimeSeriesData(timeData);
      } catch (error) {
        console.error('Error updating launch metrics:', error);
        setDbError(true);
      }
    };
    
    // Real-time subscriptions for launch monitoring
    const subscriptions = [
      supabase
        .channel('launch_metrics')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'telemetry_logs' },
          updateMetrics
        ),
      supabase
        .channel('launch_sessions')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'active_sessions' },
          updateMetrics
        )
    ];

    subscriptions.forEach(sub => sub.subscribe());

    // Update time since launch
    const timeInterval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - launchTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeSinceLaunch(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    updateMetrics();
    const metricsInterval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
      clearInterval(timeInterval);
      clearInterval(metricsInterval);
    };
  }, [launchTime]);

  const getHealthStatus = () => {
    if (dbError) return { status: 'DB Error', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (metrics.crashesPerMinute > 10) return { status: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (metrics.crashesPerMinute > 5) return { status: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    if (metrics.successRate < 90) return { status: 'Warning', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { status: 'Healthy', color: 'text-green-400', bg: 'bg-green-500/10' };
  };

  const healthStatus = getHealthStatus();

  return (
    <main className="p-8">
      {/* Launch Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Rocket className="w-8 h-8 text-purple-400 animate-pulse" />
          <h1 className="text-4xl font-bold">Launch Day War Room</h1>
          <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
        </div>
        <div className="flex items-center justify-center gap-6 text-sm">
          <span className="text-gray-400">Launch Time: {launchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
          {isClient && <span className="text-purple-400 font-mono">{timeSinceLaunch}</span>}
          <div className={`px-3 py-1 rounded-full ${healthStatus.bg} ${healthStatus.color}`}>
            {healthStatus.status}
          </div>
        </div>
      </header>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold">Total Users</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{metrics.totalUsers}</div>
          <div className="text-sm text-gray-400">{metrics.activeUsers} active now</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold">Success Rate</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{metrics.successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-400">AI repair success</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold">Crashes/Min</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{metrics.crashesPerMinute}</div>
          <div className="text-sm text-gray-400">Last hour</div>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-semibold">Tokens Used</h3>
          </div>
          <div className="text-3xl font-bold mb-2">{(metrics.tokensUsed / 1000).toFixed(1)}K</div>
          <div className="text-sm text-gray-400">Since launch</div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Activity Chart */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            User Activity (Last 60 Min)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Area type="monotone" dataKey="sessions" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System Health Chart */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            System Health
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="crashes" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tokens" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature Adoption */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Feature Adoption</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.featureAdoption).map(([feature, count]) => (
            <div key={feature} className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <div className="text-2xl font-bold mb-1">{count}</div>
              <div className="text-sm text-gray-400">{feature}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
