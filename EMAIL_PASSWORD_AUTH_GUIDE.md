# Email & Password Authentication Setup Guide

## What Was Implemented

I've added complete email and password authentication to your GitPulse project. Here's what was created:

### 1. **Database Schema Changes**
- **File**: `apps/web/prisma/schema.prisma`
- Made `githubId` optional (null) so users can sign up with email/password
- Made `username` optional for email-only users
- Added `password` field to store hashed passwords

### 2. **Password Hashing Utility**
- **File**: `apps/web/src/lib/password.ts`
- `hashPassword()` - Hashes passwords using bcryptjs
- `comparePassword()` - Verifies passwords against hashes

### 3. **Authentication Configuration**
- **Files**: 
  - `apps/web/src/lib/auth.config.ts` - Added Credentials provider
  - `apps/web/src/lib/auth.ts` - Updated JWT callback to handle email/password auth
- Integrated Credentials provider alongside GitHub OAuth
- Handles both GitHub OAuth and email/password flows

### 4. **Signup API Endpoint**
- **File**: `apps/web/src/app/api/auth/signup/route.ts`
- POST endpoint at `/api/auth/signup`
- Validates email and password
- Checks for duplicate emails
- Hashes passwords securely
- Creates new user accounts

### 5. **Signup Page**
- **File**: `apps/web/src/app/signup/page.tsx`
- Full signup form with email, name, and password fields
- Password confirmation validation
- Error handling
- Link to login page
- GitHub signup option

### 6. **Updated Login Page**
- **File**: `apps/web/src/app/login/page.tsx`
- Toggle between GitHub OAuth and email/password login
- Full email/password form
- Error messages for invalid credentials
- Link to signup page

## Next Steps to Complete Setup

### 1. **Install bcryptjs**
Run this command in your workspace root:

```bash
pnpm add -w bcryptjs
pnpm add -w -D @types/bcryptjs
```

Alternative (if using npm):
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. **Run Database Migration**
Create and apply the Prisma migration:

```bash
cd apps/web
npx prisma migrate dev --name add_email_password_auth
```

This will:
- Create a migration file in `prisma/migrations/`
- Apply it to your PostgreSQL database
- Update Prisma client

### 3. **Test the Implementation**

**Sign Up (new user):**
1. Go to `http://localhost:3000/signup`
2. Enter email, name, and password
3. Click "Create account"
4. Should be automatically logged in and redirected to home

**Log In (existing user):**
1. Go to `http://localhost:3000/login`
2. Click "Sign in with Email"
3. Enter email and password
4. Click "Sign in"
5. Should be logged in and redirected to home

**GitHub OAuth:**
- Still works as before
- Multiple auth methods on same login page

## How It Works

### Signup Flow
1. User fills signup form with email, name, password
2. Frontend POSTs to `/api/auth/signup`
3. Backend validates input and checks for duplicate email
4. Password is hashed using bcryptjs (12 salt rounds)
5. User created in database with hashed password
6. User is automatically logged in using NextAuth Credentials provider

### Login Flow
1. User enters email and password
2. NextAuth Credentials provider processes the request
3. JWT callback looks up user by email and verifies password
4. If valid, creates authenticated session
5. User is logged in and redirected

### Database Structure
Users can now have these combinations:
- **GitHub-only**: `githubId` set, `email` optional, `password` null
- **Email-only**: `githubId` null, `email` required, `password` hashed
- **Both**: `githubId` set, `email` set, `password` hashed

## Security Features

✅ Passwords hashed with bcryptjs (12 salt rounds)
✅ Email validation on signup
✅ Minimum 8-character password requirement
✅ Password confirmation on signup
✅ Duplicate email prevention
✅ Protected API endpoint
✅ Server-side validation

## File Changes Summary

| File | Status | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Added password field |
| `src/lib/password.ts` | Created | Hashing utilities |
| `src/lib/auth.config.ts` | Modified | Added Credentials provider |
| `src/lib/auth.ts` | Modified | Updated JWT callback |
| `src/app/api/auth/signup/route.ts` | Created | Signup endpoint |
| `src/app/signup/page.tsx` | Created | Signup page |
| `src/app/login/page.tsx` | Modified | Added email/password form |

## Troubleshooting

### Q: "Module not found: bcryptjs"
A: Install bcryptjs with the command above

### Q: "Invalid email already in use"
A: This email is already registered. Use a different email or go to login page

### Q: "Password must be at least 8 characters"
A: Ensure your password is 8+ characters

### Q: Migration won't run
A: Make sure:
1. PostgreSQL database is running
2. `DATABASE_URL` env var is set in `.env.local`
3. You have proper database permissions

## Future Enhancements

Consider adding:
- Password reset flow
- Email verification
- Social login providers (Google, etc.)
- Two-factor authentication
- Account recovery options

Enjoy your new authentication system! 🚀
