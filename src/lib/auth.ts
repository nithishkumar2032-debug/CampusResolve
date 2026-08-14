import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_HOME } from "./constants";
import { findProfileById } from "./demo-store";
import type { Profile, UserRole } from "./types";

const SESSION_COOKIE = "cr_session";

export async function getSessionUser(): Promise<Profile | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const profile = await findProfileById(id);
  if (!profile) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = profile;
  return safe as Profile;
}

export async function requireUser(roles?: UserRole[]): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
