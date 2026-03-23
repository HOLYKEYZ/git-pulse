"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// filled octicon svgs matching the sidebar
function HomeIcon({ active }: { active: boolean }) {
    return active ? (
        <svg height="20" viewBox="0 0 24 24" width="20" className="fill-current">
            <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75h4.75a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z"/>
        </svg>
    ) : (
        <svg height="20" viewBox="0 0 24 24" width="20" className="fill-current">
            <path d="M11.03 2.59a1.501 1.501 0 0 1 1.94 0l7.5 6.363a1.5 1.5 0 0 1 .53 1.144V19.5a1.5 1.5 0 0 1-1.5 1.5h-5.75a.75.75 0 0 1-.75-.75V14h-2v6.25a.75.75 0 0 1-.75.75H4.5A1.5 1.5 0 0 1 3 19.5v-9.403c0-.44.194-.859.53-1.144ZM12 3.734l-7.5 6.363V19.5h5v-6.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v6.25h5v-9.403Z"/>
        </svg>
    );
}

function DiscoverIcon({ active }: { active: boolean }) {
    return (
        <svg height="20" viewBox="0 0 16 16" width="20" className="fill-current" strokeWidth={active ? 0.5 : 0}>
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm8.58-3.845-4.84 2.098a.75.75 0 0 0-.372.371L2.77 11.464a.25.25 0 0 0 .312.312l4.84-2.098a.75.75 0 0 0 .372-.371l2.098-4.84a.25.25 0 0 0-.312-.312ZM8 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
        </svg>
    );
}

function BellIcon({ active }: { active: boolean }) {
    return active ? (
        <svg height="20" viewBox="0 0 16 16" width="20" className="fill-current">
            <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Z"/>
        </svg>
    ) : (
        <svg height="20" viewBox="0 0 16 16" width="20" className="fill-current">
            <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z"/>
        </svg>
    );
}

function UserIcon({ active }: { active: boolean }) {
    return active ? (
        <svg height="20" viewBox="0 0 24 24" width="20" className="fill-current">
            <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
        </svg>
    ) : (
        <svg height="20" viewBox="0 0 24 24" width="20" className="fill-current">
            <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
        </svg>
    );
}

export default function BottomNav({ username }: { username?: string }) {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/", Icon: HomeIcon },
        { name: "Discover", href: "/", Icon: DiscoverIcon },
        { name: "Notifications", href: "/notifications", Icon: BellIcon },
        ...(username ? [{ name: "Profile", href: `/profile/${username}`, Icon: UserIcon }] : []),
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-git-bg/80 backdrop-blur-md border-t border-git-border px-4 py-3 pb-safe">
            <div className="flex justify-around items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${
                                isActive ? "text-git-accent" : "text-git-muted hover:text-git-text"
                            }`}
                        >
                            <item.Icon active={isActive} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
