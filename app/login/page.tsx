"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create basic profile
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          role: "CUSTOMER", // Default role
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex items-stretch font-sans">
      <div className="hidden lg:flex flex-1 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none p-12 overflow-hidden select-none">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="text-[10vw] font-black text-white tracking-tighter leading-none whitespace-nowrap -ml-24 rotate-[-12deg]">
              MKTP CORE MKTP CORE MKTP CORE
            </div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-end p-20 text-white">
          <div className="flex items-center gap-2 font-extrabold text-2xl text-white mb-8">
            <div className="bg-white w-8 h-8 rounded" />
            MKTP CORE
          </div>
          <h2 className="text-7xl font-extrabold tracking-tighter leading-none mb-6">
            Design. Build. <br />Dominate.
          </h2>
          <p className="text-xl text-blue-100 font-medium tracking-wide max-w-md">
            The foundation for production-ready marketplaces. SEO optimized and built for performance.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center py-12 px-8 lg:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-3xl font-bold text-text-main mb-2 tracking-tight">Access your portal</h1>
            <p className="text-text-muted font-medium">Continue with Google to access your core account.</p>
          </div>

          <div className="space-y-6">
            {error && (
              <p className="text-red-600 text-[11px] font-bold uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 italic">
                {error}
              </p>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-5 px-4 border border-border-main text-sm font-bold rounded-xl text-text-main bg-white hover:bg-slate-50 transition-all duration-300 uppercase tracking-[0.2em] shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              {loading ? "Connecting..." : "Continue with Google"}
            </button>
          </div>

          <p className="mt-10 text-sm text-text-muted font-medium text-center">
            New to MKTP Core?{" "}
            <Link href="/register" className="text-primary font-bold hover:underline underline-offset-4 decoration-2 transition-all">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
