"use client";

import type React from "react";
import { createContext, useContext } from "react";
import { SessionProvider, useSession } from "next-auth/react";

interface AuthContextType {
  user: any | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        status,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}