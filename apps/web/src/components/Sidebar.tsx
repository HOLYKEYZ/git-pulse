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
                {/* logo — github filled octicon mark */}
                <div className="py-2">
                    <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-full hover:bg-white/10 transition-colors group">
                        <svg height="30" viewBox="0 0 16 16" width="30" className="fill-git-text group-hover:fill-git-accent transition-colors">
                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/>
                        </svg>
                    </Link>
                </div>

                {/* nav links — filled octicon svgs */}
                <div className="flex flex-col gap-1 w-full mt-2">
                    <Link href="/" className="group flex items-center w-fit">
                        <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                            <svg height="26" viewBox="0 0 24 24" width="26" className="fill-current">
                                <path d="M12.97 2.59a1.5 1.5 0 0 0-1.94 0l-7.5 6.363A1.5 1.5 0 0 0 3 10.097V19.5A1.5 1.5 0 0 0 4.5 21h4.75a.75.75 0 0 0 .75-.75V14h4v6.25c0 .414.336.75.75.75h4.75a1.5 1.5 0 0 0 1.5-1.5v-9.403a1.5 1.5 0 0 0-.53-1.144l-7.5-6.363Z"/>
                            </svg>
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
                                <svg height="26" viewBox="0 0 24 24" width="26" className="fill-current">
                                    <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"/>
                                </svg>
                                <span className="text-xl font-medium text-git-text">Profile</span>
                            </div>
                        </Link>
                    )}
                    
                    {session?.user && (
                        <Link href="/settings" className="group flex items-center w-fit">
                            <div className="flex items-center gap-5 px-4 py-3 rounded-full hover:bg-git-hover transition-colors">
                                <svg height="26" viewBox="0 0 24 24" width="26" className="fill-current">
                                    <path d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-1.5 0a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
                                    <path d="M12 1c.266 0 .532.009.797.028.763.055 1.345.617 1.512 1.304l.352 1.45c.019.078.09.171.225.221.247.089.49.19.728.302.13.061.246.044.315.002l1.275-.776c.603-.368 1.411-.353 1.99.147.403.348.78.726 1.128 1.129.501.578.515 1.386.147 1.99l-.776 1.274c-.042.069-.059.185.002.315.112.238.213.481.303.728.048.135.142.205.22.225l1.45.352c.687.167 1.249.749 1.303 1.512.038.531.038 1.063 0 1.594-.054.763-.616 1.345-1.303 1.512l-1.45.352c-.078.019-.172.09-.22.225-.09.247-.191.49-.303.728-.061.13-.044.246-.002.315l.776 1.275c.368.603.354 1.411-.147 1.99-.348.403-.726.78-1.128 1.128-.579.501-1.387.515-1.99.147l-1.275-.776c-.069-.042-.185-.059-.315.002a8.606 8.606 0 0 1-.728.302c-.135.049-.206.143-.225.221l-.352 1.45c-.167.687-.749 1.249-1.512 1.303a11.539 11.539 0 0 1-1.594 0c-.763-.054-1.345-.616-1.512-1.303l-.352-1.45c-.019-.078-.09-.172-.225-.22a8.55 8.55 0 0 1-.728-.303c-.13-.061-.246-.044-.315-.002l-1.275.776c-.603.368-1.411.354-1.99-.147a10.138 10.138 0 0 1-1.128-1.129c-.501-.578-.515-1.386-.147-1.99l.776-1.274c.042-.069.059-.185-.002-.315a8.606 8.606 0 0 1-.303-.728c-.048-.135-.142-.205-.22-.225l-1.45-.352c-.687-.167-1.249-.749-1.304-1.512a11.539 11.539 0 0 1 0-1.594c.055-.763.617-1.345 1.303-1.512l1.45-.352c.078-.019.172-.09.221-.225.089-.247.19-.49.302-.728.061-.13.044-.246.002-.315L2.752 8.22c-.368-.603-.354-1.412.147-1.99.348-.403.726-.78 1.128-1.129.579-.5 1.387-.515 1.99-.147l1.275.776c.069.042.185.06.315-.002.238-.112.481-.213.728-.303.135-.048.205-.142.225-.22l.352-1.45c.167-.687.749-1.25 1.512-1.304A11.539 11.539 0 0 1 12 1Z"/>
                                </svg>
                                <span className="text-xl font-medium text-git-text">Settings</span>
                            </div>
                        </Link>
                    )}
                    
                    {/* post button */}
                    {session?.user && (
                        <div className="mt-4 px-2 w-[85%]">
                            <button className="w-full bg-git-accent hover:opacity-90 text-white rounded-full py-3.5 px-6 font-bold text-lg shadow-sm transition-colors">
                                Post
                            </button>
                        </div>
                    )}
                </div>

                {/* user card pill */}
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

                        {/* sign out dropdown */}
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
