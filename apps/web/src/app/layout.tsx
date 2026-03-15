import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const dynamic = "force-dynamic";

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
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center gap-6 py-6">

                        {/* Left Nav — async, wrapped in Suspense */}
                        <Suspense fallback={<div className="hidden w-[240px] shrink-0 lg:block" />}>
                            <Sidebar />
                        </Suspense>

                        {/* Center Feed (600px Max) */}
                        <main className="flex-1 max-w-[600px] border border-git-border rounded-xl bg-git-card min-h-[80vh]">
                            {children}
                        </main>

                        {/* Right Sidebar (300px) */}
                        <aside className="hidden w-[300px] shrink-0 lg:block">
                            <div className="sticky top-6 flex flex-col gap-6">
                                <div className="rounded-xl border border-git-border bg-git-card p-4">
                                    <h3 className="font-semibold text-git-text mb-4">Trending Repos</h3>
                                    <div className="space-y-3">
                                        <div className="text-sm text-git-muted italic">Repo list loading...</div>
                                    </div>
                                </div>
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
