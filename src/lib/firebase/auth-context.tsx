"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Only these email addresses can access the admin portal
const ALLOWED_EMAILS = ["joeytomsfbr@gmail.com"];

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
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const isAuthorized = !!user && ALLOWED_EMAILS.includes(user.email || "");

  async function signIn() {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
