import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "GitPulse",
    description: "GitHub's Social Layer",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen bg-git-bg text-git-text">
                {/* 3-Column Layout Shell */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center gap-6 py-6">

                        {/* Left Nav (240px) */}
                        <aside className="hidden w-[240px] shrink-0 border-r border-git-border pr-6 lg:block">
                            <nav className="sticky top-6 flex flex-col gap-4">
                                <div className="font-mono text-xl font-bold tracking-tight text-git-text">
                                    GitPulse<span className="text-git-green">.</span>
                                </div>
                                {/* Nav Links Placeholder */}
                                <div className="mt-4 flex flex-col gap-2">
                                    <span className="cursor-pointer rounded-md bg-git-card px-3 py-2 text-sm font-medium text-git-text border border-git-border">Home</span>
                                    <span className="cursor-pointer rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">Discover</span>
                                    <span className="cursor-pointer rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">Notifications</span>
                                    <span className="cursor-pointer rounded-md px-3 py-2 text-sm text-git-muted hover:bg-git-card hover:text-git-text transition-colors">Profile</span>
                                </div>
                            </nav>
                        </aside>

                        {/* Center Feed (600px Max) */}
                        <main className="flex-1 max-w-[600px] border border-git-border rounded-xl bg-git-card p-6 min-h-[80vh]">
                            {children}
                        </main>

                        {/* Right Sidebar (300px) */}
                        <aside className="hidden w-[300px] shrink-0 lg:block">
                            <div className="sticky top-6 flex flex-col gap-6">

                                {/* Trending Repos Box */}
                                <div className="rounded-xl border border-git-border bg-git-card p-4">
                                    <h3 className="font-semibold text-git-text mb-4">Trending Repos</h3>
                                    <div className="space-y-3">
                                        <div className="text-sm text-git-muted italic">Repo list loading...</div>
                                    </div>
                                </div>

                                {/* Who to Ship With Box */}
                                <div className="rounded-xl border border-git-border bg-git-card p-4">
                                    <h3 className="font-semibold text-git-text mb-4">Who to ship with</h3>
                                    <div className="space-y-3">
                                        <div className="text-sm text-git-muted italic">Suggestions loading...</div>
                                    </div>
                                </div>

                            </div>
                        </aside>

                    </div>
                </div>
            </body>
        </html>
    );
}
