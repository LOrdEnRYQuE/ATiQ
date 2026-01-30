"use client";

import { useState, useEffect, useLayoutEffect } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  autoHide?: boolean;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useLayoutEffect(() => {
    // Simulate some initial notifications
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'info',
        title: 'System Update',
        message: 'Admin panel v2.0 is now available',
        timestamp: new Date().toISOString(),
        read: false,
        autoHide: true
      },
      {
        id: '2', 
        type: 'success',
        title: 'Database Synced',
        message: 'All telemetry data successfully synced',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      }
    ];

    // Update both states in a single batch to prevent cascading renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setNotifications(initialNotifications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setUnreadCount(initialNotifications.filter(n => !n.read).length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNotifications(prev => {
        const updated = prev.map(n => {
          if (n.autoHide && !n.read) {
            return { ...n, read: true };
          }
          return n;
        });
        
        // Update unread count in the same render
        const newUnreadCount = updated.filter(n => !n.read).length;
        setUnreadCount(newUnreadCount);
        
        return updated;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Bell;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg hover:bg-[#111] transition-colors"
        >
          <Bell className="w-5 h-5 text-gray-400 hover:text-white" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-12 w-96 bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#222]">
                <h3 className="font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-2 p-2">
                    {notifications.map((notification) => {
                      const Icon = getIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-[#111] ${
                            notification.read ? 'opacity-60' : ''
                          } ${getBgColor(notification.type)}`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${getIconColor(notification.type)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-sm font-medium text-white truncate">
                                  {notification.title}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                  className="p-1 hover:bg-[#222] rounded transition-colors"
                                >
                                  <X className="w-3 h-3 text-gray-400" />
                                </button>
                              </div>
                              <p className="text-xs text-gray-300 mb-1">{notification.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-[#222] text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Close notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
