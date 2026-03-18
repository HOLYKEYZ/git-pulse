"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    HomeIcon, 
    CompassIcon, 
    BellIcon, 
    UserIcon 
} from "lucide-react";

export default function BottomNav({ username }: { username?: string }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", icon: HomeIcon },
        { name: "Discover", href: "/", icon: CompassIcon },
        { name: "Notifications", href: "/notifications", icon: BellIcon },
        ...(username ? [{ name: "Profile", href: `/profile/${username}`, icon: UserIcon }] : []),
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-git-bg/80 backdrop-blur-md border-t border-git-border px-4 py-3 pb-safe">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${
                                isActive ? "text-git-blue" : "text-git-muted hover:text-git-text"
                            }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
