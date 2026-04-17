"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleRegister = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create or update user profile in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          role: role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // If user already exists, maybe update the role if they're trying to re-register?
        // For now, just proceed if existing
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "An error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 font-extrabold text-2xl text-primary">
            <div className="bg-primary w-8 h-8 rounded" />
            MKTP CORE
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-text-main tracking-tight">
          Create destiny
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted font-medium">
          Start building your production-ready marketplace
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-10 px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-border-main">
          <div className="space-y-8">
            <div>
              <label htmlFor="role" className="block text-[11px] font-bold text-text-muted uppercase tracking-[0.2em] mb-3">
                Primary Use Case
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none block w-full px-5 py-4 border border-border-main rounded-xl bg-slate-50 text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
              >
                <option value="CUSTOMER">Buyer / Customer</option>
                <option value="DEVELOPER">Vendor / Developer</option>
              </select>
            </div>

            {error && (
              <p className="text-red-600 text-[11px] font-bold uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100 italic">
                {error}
              </p>
            )}

            <button
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full flex items-center justify-center gap-4 py-5 px-4 border border-border-main text-sm font-bold rounded-xl text-text-main bg-white hover:bg-slate-50 transition-all duration-300 uppercase tracking-[0.2em] shadow-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              {loading ? "Connecting..." : "Register with Google"}
            </button>
          </div>

          <div className="mt-8 text-center border-t border-slate-100 pt-8">
            <Link href="/login" className="text-sm font-bold text-text-muted hover:text-primary transition-colors uppercase tracking-widest">
              Already have an account? <span className="text-primary hover:underline underline-offset-4 decoration-2">Sign in</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-text-muted font-medium uppercase tracking-[0.3em] opacity-40">
        Secure Infrastructure • MKTP Core v1.0
      </div>
    </div>
  );
}
