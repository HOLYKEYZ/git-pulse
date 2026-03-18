import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import BottomNav from "@/components/BottomNav";
import { SidebarSkeleton } from "@/components/Skeletons";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: {
        default: "GitPulse | GitHub's Social Layer",
        template: "%s | GitPulse",
    },
    description: "The social network for developers. Share your ships, engage with your network, and pulse with the heartbeat of GitHub.",
    icons: {
        icon: "/icon.png",
        apple: "/icon.png",
    },
    manifest: "/manifest.json",
    openGraph: {
        title: "GitPulse",
        description: "GitHub's Social Layer",
        url: "https://git-pulse.vercel.app",
        siteName: "GitPulse",
        images: [
            {
                url: "/logo.png",
                width: 1024,
                height: 1024,
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "GitPulse",
        description: "GitHub's Social Layer",
        images: ["/logo.png"],
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <html lang="en">
            <body className={`${inter.variable} antialiased min-h-screen bg-git-bg text-git-text overflow-x-hidden font-sans`}>
                <div className="mx-auto max-w-7xl px-0 sm:px-6 lg:px-8 pb-20 lg:pb-0">
                    <div className="flex justify-center gap-0 lg:gap-6 py-0 lg:py-6">

                        {/* Left Nav — async, wrapped in Suspense */}
                        <Suspense fallback={<div className="hidden w-[240px] shrink-0 lg:block"><SidebarSkeleton /></div>}>
                            <Sidebar />
                        </Suspense>

                        {/* Center Feed (600px Max) */}
                        <main className="flex-1 w-full max-w-[600px] border-x border-b lg:border border-git-border lg:rounded-xl bg-git-card min-h-[80vh]">
                            {children}
                        </main>

                        {/* Right Sidebar — async, wrapped in Suspense */}
                        <Suspense fallback={<div className="hidden w-[300px] shrink-0 lg:block"><SidebarSkeleton /></div>}>
                            <RightSidebar />
                        </Suspense>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav username={session?.user?.login} />
            </body>
        </html>
    );
}
