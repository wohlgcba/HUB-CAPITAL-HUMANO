import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import {
  changePassword as changePasswordRequest,
  getCurrentSession,
  getProfile,
  hydrateAuthenticatedUser,
  requestPasswordReset,
  signIn as signInRequest,
  signOut as signOutRequest,
} from "../services/authService";
import { getErrorMessage } from "../services/serviceError";
import type { AuthState } from "../types/auth";

type AuthContextValue = AuthState & {
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const initialState: AuthState = { status: "loading", session: null, profile: null, error: null };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const mountedRef = useRef(true);

  const syncSession = useCallback(async (session: Session | null) => {
    if (!session) {
      if (mountedRef.current) setState({ status: "unauthenticated", session: null, profile: null, error: null });
      return;
    }

    try {
      const authenticated = await hydrateAuthenticatedUser(session);
      if (mountedRef.current) {
        setState({ status: "authenticated", session, profile: authenticated.profile, error: null });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({
          status: "error",
          session: null,
          profile: null,
          error: getErrorMessage(error, "No se pudo validar el usuario."),
        });
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void getCurrentSession()
      .then(syncSession)
      .catch((error: unknown) => {
        if (!mountedRef.current) return;
        setState({
          status: "error",
          session: null,
          profile: null,
          error: getErrorMessage(error, "No se pudo recuperar la sesión."),
        });
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
      if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
      window.setTimeout(() => void syncSession(session), 0);
    });

    return () => {
      mountedRef.current = false;
      data.subscription.unsubscribe();
    };
  }, [syncSession]);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    setState(initialState);
    try {
      const authenticated = await signInRequest(email, password, remember);
      setState({
        status: "authenticated",
        session: authenticated.session,
        profile: authenticated.profile,
        error: null,
      });
    } catch (error) {
      const message = getErrorMessage(error, "No se pudo iniciar sesión.");
      setState({ status: "unauthenticated", session: null, profile: null, error: message });
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setIsPasswordRecovery(false);
    setState({ status: "unauthenticated", session: null, profile: null, error: null });
  }, []);

  const changePassword = useCallback(
    async (password: string) => {
      if (state.status !== "authenticated") throw new Error("No hay una sesión activa.");
      await changePasswordRequest(password);
      const profile = await getProfile(state.session.user.id);
      setIsPasswordRecovery(false);
      setState({ status: "authenticated", session: state.session, profile, error: null });
    },
    [state],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isPasswordRecovery,
      signIn,
      signOut,
      changePassword,
      sendPasswordReset: requestPasswordReset,
    }),
    [changePassword, isPasswordRecovery, signIn, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe utilizarse dentro de AuthProvider.");
  return context;
}
