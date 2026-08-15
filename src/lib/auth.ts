import { redirect } from "next/navigation";
import { ROLE_HOME } from "./constants";
import { createClient } from "./supabase/server";
import type { Profile, UserRole } from "./types";

export { safeInternalPath } from "./safe-path";

export async function getSessionUser(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, hostel_block, active, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) return null;
  if (profile.active === false) return null;

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    hostel_block: profile.hostel_block,
    active: profile.active ?? true,
    created_at: profile.created_at,
    updated_at: profile.updated_at ?? profile.created_at,
  };
}

export async function requireUser(roles?: UserRole[]): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}
