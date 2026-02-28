"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock } from "lucide-react";
import { userApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  type: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { on, off } = useSocket();

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications via Socket.IO
    const handleNotification = (data: unknown) => {
      const notifData = data as { type: string; message: string; data?: Record<string, unknown> };
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: notifData.type,
        message: notifData.message,
        data: notifData.data || null,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      toast.success(notifData.message, {
        icon: getNotificationIcon(notifData.type),
        duration: 4000,
      });
    };

    on("notification", handleNotification);

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      off("notification", handleNotification);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [on, off]);

  const fetchNotifications = async () => {
    try {
      const response = await userApi.getNotifications();
      const notifs = response.data?.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await userApi.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter((n) => !n.read);
      await Promise.all(unreadNotifs.map((n) => userApi.markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ride_accepted":
        return "🚗";
      case "ride_completed":
        return "✅";
      case "payment_received":
        return "💰";
      case "driver_arriving":
        return "🚕";
      case "sos_alert":
        return "🚨";
      default:
        return "📬";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-cyber-green-500 hover:text-cyber-green-400 hover:drop-shadow-[0_0_8px_rgba(0,255,159,0.6)] transition-all duration-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-cyber-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-neon-pink animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-cyber-dark-900 border-2 border-cyber-purple-500/30 rounded-xl shadow-2xl shadow-cyber-purple-500/20 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-purple-500/20">
            <h3 className="font-semibold font-orbitron text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-cyber-purple-400 hover:text-cyber-purple-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-cyber-purple-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-cyber-purple-500/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    className={`p-4 hover:bg-cyber-purple-500/10 cursor-pointer transition-colors ${
                      !notification.read ? "bg-cyber-purple-500/5" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            !notification.read
                              ? "text-white font-medium"
                              : "text-cyber-purple-300"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-cyber-purple-400" />
                          <span className="text-xs text-cyber-purple-400">
                            {formatTime(notification.created_at)}
                          </span>
                          {!notification.read && (
                            <span className="ml-auto w-2 h-2 bg-cyber-green-500 rounded-full shadow-neon-green"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-cyber-purple-500/20 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if exists
                }}
                className="text-xs text-cyber-purple-400 hover:text-cyber-purple-300 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
