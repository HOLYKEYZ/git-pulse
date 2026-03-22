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
            <body className={`${inter.variable} antialiased min-h-screen bg-black text-[#e7e9ea] overflow-x-hidden font-sans`}>
                <div className="mx-auto w-full max-w-[1300px] pb-20 lg:pb-0">
                    <div className="flex justify-center">

                        {/* Left Nav — async, wrapped in Suspense */}
                        <Suspense fallback={<div className="hidden w-[275px] shrink-0 xl:block"><SidebarSkeleton /></div>}>
                            <Sidebar />
                        </Suspense>

                        {/* Main Content Area — Pages dictate their own width and right sidebars */}
                        <main className="flex-1 min-w-0 border-x border-[#2f3336]">
                            {children}
                        </main>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <BottomNav username={session?.user?.login} />
            </body>
        </html>
    );
}
