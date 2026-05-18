'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setLoading(false);
      setError(data?.error ?? 'Failed to create account.');
      return;
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/',
    });

    setLoading(false);

    if (result?.error) {
      setError('Account created, but sign in failed. Try signing in.');
      return;
    }

    window.location.href = result?.url ?? '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-git-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-git-border bg-git-card p-10 shadow-xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mt-2">
            <Image src="/logo.png" alt="GitPulse" width={80} height={80} className="rounded-2xl" priority />
            <h2 className="text-3xl font-bold tracking-tight text-git-text">
              GitPulse
            </h2>
          </div>
          <p className="mt-2 text-sm text-git-muted">
            Create your account
          </p>
        </div>

        <button
          type="button"
          onClick={() => signIn('github', { callbackUrl: '/' })}
          className="flex w-full justify-center rounded-md bg-git-green px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
        >
          Sign up with GitHub
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-git-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-git-card px-2 text-git-muted">or sign up manually</span>
          </div>
        </div>

        <form onSubmit={handleManualSignUp} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            required
            className="w-full rounded-md border border-git-border bg-git-bg px-3 py-3 text-sm text-git-text outline-none focus:border-git-green"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-md border border-git-border bg-git-bg px-3 py-3 text-sm text-git-text outline-none focus:border-git-green"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            minLength={8}
            required
            className="w-full rounded-md border border-git-border bg-git-bg px-3 py-3 text-sm text-git-text outline-none focus:border-git-green"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md border border-git-border bg-git-bg px-3 py-3 text-sm font-semibold text-git-text shadow-sm hover:bg-git-hover disabled:opacity-60 transition-colors"
          >
            {loading ? 'Creating account...' : 'Create account with email'}
          </button>
        </form>

        <p className="text-center text-sm text-git-muted">
          Already have an account? <Link href="/login" className="font-semibold text-git-green hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
