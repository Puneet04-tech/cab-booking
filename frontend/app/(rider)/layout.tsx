"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Car,
  LayoutDashboard,
  MapPin,
  ClockIcon,
  CreditCard,
  User,
  HelpCircle,
  Menu,
  X,
  LogOut,
  Leaf,
  Star,
  Heart,
  Settings,
} from "lucide-react";
import NotificationDropdown from "@/components/shared/NotificationDropdown";

const navItems = [
  { href: "/",              label: "Home",          icon: Car              },
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/booking",       label: "Book a Ride",   icon: MapPin           },
  { href: "/history",       label: "Ride History",  icon: ClockIcon        },
  { href: "/favorites",     label: "Favorites",     icon: Heart            },
  { href: "/ecostats",      label: "Eco Stats",     icon: Leaf             },
  { href: "/achievements",  label: "Achievements",  icon: Star             },
  { href: "/preferences",   label: "Preferences",   icon: Settings         },
  { href: "/payment",       label: "Payments",      icon: CreditCard       },
  { href: "/profile",       label: "Profile",       icon: User             },
  { href: "/support",       label: "Support",       icon: HelpCircle       },
  { href: "/drivers",       label: "Drivers",       icon: Car             },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function signOut() {
    document.cookie = "auth_token=; path=/; max-age=0";
    router.push("/sign-in");
  }

  return (
    <div className="flex h-screen bg-cyber-dark-900 overflow-hidden">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-cyber-dark-800/90 border-r border-cyber-purple-500/30
                    flex flex-col transition-transform duration-300 backdrop-blur-md
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ boxShadow: '0 0 30px rgba(123, 63, 242, 0.2)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-cyber-purple-500/30">
          <div className="w-9 h-9 bg-cyber-purple-500 rounded-lg flex items-center justify-center shadow-neon">
            <Car className="w-5 h-5 text-cyber-green-500" />
          </div>
          <span className="text-xl font-bold text-cyber-green-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(0, 255, 159, 0.7)' }}>RideSwift</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-link ${active ? "active" : ""}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-6 py-4 border-t border-cyber-purple-500/30 flex items-center gap-3">
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-lg bg-cyber-dark-700 hover:bg-cyber-pink-500/20 hover:text-cyber-pink-500 flex items-center justify-center transition-all duration-300 border border-cyber-pink-500/30 text-cyber-green-500"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-cyber-purple-400">Signed in as</p>
            <p className="text-sm font-medium text-cyber-green-500 truncate">Rider Account</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-cyber-dark-800/80 border-b border-cyber-purple-500/30 px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0 backdrop-blur-md">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-cyber-purple-500/20 transition-colors text-cyber-green-500 border border-cyber-purple-500/30"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-cyber-purple-600" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 10px rgba(123, 63, 242, 0.7)' }}>
              {navItems.find((n) => pathname.startsWith(n.href))?.label ?? "Dashboard"}
            </h1>
          </div>
          <NotificationDropdown />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 cyber-grid">{children}</main>
      </div>
    </div>
  );
}
