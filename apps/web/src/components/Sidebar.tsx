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
                                <svg height="26" viewBox="0 0 16 16" width="26" className="fill-current">
                                    <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.04.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.103-.303c-.066-.019-.176-.011-.299.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.212.224l-.288 1.107c-.169.645-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.067-.079-.159-.211-.225a5.918 5.918 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.02-1.82-.63a8.004 8.004 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.049-.048.098-.147.088-.294a6.857 6.857 0 0 1 0-.772c.01-.147-.04-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.103.303c.066.019.176.011.299-.071.214-.143.437-.272.668-.386.133-.066.194-.158.212-.224L5.84 1.29c.17-.645.715-1.196 1.458-1.26A8.2 8.2 0 0 1 8 0ZM5.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0Z"></path>
                                </svg>
                                <span className="text-xl font-medium text-git-text">Settings</span>
                            </div>
                        </Link>
                    )}
                    
                    {/* post button */}
                    {session?.user && (
                        <div className="mt-4 px-2 mb-2">
                            <Link href="/home" className="w-[60%] lg:w-[120px] bg-git-accent hover:opacity-90 text-white rounded-full py-2 px-4 font-semibold text-sm shadow-sm transition-colors flex items-center justify-center">
                                Post
                            </Link>
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
