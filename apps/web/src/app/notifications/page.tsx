import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, string> = {
    TRENDING: "🔥",
    BADGE: "✅",
    FOLLOW: "👤",
    SYSTEM: "📢",
};

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    // Mark all unread as read on page load
    await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
    });

    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            <h1 className="text-xl font-semibold text-git-text mb-6">Notifications</h1>

            {notifications.length === 0 ? (
                <div className="text-center py-16 text-git-muted text-sm">
                    <svg height="48" viewBox="0 0 16 16" width="48" className="fill-git-muted mx-auto mb-4 opacity-40">
                        <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z" />
                    </svg>
                    <p>No notifications yet.</p>
                    <p className="mt-1 text-xs">When someone follows you or your repos trend, you&apos;ll see it here.</p>
                </div>
            ) : (
                <ul className="border border-git-border rounded-lg overflow-hidden divide-y divide-git-border">
                    {notifications.map((n) => {
                        const inner = (
                            <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#161b22] transition-colors">
                                <span className="text-lg shrink-0 mt-0.5">
                                    {TYPE_ICONS[n.type] || "📢"}
                                </span>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm text-git-text leading-snug">{n.message}</span>
                                    <span className="text-[11px] text-git-muted mt-1">{getRelativeTime(n.createdAt)}</span>
                                </div>
                            </div>
                        );

                        return n.linkUrl ? (
                            <li key={n.id}>
                                <Link href={n.linkUrl}>{inner}</Link>
                            </li>
                        ) : (
                            <li key={n.id}>{inner}</li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
