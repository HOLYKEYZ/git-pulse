"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";

interface Notification {
    id: string;
    type: string;
    message: string;
    read: boolean;
    linkUrl: string | null;
    createdAt: string;
}

const TYPE_ICONS: Record<string, string> = {
    TRENDING: "🔥",
    BADGE: "✅",
    FOLLOW: "👤",
    SYSTEM: "📢",
};

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.read).length;

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch {
            // silently fail
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        } catch {
            // silently fail
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setOpen(!open);
                    if (!open) fetchNotifications();
                }}
                className="relative w-full"
            >
                <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-[#181818] transition-colors">
                    <div className="relative">
                        <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current text-git-text">
                            <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#1d9bf0] text-white text-[11px] font-bold px-1 border-2 border-black">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-xl font-medium text-git-text">Notifications</span>
                </div>
            </button>

            {open && (
                <div className="absolute left-full ml-2 top-0 w-[360px] max-h-[480px] overflow-y-auto bg-[#16181c] border border-[#2f3336] rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.1)] z-50 animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f3336]">
                        <span className="text-[15px] font-bold text-git-text">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="text-[13px] text-[#1d9bf0] hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-12 text-center text-[15px] text-git-muted">
                            No notifications yet.
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((n) => {
                                const inner = (
                                    <div
                                        className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-[#2f3336] last:border-b-0 ${
                                            !n.read ? "bg-[#1d9bf0]/5" : ""
                                        }`}
                                    >
                                        <span className="text-lg shrink-0 mt-0.5">
                                            {TYPE_ICONS[n.type] || "📢"}
                                        </span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[15px] text-git-text leading-snug">
                                                {n.message}
                                            </span>
                                            <span className="text-[13px] text-git-muted mt-0.5">
                                                {getRelativeTime(n.createdAt)}
                                            </span>
                                        </div>
                                        {!n.read && (
                                            <span className="w-2 h-2 rounded-full bg-[#1d9bf0] shrink-0 mt-1.5 ml-auto" />
                                        )}
                                    </div>
                                );

                                return n.linkUrl ? (
                                    <li key={n.id}>
                                        <Link href={n.linkUrl} onClick={() => setOpen(false)}>
                                            {inner}
                                        </Link>
                                    </li>
                                ) : (
                                    <li key={n.id}>{inner}</li>
                                );
                            })}
                        </ul>
                    )}

                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className="block text-center text-[13px] text-[#1d9bf0] py-3 border-t border-[#2f3336] hover:bg-white/[0.03] transition-colors rounded-b-2xl"
                    >
                        View all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}
