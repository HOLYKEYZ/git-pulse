"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, HomeIcon } from "@primer/octicons-react";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on desktop where sidebar is present, just mobile
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-git-border bg-git-bg/90 backdrop-blur-md lg:hidden">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-git-text hover:text-git-accent transition-colors p-1"
        aria-label="Go back"
      >
        <ArrowLeftIcon size={20} />
      </button>

      <span className="font-bold text-[15px] truncate max-w-[150px]">
        {pathname === "/" ? "Home" : 
         pathname.startsWith("/profile/") ? pathname.split("/").pop() : 
         pathname.startsWith("/explore") ? "Explore" : 
         pathname.startsWith("/notifications") ? "Notifications" : 
         pathname.startsWith("/post/") ? "Post" : 
         "GitPulse"}
      </span>

      <Link 
        href="/"
        className="flex items-center gap-2 text-git-text hover:text-git-accent transition-colors p-1"
        aria-label="Go home"
      >
        <HomeIcon size={20} />
      </Link>
    </div>
  );
}
