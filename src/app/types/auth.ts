import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "user" | "admin";

export type UserProfile = {
  id: string;
  authUserId: string;
  directoryPersonId: string | null;
  email: string;
  fullName: string;
  role: AppRole;
  mustChangePassword: boolean;
  isActive: boolean;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
};

export type AuthenticatedUser = {
  session: Session;
  user: User;
  profile: UserProfile;
};

export type AuthState =
  | { status: "loading"; session: null; profile: null; error: null }
  | { status: "unauthenticated"; session: null; profile: null; error: string | null }
  | { status: "authenticated"; session: Session; profile: UserProfile; error: null }
  | { status: "error"; session: null; profile: null; error: string };
