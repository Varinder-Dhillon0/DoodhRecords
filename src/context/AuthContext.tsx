import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, OperationResult } from "../types";
import {
  clearSkip,
  loadAuthState,
  signInWithGoogle,
  signOutEverywhere,
  skipSignIn,
} from "../services/authService";

interface AuthContextType {
  user: AuthUser | null;
  skipped: boolean;
  isAuthLoading: boolean;
  isSigningIn: boolean;
  loadAuth: () => Promise<void>;
  signIn: () => Promise<OperationResult<AuthUser>>;
  signOut: () => Promise<OperationResult<void>>;
  skip: () => Promise<void>;
  unskip: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const loadAuth = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const result = await loadAuthState();
      if (result.ok) {
        setUser(result.value.user);
        setSkipped(result.value.skipped);
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuth();
  }, [loadAuth]);

  const signIn = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();
      if (result.ok) {
        setUser(result.value);
        setSkipped(false);
      }
      return result;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const result = await signOutEverywhere();
    if (result.ok) {
      setUser(null);
      setSkipped(false);
    }
    return result;
  }, []);

  const skip = useCallback(async () => {
    const result = await skipSignIn();
    if (result.ok) setSkipped(true);
  }, []);

  const unskip = useCallback(async () => {
    const result = await clearSkip();
    if (result.ok) setSkipped(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      skipped,
      isAuthLoading,
      isSigningIn,
      loadAuth,
      signIn,
      signOut,
      skip,
      unskip,
    }),
    [user, skipped, isAuthLoading, isSigningIn, loadAuth, signIn, signOut, skip, unskip],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
