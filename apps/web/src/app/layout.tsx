import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
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

                        {/* Right Sidebar — async, wrapped in Suspense */}
                        <Suspense fallback={<div className="hidden w-[300px] shrink-0 lg:block" />}>
                            <RightSidebar />
                        </Suspense>
                    </div>
                </div>
            </body>
        </html>
    );
}
