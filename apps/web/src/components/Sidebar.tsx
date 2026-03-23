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
                                    <path d="M11.972 1.996C10.59 1.996 9.4 2.871 9.04 4.195l-.234.86a2.498 2.498 0 0 1-1.353 1.625l-.803.385a2.5 2.5 0 0 1-2.096-.05l-.794-.436C2.56 6.027 1.096 6.845 1.096 8.216c0 .546.185 1.076.536 1.492l.568.673c.53.626.732 1.488.549 2.29l-.208.913a2.499 2.499 0 0 1-1.091 1.547l-.76.471C-.416 16.284-.416 17.716.69 18.402l.76.471a2.499 2.499 0 0 1 1.091 1.547l.208.913c.183.802-.019 1.664-.549 2.29l-.568.673c-.351.416-.536.946-.536 1.492 0 1.371 1.464 2.189 2.664 1.637l.794-.436a2.5 2.5 0 0 1 2.096-.05l.803.385c.66.316 1.157.886 1.353 1.625l.234.86c.36 1.324 1.55 2.199 2.932 2.199h.056c1.382 0 2.572-.875 2.932-2.199l.234-.86c.196-.739.693-1.309 1.353-1.625l.803-.385a2.502 2.502 0 0 1 2.096.05l.794.436c1.2.552 2.664-.266 2.664-1.637 0-.546-.185-1.076-.536-1.492l-.568-.673a2.5 2.5 0 0 1-.548-2.29l.207-.913a2.499 2.499 0 0 1 1.092-1.547l.76-.471c1.106-.686 1.106-2.118 0-2.804l-.76-.471a2.498 2.498 0 0 1-1.092-1.547l-.207-.913c-.184-.802.018-1.664.548-2.29l.568-.673c.351-.416.536-.946.536-1.492 0-1.371-1.464-2.189-2.664-1.637l-.794.436a2.5 2.5 0 0 1-2.096.05l-.803-.385a2.5 2.5 0 0 1-1.353-1.625l-.234-.86C14.544 2.871 13.354 1.996 11.972 1.996Zm0 1.5c.783 0 1.46.5 1.667 1.259l.234.861c.325 1.192 1.154 2.128 2.246 2.651l.803.385a4.004 4.004 0 0 0 3.353-.08l.795-.436c.683-.314 1.488.136 1.488.884 0 .285-.098.56-.279.775l-.568.673c-.858 1.016-1.185 2.41-.888 3.708l.207.913c.254 1.118.847 2.106 1.748 2.666l.76.471c.628.389.628 1.173 0 1.562l-.76.471a4.001 4.001 0 0 0-1.748 2.666l-.207.913a4.002 4.002 0 0 0 .888 3.708l.568.673c.181.215.279.49.279.775 0 .748-.805 1.198-1.488.884l-.795-.436a4.004 4.004 0 0 0-3.353-.08l-.803.385c-1.092.523-1.921 1.459-2.246 2.651l-.234.86c-.207.76-.884 1.26-1.667 1.26h-.056c-.783 0-1.46-.5-1.667-1.26l-.234-.86a4 4 0 0 0-2.246-2.651l-.803-.385a4.002 4.002 0 0 0-3.353.08l-.794.436c-.683.314-1.488-.136-1.488-.884 0-.285.098-.56.279-.775l.568-.673a3.999 3.999 0 0 0 .888-3.708l-.208-.913a3.999 3.999 0 0 0-1.748-2.666l-.76-.471c-.628-.389-.628-1.173 0-1.562l.76-.471c.901-.56 1.494-1.548 1.748-2.666l.208-.913c.297-1.298-.03-2.692-.888-3.708l-.568-.673a1.2 1.2 0 0 1-.279-.775c0-.748.805-1.198 1.488-.884l.794.436a4.004 4.004 0 0 0 3.353-.08l.803-.385c1.092-.523 1.921-1.459 2.246-2.651l.234-.86c.207-.759.884-1.259 1.667-1.259ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2.5 4a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0Z"></path>
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
