import Constants from "expo-constants";
import type { AuthUser, OperationResult } from "../types";
import { authRepository, runRepository } from "../data/repositories";

export interface AuthState {
  user: AuthUser | null;
  skipped: boolean;
}

export type GoogleSignInErrorCode =
  | "unavailable"
  | "cancelled"
  | "in-progress"
  | "no-client-id"
  | "failed";

export class GoogleSignInError extends Error {
  code: GoogleSignInErrorCode;

  constructor(code: GoogleSignInErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type GoogleSigninModule = {
  configure: (config: Record<string, unknown>) => void;
  hasPlayServices: (options?: Record<string, unknown>) => Promise<void>;
  signIn: () => Promise<{
    type?: string;
    data?: { user?: { id?: string; email?: string; name?: string | null; photo?: string | null } };
    user?: { id?: string; email?: string; name?: string | null; photo?: string | null };
  }>;
  signOut: () => Promise<void>;
  isSignedIn?: () => Promise<boolean>;
  getCurrentUser?: () => Promise<{
    user?: { id?: string; email?: string; name?: string | null; photo?: string | null };
  } | null>;
};

let configured = false;

const getWebClientId = (): string | null => {
  const extra = (
    Constants.expoConfig?.extra ??
    Constants.manifest2?.extra ??
    {}
  ) as Record<string, unknown>;
  const google = extra.google as Record<string, unknown> | undefined;
  const webClientId =
    (google?.webClientId as string | undefined) ??
    (extra.googleWebClientId as string | undefined);
  return typeof webClientId === "string" && webClientId.length > 0
    ? webClientId
    : null;
};

const loadGoogleModule = (): GoogleSigninModule | null => {
  try {
    // Lazy require so Expo Go / web (where the native module is absent)
    // keeps working in offline mode instead of crashing on import.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-google-signin/google-signin") as {
      GoogleSignin?: GoogleSigninModule;
    };
    return mod.GoogleSignin ?? null;
  } catch {
    return null;
  }
};

export const isGoogleSignInAvailable = (): boolean =>
  loadGoogleModule() !== null;

const ensureConfigured = (): GoogleSigninModule => {
  const GoogleSignin = loadGoogleModule();
  if (!GoogleSignin) {
    throw new GoogleSignInError(
      "unavailable",
      "Google Sign-In needs a development build (it is not available in Expo Go).",
    );
  }
  if (!configured) {
    GoogleSignin.configure({
      webClientId: getWebClientId() ?? undefined,
      offlineAccess: false,
    });
    configured = true;
  }
  return GoogleSignin;
};

export const loadAuthState = (): Promise<OperationResult<AuthState>> =>
  runRepository(async () => {
    const [user, skipped] = await Promise.all([
      authRepository.loadUser(),
      authRepository.loadSkipped(),
    ]);
    return { user, skipped };
  });

export const signInWithGoogle = (): Promise<OperationResult<AuthUser>> =>
  runRepository(async () => {
    const GoogleSignin = ensureConfigured();
    if (!getWebClientId()) {
      throw new GoogleSignInError(
        "no-client-id",
        "Google webClientId is not configured (app.json extra.google.webClientId).",
      );
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    // google-signin v16 resolves (not rejects) on cancellation.
    if (response.type === "cancelled") {
      throw new GoogleSignInError("cancelled", "Google sign-in was cancelled.");
    }
    const rawUser = response.data?.user;
    if (!rawUser?.email) {
      throw new GoogleSignInError("failed", "Google sign-in returned no email.");
    }
    const user: AuthUser = {
      id: String(rawUser.id ?? rawUser.email),
      email: rawUser.email,
      name: rawUser.name ?? null,
      photo: rawUser.photo ?? null,
    };
    await authRepository.saveUser(user);
    await authRepository.saveSkipped(false);
    return user;
  });

export const signOutEverywhere = (): Promise<OperationResult<void>> =>
  runRepository(async () => {
    const GoogleSignin = loadGoogleModule();
    if (GoogleSignin) {
      try {
        await GoogleSignin.signOut();
      } catch (err) {
        console.warn("Google signOut failed (local session still cleared):", err);
      }
    }
    // Keep the offline CSV data — signing out only forgets the account.
    await authRepository.clearUser();
    await authRepository.saveSkipped(false);
  });

export const skipSignIn = (): Promise<OperationResult<void>> =>
  runRepository(() => authRepository.saveSkipped(true));

export const clearSkip = (): Promise<OperationResult<void>> =>
  runRepository(() => authRepository.saveSkipped(false));

export const describeSignInError = (error: unknown): string => {
  const nat =
    error instanceof GoogleSignInError
      ? `${error.code}: ${error.message}`
      : (() => {
          const e = error as { code?: unknown; message?: unknown } | null;
          const code = e?.code != null ? String(e.code) : "no-code";
          const message =
            e?.message != null ? String(e.message) : String(error);
          return `${code}: ${message}`;
        })();
  const clientId = getWebClientId();
  const maskedClient = clientId
    ? `${clientId.slice(0, 12)}...${clientId.slice(-20)}`
    : "MISSING";
  return `webClientId=${maskedClient} | error=${nat}`;
};

export const mapSignInError = (error: unknown): string => {
  if (error instanceof GoogleSignInError) {
    switch (error.code) {
      case "cancelled":
        return "auth.cancelled";
      case "unavailable":
        return "auth.unavailable";
      case "no-client-id":
        return "auth.noClientId";
      default:
        return "auth.failed";
    }
  }
  // Native errors carry numeric GoogleSignInStatusCodes (as strings) on
  // Android, e.g. 12501 cancelled, 10 DEVELOPER_ERROR, 7 NETWORK_ERROR.
  // Log in release too so the exact code is visible while diagnosing.
  console.warn("Google sign-in error:", describeSignInError(error));
  const code = String((error as { code?: unknown } | null)?.code ?? "");
  if (code === "12501" || code.includes("SIGN_IN_CANCELLED")) {
    return "auth.cancelled";
  }
  if (code === "12502" || code.includes("IN_PROGRESS")) {
    return "auth.inProgress";
  }
  if (code.includes("PLAY_SERVICES")) return "auth.noPlayServices";
  if (code === "10" || code.includes("DEVELOPER_ERROR")) {
    return "auth.developerError";
  }
  if (code === "7" || code.includes("NETWORK_ERROR")) {
    return "auth.networkError";
  }
  return "auth.failed";
};
