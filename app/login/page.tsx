"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const router = useRouter();

  // Fetch whether Google OAuth is configured (from server)
  useEffect(() => {
    async function checkProviders() {
      try {
        const res = await fetch("/api/auth/providers");
        const data = await res.json();
        setGoogleEnabled(!!data.google);
      } catch (e) {
        setGoogleEnabled(false);
      } finally {
        setProvidersLoading(false);
      }
    }
    checkProviders();
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const result = await signIn("google", { callbackUrl: "/", redirect: false });
    if (result?.error) {
      setError("Google login failed. Please check your OAuth configuration (invalid_client often means wrong Client ID/Secret or missing redirect URI in Google Cloud Console).");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0A3D62] text-white text-3xl font-bold tracking-tighter mb-4">
            GR
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Greek Business Websites</h1>
          <p className="text-zinc-600 mt-2">Sign in to access the website generator</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
          {/* Google Sign In - only show if configured on the server */}
          {!providersLoading && googleEnabled && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border border-zinc-300 hover:bg-zinc-50 transition-colors rounded-xl py-3 font-medium disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.34z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="mt-2 mb-4 text-[10px] text-zinc-500 text-center">
                Make sure your Google OAuth client has the correct redirect URI: <br />
                <code className="text-[9px]">http://localhost:3000/api/auth/callback/google</code> (local) and your production URL.
              </div>

              <div className="my-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-xs uppercase tracking-widest text-zinc-500">or</span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>
            </>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62] focus:border-transparent"
                placeholder="you@company.gr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A3D62] hover:bg-[#062B47] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in with email"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Protected area. Contact your administrator for access.
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Greek Business Website Creator — Internal tool
        </p>
      </div>
    </div>
  );
}
