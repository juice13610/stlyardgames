"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Only these email addresses can access the admin portal
const ALLOWED_EMAILS = ["joeytomsfbr@gmail.com", "joey.toms@gmail.com", "rcfacedesigns@gmail.com"];

interface AuthContext {
  user: User | null;
  loading: boolean;
  isAuthorized: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  loading: true,
  isAuthorized: false,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result on page load
    getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const isAuthorized = !!user && ALLOWED_EMAILS.includes(user.email || "");

  async function signIn() {
    const provider = new GoogleAuthProvider();
    try {
      // Try popup first; fall back to redirect if blocked
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e.code === "auth/popup-blocked" || e.code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, provider);
      } else {
        throw e;
      }
    }
  }

  async function signOutUser() {
    await signOut(auth);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, isAuthorized, signIn, signOut: signOutUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
