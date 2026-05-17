'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [useEmailPassword, setUseEmailPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        try {
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                setLoading(false);
                return;
            }

            router.push('/');
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleGitHubSignIn = async () => {
        await signIn('github', { redirectTo: '/' });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-git-bg px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl border border-git-border bg-git-card p-10 shadow-xl">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mt-6">
                        <svg height="40" viewBox="0 0 16 16" width="40" className="fill-git-text">
                            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                        </svg>
                        <h2 className="text-3xl font-bold tracking-tight text-git-text">
                            GitPulse
                        </h2>
                    </div>
                    <p className="mt-2 text-sm text-git-muted">
                        GitHub&apos;s Social Layer.
                    </p>
                </div>

                {!useEmailPassword ? (
                    <>
                        <div className="mt-8">
                            <form
                                action={async () => {
                                    'use server';
                                    const { signIn: authSignIn } = await import('@/lib/auth');
                                    await authSignIn('github', { redirectTo: '/' });
                                }}
                            >
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-git-green px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                                >
                                    Sign in with GitHub
                                </button>
                            </form>

                            <p className="mt-6 text-center text-xs text-git-muted">
                                By signing in, you agree that GitPulse will request read-only access to your public repositories.
                            </p>

                            <div className="relative mt-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-git-border"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-git-card px-2 text-git-muted">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setUseEmailPassword(true)}
                                className="mt-6 w-full rounded-md border border-git-border px-3 py-3 text-sm font-semibold text-git-text shadow-sm hover:bg-git-border/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                            >
                                Sign in with Email
                            </button>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-git-muted">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="font-medium text-git-green hover:text-[#2ea043]">
                                        Sign up
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-900/50">
                                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-git-text">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="mt-2 block w-full rounded-md border border-git-border bg-git-bg px-3 py-2 text-git-text placeholder-git-muted focus:border-git-green focus:outline-none focus:ring-2 focus:ring-git-green/20"
                                    placeholder="you@example.com"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-git-text">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="mt-2 block w-full rounded-md border border-git-border bg-git-bg px-3 py-2 text-git-text placeholder-git-muted focus:border-git-green focus:outline-none focus:ring-2 focus:ring-git-green/20"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-git-green px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={() => {
                                setUseEmailPassword(false);
                                setError('');
                                setFormData({ email: '', password: '' });
                            }}
                            className="w-full rounded-md border border-git-border px-3 py-3 text-sm font-semibold text-git-text shadow-sm hover:bg-git-border/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                        >
                            Back to GitHub
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-git-muted">
                                Don&apos;t have an account?{' '}
                                <Link href="/signup" className="font-medium text-git-green hover:text-[#2ea043]">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
