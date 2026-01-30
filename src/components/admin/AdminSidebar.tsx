"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Activity, 
  GitBranch, 
  Power, 
  MessageSquare, 
  Rocket,
  Menu,
  X,
  Settings,
  LogOut
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  description?: string;
}

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Admin overview"
  },
  {
    href: "/admin/pulse",
    label: "Live Pulse",
    icon: Activity,
    description: "Real-time metrics"
  },
  {
    href: "/admin/pulse/warroom",
    label: "War Room",
    icon: Rocket,
    badge: "🚀",
    description: "Launch monitoring"
  },
  {
    href: "/admin/prompts",
    label: "Prompt Lab",
    icon: GitBranch,
    description: "A/B testing"
  },
  {
    href: "/admin/switchboard",
    label: "Switchboard",
    icon: Power,
    description: "Feature flags"
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: MessageSquare,
    description: "User assistance"
  }
];

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === href || pathname === "/admin/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 h-full bg-[#0a0a0a] border-r border-[#222] transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64' : 'w-0 lg:w-64'}
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#222]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">ATiQ Admin</h1>
                <p className="text-xs text-gray-400">Control Tower</p>
              </div>
            </div>
            
            {/* Mobile close button */}
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-[#111] transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${active 
                      ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' 
                      : 'hover:bg-[#111] text-gray-300 hover:text-white'
                    }
                  `}
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 ${active ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'}`} />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 text-xs">{item.badge}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-medium truncate ${active ? 'text-purple-400' : 'text-gray-300 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                      {active && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#222] space-y-2">
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#111] text-gray-300 hover:text-white transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Settings</span>
            </Link>
            
            <button
              onClick={() => {
                // Handle logout
                window.location.href = '/login';
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-gray-300 hover:text-red-400 transition-all duration-200 w-full"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* Mobile menu button */
export function AdminSidebarToggle({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-[#0a0a0a] border border-[#222] rounded-lg hover:bg-[#111] transition-colors"
    >
      {isOpen ? (
        <X className="w-5 h-5 text-white" />
      ) : (
        <Menu className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
