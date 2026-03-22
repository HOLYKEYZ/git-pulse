import { auth, signOut } from "@/lib/auth";
import Image from "next/image";
import Link from "next/link";
import NotificationBell from "./NotificationBell";

export default async function Sidebar() {
    let session = null;
    try {
        session = await auth();
    } catch {
        // auth() can fail during static generation
    }

    return (
        <aside className="hidden w-[275px] shrink-0 xl:block relative">
            <nav className="fixed w-[275px] top-0 flex flex-col h-screen px-4 pb-4">
                {/* Logo */}
                <div className="py-2">
                    <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-full hover:bg-white/10 transition-colors group">
                        <svg height="30" viewBox="0 0 16 16" width="30" className="fill-git-text group-hover:fill-git-accent transition-colors">
                            <g transform="scale(-1, 1) translate(-16, 0)">
                                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                            </g>
                            <line x1="12" y1="10" x2="16" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </Link>
                </div>

                {/* Nav Links */}
                <div className="flex flex-col gap-1 w-full mt-2">
                    <Link href="/" className="group flex items-center w-fit">
                        <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                            <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current"><path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z"/></svg>
                            <span className="text-xl font-medium text-git-text">Home</span>
                        </div>
                    </Link>
                    
                    {session?.user && (
                        <div className="group flex items-center w-fit">
                            <NotificationBell />
                        </div>
                    )}
                    
                    {session?.user?.login && (
                        <Link href={`/profile/${session.user.login}`} className="group flex items-center w-fit">
                            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                                <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current"><path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/></svg>
                                <span className="text-xl font-medium text-git-text">Profile</span>
                            </div>
                        </Link>
                    )}
                    
                    {session?.user && (
                        <Link href="/settings" className="group flex items-center w-fit">
                            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                                <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current"><path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.386.506.798.704 1.23.315.69.1 1.457-.468 1.878l-.856.614a.254.254 0 0 0-.068.296 6.3 6.3 0 0 1 0 1.146.254.254 0 0 0 .068.296l.856.614c.568.42.783 1.188.468 1.878a8.28 8.28 0 0 1-.704 1.23c-.428.609-1.176.806-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a5.973 5.973 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.17.645-.667 1.186-1.46 1.259a8.09 8.09 0 0 1-1.402 0c-.793-.073-1.29-.614-1.46-1.259l-.288-1.107a.254.254 0 0 0-.212-.224 5.975 5.975 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.279 8.279 0 0 1-.704-1.23c-.315-.69-.1-1.457.468-1.878l.856-.614a.254.254 0 0 0 .068-.296 6.3 6.3 0 0 1 0-1.146.254.254 0 0 0-.068-.296l-.856-.614c-.568-.42-.783-1.188-.468-1.878.198-.432.434-.844.704-1.23.428-.609 1.176-.806 1.82-.63l1.103.303c.066.019.176.011.299-.071.214-.143.437-.272.668-.386a.254.254 0 0 0 .212-.224l.288-1.107C5.56.645 6.107.095 6.9.031 7.243.01 7.622 0 8 0ZM5.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"/></svg>
                                <span className="text-xl font-medium text-git-text">Settings</span>
                            </div>
                        </Link>
                    )}
                    
                    {/* Big Action Post Button */}
                    {session?.user && (
                        <div className="mt-4 px-2 w-[85%]">
                            <button className="w-full bg-git-accent hover:opacity-90 text-white rounded-full py-3.5 px-6 font-bold text-lg shadow-sm transition-colors">
                                Post
                            </button>
                        </div>
                    )}
                </div>

                {/* User Card Pill (X Style) */}
                {session?.user && (
                    <div className="mt-auto mb-2 relative group w-full pr-4">
                        <div className="flex items-center justify-between p-3 rounded-full hover:bg-git-hover transition-colors cursor-pointer w-full mx-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                {session.user.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.login || "User"}
                                        width={40}
                                        height={40}
                                        className="rounded-full flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-git-border flex-shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[15px] font-bold text-git-text truncate leading-tight">
                                        {session.user.name || session.user.login}
                                    </span>
                                    <span className="text-[15px] text-git-muted truncate leading-tight">
                                        @{session.user.login}
                                    </span>
                                </div>
                            </div>
                            <div className="text-git-text flex-shrink-0">
                                <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" className="fill-current"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></svg>
                            </div>
                        </div>

                        {/* Sign out dropdown (hover absolute) */}
                        <div className="absolute bottom-full left-0 w-full pb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <form action={async () => {
                                "use server";
                                await signOut({ redirectTo: "/login" });
                            }}>
                                <button type="submit" className="w-[85%] mx-auto block bg-git-bg border border-git-border shadow-[0_0_15px_rgba(255,255,255,0.1)] rounded-2xl px-4 py-3 text-left text-[15px] font-bold text-git-text hover:bg-git-card transition-colors">
                                    Log out @{session.user.login}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
}
