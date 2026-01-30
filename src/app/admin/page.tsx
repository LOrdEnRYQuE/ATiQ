"use client";

import Link from "next/link";
import { Activity, Zap, Settings, Users } from "lucide-react";
import AdminNotifications from "@/components/admin/AdminNotifications";
import QuickActions from "@/components/admin/QuickActions";

export default function AdminDashboard() {
  const sections = [
    {
      href: "/admin/pulse",
      title: "Live Pulse",
      description: "Real-time crash/repair metrics and active sessions",
      icon: Activity,
    },
    {
      href: "/admin/prompts",
      title: "Prompt Lab",
      description: "Edit, version, and A/B test system prompts",
      icon: Zap,
    },
    {
      href: "/admin/switchboard",
      title: "Switchboard",
      description: "Feature flags and global configuration",
      icon: Settings,
    },
    {
      href: "/admin/support",
      title: "Support",
      description: "Session replay and remote reset tools",
      icon: Users,
    },
  ];

  return (
    <main className="p-8">
      {/* Header with notifications */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold mb-2">ATiQ Admin</h1>
          <p className="text-gray-400">Control tower for the self-healing AI IDE</p>
        </div>
        <AdminNotifications />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main sections */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map(({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group block bg-[#111] border border-[#222] rounded-xl p-6 hover:border-purple-500/60 transition-all hover:shadow-lg hover:shadow-purple-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold mb-1 group-hover:text-purple-400 transition-colors">
                      {title}
                    </h2>
                    <p className="text-sm text-gray-400">{description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div>
          <QuickActions />
        </div>
      </div>
    </main>
  );
}
