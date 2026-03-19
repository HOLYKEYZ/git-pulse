import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
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

                        {/* Main Content Area — Pages dictate their own width and right sidebars */}
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav username={session?.user?.login} />
            </body>
        </html>
    );
}
