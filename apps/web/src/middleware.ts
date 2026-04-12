import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig);

// routes that unauthenticated users can access
const PUBLIC_ROUTES = ['/', '/explore', '/login', '/signout'];

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const isAuthPage = pathname.startsWith('/login');
    const isPublicRoute = PUBLIC_ROUTES.some(route =>
        route === '/' ? pathname === '/' : pathname.startsWith(route)
    );
    const isAdminRoute = pathname.startsWith('/admin');
    const isAlgoRoute = pathname.startsWith('/algo');

    // if logged in and trying to access login page, redirect to home
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    // allow public routes for everyone
    if (isPublicRoute) {
        return null;
    }

    // redirect unauthenticated users to login for protected routes
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    // admin routes require authentication (admin role check happens in the api/page)
    // algo route requires authentication

    return null;
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.jpg$|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.gif$|.*\\.ico$|manifest\\.json).*)'],
}

