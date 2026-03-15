import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith('/login')

    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL('/', req.nextUrl))
        }
        return null
    }

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }

    return null
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
