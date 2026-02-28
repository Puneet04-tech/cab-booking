"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, LayoutDashboard, DollarSign, Star, Settings, Menu, X, ToggleLeft, ToggleRight, LogOut } from "lucide-react";
import NotificationDropdown from "@/components/shared/NotificationDropdown";

const navItems = [
  { href: "/",                  label: "Home",       icon: Car             },
  { href: "/driver/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver/earnings",  label: "Earnings",  icon: DollarSign      },
  { href: "/driver/ratings",   label: "Ratings",   icon: Star            },
  { href: "/driver/settings",  label: "Settings",  icon: Settings        },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  function signOut() {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/sign-in");
  }

  return (
    <div className="flex h-screen bg-cyber-dark-900 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-cyber-dark-800/90 flex flex-col transition-transform duration-300 border-r border-cyber-green-500/30 backdrop-blur-md
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ boxShadow: '0 0 30px rgba(0, 255, 159, 0.2)' }}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-cyber-green-500/30">
          <div className="w-9 h-9 bg-cyber-green-500 rounded-lg flex items-center justify-center shadow-neon-green">
            <Car className="w-5 h-5 text-cyber-dark-900" />
          </div>
          <div>
            <span className="text-lg font-bold text-cyber-green-500 block" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(0, 255, 159, 0.7)' }}>RideSwift</span>
            <span className="text-xs text-cyber-purple-400">Driver Portal</span>
          </div>
        </div>

        {/* Online Toggle */}
        <div className="mx-4 my-4 p-3 bg-cyber-dark-700/50 rounded-lg border border-cyber-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>Status</p>
              <p className={`text-xs ${isOnline ? "text-cyber-green-500" : "text-cyber-purple-400"}`} style={{ textShadow: isOnline ? '0 0 5px rgba(0, 255, 159, 0.5)' : 'none' }}>
                {isOnline ? "Online – Accepting Rides" : "Offline"}
              </p>
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className={`transition-all duration-300 ${isOnline ? 'text-cyber-green-500' : 'text-cyber-purple-400'}`}>
              {isOnline ? <ToggleRight className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 255, 159, 0.7))' }} /> : <ToggleLeft className="w-8 h-8" />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 border
                  ${active ? "bg-cyber-green-500/20 text-cyber-green-500 border-cyber-green-500 shadow-neon-green" : "text-cyber-green-500/70 border-transparent hover:bg-cyber-green-500/10 hover:text-cyber-green-500 hover:border-cyber-green-500/50"}`}
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-cyber-green-500/30 flex items-center gap-3">
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-lg bg-cyber-dark-700 hover:bg-cyber-pink-500/20 hover:text-cyber-pink-500 flex items-center justify-center transition-all duration-300 text-cyber-green-500 border border-cyber-pink-500/30"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-cyber-purple-400">Signed in as</p>
            <p className="text-sm font-medium text-cyber-green-500">Driver Account</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-cyber-dark-800/80 border-b border-cyber-green-500/30 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0 backdrop-blur-md">
          <button className="lg:hidden p-2 rounded-lg hover:bg-cyber-green-500/20 text-cyber-green-500 border border-cyber-green-500/30" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-3">
            <span className={`badge ${isOnline ? "badge-success" : "badge-warning"}`}>
              {isOnline ? "● Online" : "● Offline"}
            </span>
          </div>
          <NotificationDropdown />
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 cyber-grid">{children}</main>
      </div>
    </div>
  );
}
