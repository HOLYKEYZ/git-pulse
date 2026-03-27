"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource("/api/notifications/stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        } catch {

          // ignore parse errors
        }};

      eventSource.onerror = () => {
        // close and rely on browser or logic to reconnect if needed, or just fail silently
        eventSource?.close();
      };
    } catch {

      // silently ignore if eventsource fails
    }
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return (
    <Link
      href="/notifications"
      className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors w-full group">
      
            <div className="relative">
                <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current text-git-text">
                    <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
                </svg>
                {unreadCount > 0 &&
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-git-accent text-white text-[11px] font-bold px-1 border-2 border-git-bg">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
        }
            </div>
            <span className="text-xl font-medium text-git-text">Notifications</span>
        </Link>);

}