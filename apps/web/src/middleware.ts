import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig);
import * as Joi from 'joi';
const validateInput = (input: any) => {
  const schema = Joi.object().keys({
    // Define the expected structure of the input
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
  });
  const result = schema.validate(input);
  if (result.error) {
    throw new Error(result.error.details[0].message);
  }
};

// routes that unauthenticated users can access
const PUBLIC_ROUTES = ['/', '/explore', '/login', '/signout'];

export default auth((req) => {
  try {
    validateInput(req);
  } catch (error) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
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

