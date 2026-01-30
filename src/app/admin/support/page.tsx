"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Search, Eye, RefreshCw, MessageSquare, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";

interface SupportTicket {
  id: string;
  user_id: string;
  session_id: string;
  issue_type: 'CRASH' | 'BUG' | 'FEATURE_REQUEST' | 'HELP';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  admin_notes: string;
  created_at: string;
  updated_at: string;
  resolved_by?: string;
  user_email?: string;
}

interface TelemetryLog {
  id: string;
  user_id: string;
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  error_signature: string;
  model_used: string;
  success: boolean;
  duration_ms: number;
  created_at: string;
}

interface ActiveSession {
  id: string;
  user_id: string;
  session_id: string;
  last_seen: string;
  metadata: Record<string, unknown>;
}

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, telemetryRes, sessionsRes] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*, user_profiles!inner(email)')
          .order('created_at', { ascending: false }),
        supabase
          .from('telemetry_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('active_sessions')
          .select('*')
          .order('last_seen', { ascending: false })
      ]);

      if (ticketsRes.data) {
        const ticketsWithEmail = ticketsRes.data.map(ticket => ({
          ...ticket,
          user_email: ticket.user_profiles?.email
        }));
        setTickets(ticketsWithEmail);
      }
      
      setTelemetryLogs(telemetryRes.data || []);
      setActiveSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed', adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ 
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
          resolved_by: status === 'resolved' ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', ticketId);

      if (error) throw error;

      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status, admin_notes: adminNotes || t.admin_notes } : t
      ));
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const getSessionTelemetry = (sessionId: string) => {
    return telemetryLogs.filter(log => log.session_id === sessionId);
  };

  const resetUserSession = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user session? This will force them to restart.')) return;

    try {
      // Delete active sessions for this user
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Log the reset action
      await supabase
        .from('telemetry_logs')
        .insert({
          user_id: userId,
          session_id: 'admin_reset',
          event_type: 'SESSION_RESET',
          event_data: { reset_by: 'admin' },
          created_at: new Date().toISOString()
        });

      await fetchData();
      alert('User session reset successfully');
    } catch (error) {
      console.error('Error resetting session:', error);
      alert('Error resetting session');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-400 bg-red-500/10';
      case 'in_progress': return 'text-yellow-400 bg-yellow-500/10';
      case 'resolved': return 'text-green-400 bg-green-500/10';
      case 'closed': return 'text-gray-400 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      case 'low': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

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
          <MessageSquare className="w-8 h-8 text-purple-400" />
          Ghost Mode Support
        </h1>
        <p className="text-gray-400">Session replay, crash inspection, and remote support tools</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg focus:border-purple-500 outline-none"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Tickets */}
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="p-4 bg-[#0a0a0a] rounded-lg border border-[#333] hover:border-purple-500/60 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{ticket.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{ticket.user_email}</span>
                    <span>{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              
              {filteredTickets.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No tickets found matching your criteria
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {/* Ticket Details */}
          {selectedTicket && (
            <div className="bg-[#111] border border-[#222] rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Ticket Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <p className="font-medium">{selectedTicket.title}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Description</label>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">User</label>
                    <p className="text-sm">{selectedTicket.user_email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Session ID</label>
                    <p className="text-sm font-mono">{selectedTicket.session_id.slice(0, 8)}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Admin Notes</label>
                  <textarea
                    value={selectedTicket.admin_notes || ""}
                    onChange={(e) => {
                      const updated = { ...selectedTicket, admin_notes: e.target.value };
                      setSelectedTicket(updated);
                    }}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-sm focus:border-purple-500 outline-none h-20"
                    placeholder="Add notes about this ticket..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'resolved', selectedTicket.admin_notes)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Resolved
                    </button>
                  )}
                  
                  {selectedTicket.status === 'open' && (
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress', selectedTicket.admin_notes)}
                      className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
                    >
                      <Clock className="w-4 h-4" />
                      In Progress
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Sessions */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4">Active Sessions ({activeSessions.length})</h3>
            
            <div className="space-y-3">
              {activeSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono">{session.session_id.slice(0, 8)}</span>
                    <button
                      onClick={() => resetUserSession(session.user_id)}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      title="Reset Session"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    Last seen: {new Date(session.last_seen).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {activeSessions.length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No active sessions
                </div>
              )}
            </div>
          </div>

          {/* Recent Crashes */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Recent Crashes
            </h3>
            
            <div className="space-y-3">
              {telemetryLogs
                .filter(log => log.event_type === 'CRASH')
                .slice(0, 5)
                .map((crash) => (
                  <div key={crash.id} className="p-3 bg-[#0a0a0a] rounded-lg border border-[#333]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">{crash.session_id.slice(0, 8)}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(crash.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-red-400 font-mono truncate">
                      {crash.error_signature}
                    </div>
                  </div>
                ))}
              
              {telemetryLogs.filter(log => log.event_type === 'CRASH').length === 0 && (
                <div className="text-center text-gray-400 py-4">
                  No recent crashes
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
